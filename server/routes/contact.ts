import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { sendCouncilContactEmail } from '../lib/membershipEmail.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ContactMessage } from '../models/ContactMessage.js';

const router = Router();
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Please wait before sending another message.' },
});

const messageSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
  privacyAcknowledged: z.literal(true),
});

router.post('/', publicLimiter, asyncHandler(async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please complete the contact form and acknowledge the privacy notice.' });

  const message = await ContactMessage.create({
    fullName: parsed.data.fullName,
    email: parsed.data.email.toLowerCase(),
    subject: parsed.data.subject,
    message: parsed.data.message,
    emailStatus: 'failed',
  });
  const emailStatus = await sendCouncilContactEmail(parsed.data);
  message.emailStatus = emailStatus;
  await message.save();

  return res.status(201).json({
    success: true,
    data: { id: String(message._id), emailStatus },
    message: 'Your message has been received by the council.',
  });
}));

router.get('/manage', requireAuth, requireRole(['admin', 'editor']), asyncHandler(async (_req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json({
    success: true,
    data: {
      messages: messages.map(({ _id, __v, ...message }) => ({ ...message, id: String(_id) })),
    },
  });
}));

router.patch('/:id/read', requireAuth, requireRole(['admin', 'editor']), asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { readAt: new Date() } }, { new: true });
  if (!message) return res.status(404).json({ success: false, message: 'Contact message not found.' });
  return res.status(200).json({ success: true, data: { readAt: message.readAt } });
}));

export default router;