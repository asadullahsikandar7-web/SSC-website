import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { hashPassword } from '../lib/auth';
import { sendMembershipDecisionEmail } from '../lib/membershipEmail';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { MemberInvite } from '../models/MemberInvite';
import { MembershipApplication } from '../models/MembershipApplication';
import { User } from '../models/User';

const router = Router();

const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  studentId: z.string().trim().min(3).max(40),
  department: z.string().trim().min(2).max(120),
  semester: z.string().trim().min(1).max(40),
  universityEmail: z.string().trim().email().max(254),
  phoneNumber: z.string().trim().max(40).optional(),
  areasOfInterest: z.array(z.string().trim().min(1).max(80)).max(8),
  motivationStatement: z.string().trim().max(1200).optional(),
  preferredLanguage: z.enum(['en', 'ur', 'skr']),
  privacyAcknowledged: z.literal(true),
});

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().trim().max(500).optional(),
}).refine(
  (value) => value.decision !== 'rejected' || Boolean(value.rejectionReason),
  { message: 'A reason is required when rejecting an application.', path: ['rejectionReason'] },
);

const accountSetupSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(12).max(200),
});

function applicationUrl(requestOrigin?: string) {
  const configuredUrl = process.env.APP_URL ?? process.env.app_url;
  if (configuredUrl) return new URL(configuredUrl).origin;

  const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return new URL(requestOrigin).origin;
  return allowedOrigins[0] ? new URL(allowedOrigins[0]).origin : 'http://localhost:5173';
}

async function issueMemberActivation(application: InstanceType<typeof MembershipApplication>, requestOrigin?: string) {
  let user = await User.findOne({ email: application.universityEmail });
  if (user && user.role !== 'member') return { status: 'existing_staff_account' as const };

  if (!user) {
    const names = application.fullName.trim().split(/\s+/);
    user = await User.create({
      email: application.universityEmail,
      passwordHash: await hashPassword(randomBytes(48).toString('hex')),
      firstName: names[0],
      lastName: names.slice(1).join(' '),
      role: 'member',
      isActive: true,
    });
  }

  const existingMember = await Member.findOne({ $or: [{ userId: user._id }, { studentId: application.studentId }] });
  if (existingMember && String(existingMember.userId) !== String(user._id)) {
    throw new Error('Student ID is already linked to a different member account.');
  }
  if (existingMember && existingMember.studentId !== application.studentId) {
    throw new Error('This email is already linked to a different student ID.');
  }

  if (!existingMember) {
    await Member.create({
      userId: user._id,
      applicationId: application._id,
      memberNumber: `SSC-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`,
      fullName: application.fullName,
      studentId: application.studentId,
      department: application.department,
      semester: application.semester,
      preferredLanguage: application.preferredLanguage,
      isActive: true,
    });
  }

  await MemberInvite.updateMany({ applicationId: application._id, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } });
  const token = randomBytes(32).toString('base64url');
  await MemberInvite.create({
    userId: user._id,
    applicationId: application._id,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });
  return { status: 'pending' as const, setupUrl: `${applicationUrl(requestOrigin)}/member/setup?token=${encodeURIComponent(token)}` };
}

router.post('/applications', asyncHandler(async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Please check the application fields and privacy acknowledgement.' });
  }

  try {
    await MembershipApplication.init();
    const existingApplication = await MembershipApplication.exists({ studentId: parsed.data.studentId });
    if (existingApplication) {
      return res.status(409).json({ success: false, message: 'An application already exists for this student ID.' });
    }

    const application = await MembershipApplication.create({
      ...parsed.data,
      universityEmail: parsed.data.universityEmail,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      data: {
        application: {
          id: application.id,
          fullName: application.fullName,
          studentId: application.studentId,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An application already exists for this student ID.' });
    }
    throw error;
  }
}));

router.post('/setup-account', asyncHandler(async (req, res) => {
  const parsed = accountSetupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Use a valid activation link and a password of at least 12 characters.' });

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const invite = await MemberInvite.findOne({ tokenHash, expiresAt: { $gt: new Date() }, usedAt: { $exists: false } });
  if (!invite) return res.status(400).json({ success: false, message: 'This activation link is invalid, expired, or already used.' });

  const userExists = await User.exists({ _id: invite.userId, role: 'member', isActive: true });
  if (!userExists) return res.status(400).json({ success: false, message: 'Member account not found. Contact the council for support.' });

  const claimedInvite = await MemberInvite.findOneAndUpdate(
    { _id: invite._id, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!claimedInvite) return res.status(400).json({ success: false, message: 'This activation link has already been used.' });

  await User.updateOne({ _id: invite.userId }, { $set: { passwordHash: await hashPassword(parsed.data.password) } });
  await MembershipApplication.updateOne({ _id: invite.applicationId }, { $set: { accountSetupStatus: 'ready' } });

  return res.status(200).json({
    success: true,
    data: { activated: true },
    message: 'Member account activated. You can now sign in.',
  });
}));

router.get(
  '/applications',
  requireAuth,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    if (status !== undefined && status !== 'all' && !['pending', 'approved', 'rejected'].includes(String(status))) {
      return res.status(400).json({ success: false, message: 'Invalid application status filter.' });
    }

    const filter = status && status !== 'all' ? { status: String(status) } : {};
    const applications = await MembershipApplication.find(filter).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: {
        applications: applications.map((application) => ({
          id: String(application._id),
          fullName: application.fullName,
          studentId: application.studentId,
          department: application.department,
          semester: application.semester,
          universityEmail: application.universityEmail,
          phoneNumber: application.phoneNumber,
          areasOfInterest: application.areasOfInterest,
          motivationStatement: application.motivationStatement,
          preferredLanguage: application.preferredLanguage,
          status: application.status,
          emailNotificationStatus: application.emailNotificationStatus,
          emailNotificationSentAt: application.emailNotificationSentAt,
          accountSetupStatus: application.accountSetupStatus,
          rejectionReason: application.rejectionReason,
          createdAt: application.createdAt,
        })),
      },
    });
  }),
);

router.patch(
  '/applications/:id/review',
  requireAuth,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Choose a decision and provide a rejection reason when required.' });
    }

    const application = await MembershipApplication.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        $set: {
          status: parsed.data.decision,
          reviewerId: req.user?.id,
          reviewedAt: new Date(),
          rejectionReason: parsed.data.decision === 'rejected' ? parsed.data.rejectionReason : undefined,
        },
      },
      { new: true, runValidators: true },
    );

    if (!application) {
      const exists = await MembershipApplication.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists ? 'This application has already been reviewed.' : 'Application not found.',
      });
    }

    let setupUrl: string | undefined;
    if (parsed.data.decision === 'approved') {
      try {
        const activation = await issueMemberActivation(application, req.get('origin'));
        application.accountSetupStatus = activation.status;
        setupUrl = activation.status === 'pending' ? activation.setupUrl : undefined;
      } catch (error) {
        application.accountSetupStatus = 'failed';
        console.error('Member account provisioning failed for application.', String(application._id), error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      application.accountSetupStatus = 'not_required';
    }

    const emailNotificationStatus = await sendMembershipDecisionEmail({
      email: application.universityEmail ?? '',
      fullName: application.fullName,
      decision: application.status as 'approved' | 'rejected',
      reason: application.rejectionReason,
      locale: application.preferredLanguage,
      setupUrl,
    });
    application.emailNotificationStatus = emailNotificationStatus;
    application.emailNotificationSentAt = emailNotificationStatus === 'sent' ? new Date() : undefined;
    await application.save();

    return res.status(200).json({
      success: true,
      data: {
        application: {
          id: String(application._id),
          status: application.status,
          emailNotificationStatus: application.emailNotificationStatus,
          emailNotificationSentAt: application.emailNotificationSentAt,
          accountSetupStatus: application.accountSetupStatus,
          rejectionReason: application.rejectionReason,
          reviewedAt: application.reviewedAt,
        },
      },
    });
  }),
);

router.post(
  '/applications/:id/notification',
  requireAuth,
  requireRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const application = await MembershipApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (application.status === 'pending') {
      return res.status(409).json({ success: false, message: 'Only reviewed applications can receive a decision email.' });
    }

    let setupUrl: string | undefined;
    if (application.status === 'approved' && application.accountSetupStatus !== 'ready') {
      try {
        const activation = await issueMemberActivation(application, req.get('origin'));
        application.accountSetupStatus = activation.status;
        setupUrl = activation.status === 'pending' ? activation.setupUrl : undefined;
      } catch {
        application.accountSetupStatus = 'failed';
      }
    }

    const emailNotificationStatus = await sendMembershipDecisionEmail({
      email: application.universityEmail ?? '',
      fullName: application.fullName,
      decision: application.status,
      reason: application.rejectionReason,
      locale: application.preferredLanguage,
      setupUrl,
    });
    application.emailNotificationStatus = emailNotificationStatus;
    application.emailNotificationSentAt = emailNotificationStatus === 'sent' ? new Date() : undefined;
    await application.save();

    return res.status(200).json({ success: true, data: { emailNotificationStatus, accountSetupStatus: application.accountSetupStatus } });
  }),
);

export default router;