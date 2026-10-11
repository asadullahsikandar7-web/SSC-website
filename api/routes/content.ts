import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { ContentItem } from '../models/ContentItem';

const router = Router();
const contentTypes = ['announcement', 'article', 'leader'] as const;

const contentFields = z.object({
  contentType: z.enum(contentTypes),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(8).max(360),
  body: z.string().trim().min(8).max(12000),
  locale: z.enum(['en', 'ur', 'skr']).default('en'),
  status: z.enum(['draft', 'published']).default('draft'),
  roleTitle: z.string().trim().max(120).optional(),
  imageUrl: z.string().url().max(1000).optional().or(z.literal('')),
});

const contentPatchFields = contentFields.partial().omit({ contentType: true });
const editorRoles = ['admin', 'editor'];

function safeContent(item: Record<string, unknown>) {
  const { _id, __v, createdBy, ...fields } = item;
  return { ...fields, id: String(item._id) };
}

router.get('/manage/:contentType', requireAuth, requireRole(editorRoles), asyncHandler(async (req, res) => {
  if (!contentTypes.includes(req.params.contentType as typeof contentTypes[number])) {
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }
  const items = await ContentItem.find({ contentType: req.params.contentType }).sort({ updatedAt: -1 }).lean();
  return res.status(200).json({ success: true, data: { items: items.map((item) => safeContent(item as unknown as Record<string, unknown>)) } });
}));

router.post('/manage', requireAuth, requireRole(editorRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = contentFields.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please review the content fields.' });

  try {
    const item = await ContentItem.create({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || undefined,
      createdBy: req.user?.id,
      publishedAt: parsed.data.status === 'published' ? new Date() : undefined,
    });
    return res.status(201).json({ success: true, data: { item: safeContent(item.toObject() as unknown as Record<string, unknown>) } });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An item with this URL name already exists in this content section.' });
    }
    throw error;
  }
}));

router.patch('/manage/:id', requireAuth, requireRole(editorRoles), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid content ID.' });
  const parsed = contentPatchFields.safeParse(req.body);
  if (!parsed.success || Object.keys(req.body as object).length === 0) {
    return res.status(400).json({ success: false, message: 'Please review the content changes.' });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.imageUrl === '') update.imageUrl = undefined;
  if (parsed.data.status === 'published') update.publishedAt = new Date();
  if (parsed.data.status === 'draft') update.publishedAt = undefined;

  const item = await ContentItem.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ success: false, message: 'Content item not found.' });
  return res.status(200).json({ success: true, data: { item: safeContent(item as unknown as Record<string, unknown>) } });
}));

router.get('/:contentType/:slug', asyncHandler(async (req, res) => {
  if (!contentTypes.includes(req.params.contentType as typeof contentTypes[number])) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }
  const item = await ContentItem.findOne({ contentType: req.params.contentType, slug: req.params.slug, status: 'published' }).lean();
  if (!item) return res.status(404).json({ success: false, message: 'Content not found.' });
  return res.status(200).json({ success: true, data: { item: safeContent(item as unknown as Record<string, unknown>) } });
}));

router.get('/:contentType', asyncHandler(async (req, res) => {
  if (!contentTypes.includes(req.params.contentType as typeof contentTypes[number])) {
    return res.status(404).json({ success: false, message: 'Content section not found.' });
  }
  const locale = req.query.locale;
  if (locale !== undefined && !['en', 'ur', 'skr'].includes(String(locale))) {
    return res.status(400).json({ success: false, message: 'Invalid language filter.' });
  }
  const filter = { contentType: req.params.contentType, status: 'published', ...(locale ? { locale: String(locale) } : {}) };
  const items = await ContentItem.find(filter).sort({ publishedAt: -1, createdAt: -1 }).lean();
  return res.status(200).json({ success: true, data: { items: items.map((item) => safeContent(item as unknown as Record<string, unknown>)) } });
}));

export default router;