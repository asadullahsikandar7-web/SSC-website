import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Member } from '../models/Member.js';

const router = Router();
router.use(requireAuth, requireRole(['member']));

router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const member = await Member.findOne({ userId: req.user?.id, isActive: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member profile not found. Contact the council for support.' });

  return res.status(200).json({
    success: true,
    data: {
      member: {
        id: String(member._id),
        memberNumber: member.memberNumber,
        fullName: member.fullName,
        studentId: member.studentId,
        department: member.department,
        semester: member.semester,
        preferredLanguage: member.preferredLanguage,
      },
    },
  });
}));

router.get('/me/registrations', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const member = await Member.findOne({ userId: req.user?.id, isActive: true }).lean();
  if (!member) return res.status(404).json({ success: false, message: 'Member profile not found.' });

  const registrations = await EventRegistration.find({ email: req.user?.email, status: 'confirmed' })
    .populate('eventId', 'title slug startsAt endsAt venue status')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: {
      registrations: registrations
        .filter((registration) => registration.eventId)
        .map((registration) => ({
          id: String(registration._id),
          registeredAt: registration.createdAt,
          event: registration.eventId,
        })),
    },
  });
}));

export default router;