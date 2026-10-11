import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { VolunteerOpportunity } from '../models/VolunteerOpportunity';
import { VolunteerSignup } from '../models/VolunteerSignup';

const router = Router();
const managerRoles = ['admin', 'event_manager'];
const opportunitySchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(280),
  details: z.string().trim().min(10).max(3000),
  areas: z.array(z.string().trim().min(1).max(80)).max(8),
  startsAt: z.string().datetime().optional().transform((value) => value ? new Date(value) : undefined),
  venue: z.string().trim().max(180).optional(),
});
const signupSchema = z.object({ note: z.string().trim().max(1000).optional() });

router.get('/manage', requireAuth, requireRole(managerRoles), asyncHandler(async (_req, res) => {
  const opportunities = await VolunteerOpportunity.find().sort({ createdAt: -1 }).lean();
  const opportunityIds = opportunities.map((opportunity) => opportunity._id);
  const signups = await VolunteerSignup.find({ opportunityId: { $in: opportunityIds }, status: { $ne: 'withdrawn' } })
    .populate('memberId', 'fullName studentId department semester')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json({
    success: true,
    data: {
      opportunities: opportunities.map((opportunity) => ({
        ...opportunity,
        id: String(opportunity._id),
        signups: signups.filter((signup) => String(signup.opportunityId) === String(opportunity._id)).map((signup) => ({ ...signup, id: String(signup._id) })),
      })),
    },
  });
}));

router.post('/manage', requireAuth, requireRole(managerRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = opportunitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please review the volunteer opportunity details.' });
  const opportunity = await VolunteerOpportunity.create({ ...parsed.data, createdBy: req.user?.id, status: 'open' });
  return res.status(201).json({ success: true, data: { opportunity } });
}));

router.patch('/manage/:id', requireAuth, requireRole(managerRoles), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid opportunity ID.' });
  const parsed = z.object({ status: z.enum(['open', 'closed']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Choose open or closed.' });
  const opportunity = await VolunteerOpportunity.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true }).lean();
  if (!opportunity) return res.status(404).json({ success: false, message: 'Volunteer opportunity not found.' });
  return res.status(200).json({ success: true, data: { opportunity } });
}));

router.patch('/manage/signups/:signupId', requireAuth, requireRole(managerRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.signupId)) return res.status(400).json({ success: false, message: 'Invalid signup ID.' });
  const parsed = z.object({ status: z.enum(['accepted', 'declined']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Choose accepted or declined.' });
  const signup = await VolunteerSignup.findOneAndUpdate(
    { _id: req.params.signupId, status: 'applied' },
    { $set: { status: parsed.data.status, reviewedBy: req.user?.id, reviewedAt: new Date() } },
    { new: true },
  );
  if (!signup) return res.status(409).json({ success: false, message: 'Signup does not exist or has already been reviewed.' });
  return res.status(200).json({ success: true, data: { signup } });
}));

router.get('/', requireAuth, requireRole(['member']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const member = await Member.findOne({ userId: req.user?.id, isActive: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member profile not found.' });
  const opportunities = await VolunteerOpportunity.find({ status: 'open' }).sort({ startsAt: 1, createdAt: -1 }).lean();
  const signups = await VolunteerSignup.find({ memberId: member._id, status: { $ne: 'withdrawn' } }).lean();
  return res.status(200).json({
    success: true,
    data: {
      opportunities: opportunities.map((opportunity) => ({
        ...opportunity,
        id: String(opportunity._id),
        signupStatus: signups.find((signup) => String(signup.opportunityId) === String(opportunity._id))?.status,
      })),
    },
  });
}));

router.post('/:id/signup', requireAuth, requireRole(['member']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid opportunity ID.' });
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please check your volunteer note.' });
  const [member, opportunity] = await Promise.all([
    Member.findOne({ userId: req.user?.id, isActive: true }),
    VolunteerOpportunity.findOne({ _id: req.params.id, status: 'open' }),
  ]);
  if (!member) return res.status(404).json({ success: false, message: 'Member profile not found.' });
  if (!opportunity) return res.status(404).json({ success: false, message: 'This opportunity is no longer open.' });
  try {
    const signup = await VolunteerSignup.create({ opportunityId: opportunity._id, memberId: member._id, note: parsed.data.note });
    return res.status(201).json({ success: true, data: { signup: { id: signup.id, status: signup.status } } });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this opportunity.' });
    }
    throw error;
  }
}));

router.delete('/:id/signup', requireAuth, requireRole(['member']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid opportunity ID.' });
  const member = await Member.findOne({ userId: req.user?.id, isActive: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member profile not found.' });
  const signup = await VolunteerSignup.findOneAndUpdate(
    { opportunityId: req.params.id, memberId: member._id, status: 'applied' },
    { $set: { status: 'withdrawn' } },
    { new: true },
  );
  if (!signup) return res.status(409).json({ success: false, message: 'Only a pending volunteer application can be withdrawn.' });
  return res.status(200).json({ success: true, message: 'Volunteer application withdrawn.' });
}));

export default router;