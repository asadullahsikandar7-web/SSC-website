import mongoose, { Schema, model } from 'mongoose';

export type ContentType = 'announcement' | 'article' | 'leader';
export type ContentStatus = 'draft' | 'published';

export interface IContentItem {
  contentType: ContentType;
  slug: string;
  title: string;
  summary: string;
  body: string;
  locale: 'en' | 'ur' | 'skr';
  status: ContentStatus;
  roleTitle?: string;
  imageUrl?: string;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contentItemSchema = new Schema<IContentItem>(
  {
    contentType: { type: String, required: true, enum: ['announcement', 'article', 'leader'] },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    summary: { type: String, required: true, trim: true, maxlength: 360 },
    body: { type: String, required: true, trim: true, maxlength: 12000 },
    locale: { type: String, enum: ['en', 'ur', 'skr'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    roleTitle: { type: String, trim: true, maxlength: 120 },
    imageUrl: { type: String, trim: true, maxlength: 1000 },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

contentItemSchema.index({ contentType: 1, slug: 1 }, { unique: true });
contentItemSchema.index({ contentType: 1, status: 1, publishedAt: -1 });

export const ContentItem = mongoose.models.ContentItem || model<IContentItem>('ContentItem', contentItemSchema);