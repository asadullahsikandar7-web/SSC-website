import mongoose, { Schema, model } from 'mongoose';

export interface IContactMessage {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  emailStatus: 'sent' | 'failed' | 'skipped';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    emailStatus: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'failed' },
    readAt: { type: Date },
  },
  { timestamps: true },
);

export const ContactMessage = mongoose.models.ContactMessage || model<IContactMessage>('ContactMessage', contactMessageSchema);