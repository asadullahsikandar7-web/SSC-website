import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { Event } from '../models/Event';
import { EventRegistration } from '../models/EventRegistration';

const router = Router();

const eventFields = z.object({
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  summary: z.string().trim().min(10).max(280),
  description: z.string().trim().min(10).max(5000),
  startsAt: z.string().datetime().transform((value) => new Date(value)),
  endsAt: z.string().datetime().transform((value) => new Date(value)),
  venue: z.string().trim().min(2).max(180),
  capacity: z.number().int().positive().optional(),
  registrationOpen: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'cancelled']),
  coverImage: z.string().url().max(1000).optional().or(z.literal('')),
});

const eventSchema = eventFields.refine((event) => event.endsAt > event.startsAt, { message: 'End time must be after start time.', path: ['endsAt'] });
const eventPatchSchema = eventFields.partial().refine(
  (event) => !event.startsAt || !event.endsAt || event.endsAt > event.startsAt,
  { message: 'End time must be after start time.', path: ['endsAt'] },
);

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  studentId: z.string().trim().min(3).max(40),
  privacyAcknowledged: z.literal(true),
});

const eventRoles = ['admin', 'event_manager'];

function publicEvent(event: Record<string, unknown>) {
  const { _id, __v, createdBy, ...fields } = event;
  return { ...fields, id: String(_id) };
}

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const status = req.query.manage === 'true' ? undefined : 'published';
  if (!status && (!req.user || !['admin', 'event_manager'].includes(req.user.role))) {
    return res.status(403).json({ success: false, message: 'Event management access required.' });
  }
  const events = await Event.find(status ? { status } : {}).sort({ startsAt: 1 }).lean();
  return res.status(200).json({ success: true, data: { events: events.map((event) => publicEvent(event as unknown as Record<string, unknown>)) } });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  return res.status(200).json({ success: true, data: { event: publicEvent(event as unknown as Record<string, unknown>) } });
}));

router.post(
  '/',
  requireAuth,
  requireRole(eventRoles),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Please review the event details.' });

    try {
      const event = await Event.create({ ...parsed.data, coverImage: parsed.data.coverImage || undefined, createdBy: req.user?.id });
      return res.status(201).json({ success: true, data: { event: publicEvent(event.toObject() as unknown as Record<string, unknown>) } });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return res.status(409).json({ success: false, message: 'An event already uses that URL name.' });
      }
      throw error;
    }
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(eventRoles),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    const parsed = eventPatchSchema.safeParse(req.body);
    if (!parsed.success || Object.keys(req.body as object).length === 0) {
      return res.status(400).json({ success: false, message: 'Please review the event changes.' });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    return res.status(200).json({ success: true, data: { event: publicEvent(event as unknown as Record<string, unknown>) } });
  }),
);

router.get('/:slug/registrations', requireAuth, requireRole(eventRoles), asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  const registrations = await EventRegistration.find({ eventId: event._id, status: 'confirmed' }).sort({ createdAt: 1 }).lean();
  return res.status(200).json({
    success: true,
    data: {
      registrations: registrations.map(({ _id, __v, ...registration }) => ({ ...registration, id: String(_id) })),
    },
  });
}));

router.post('/:slug/registrations', asyncHandler(async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please provide valid registration details and acknowledge the privacy notice.' });

  const event = await Event.findOne({ slug: req.params.slug, status: 'published', registrationOpen: true });
  if (!event) return res.status(404).json({ success: false, message: 'Registration is not open for this event.' });

  await EventRegistration.init();
  const alreadyRegistered = await EventRegistration.exists({ eventId: event._id, email: parsed.data.email.toLowerCase(), status: 'confirmed' });
  if (alreadyRegistered) return res.status(409).json({ success: false, message: 'This email is already registered for the event.' });

  const claimFilter = event.capacity === undefined
    ? { _id: event._id, registrationOpen: true, status: 'published' }
    : { _id: event._id, registrationOpen: true, status: 'published', $expr: { $lt: ['$registrationCount', '$capacity'] } };
  const claimedEvent = await Event.findOneAndUpdate(claimFilter, { $inc: { registrationCount: 1 } }, { new: true });
  if (!claimedEvent) return res.status(409).json({ success: false, message: 'Registration has closed or this event is full.' });

  try {
    const registration = await EventRegistration.create({ ...parsed.data, email: parsed.data.email.toLowerCase(), eventId: event._id });
    return res.status(201).json({
      success: true,
      data: { registration: { id: registration.id, eventTitle: event.title, status: registration.status } },
    });
  } catch (error) {
    await Event.updateOne({ _id: event._id }, { $inc: { registrationCount: -1 } });
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This email is already registered for the event.' });
    }
    throw error;
  }
}));

export default router;