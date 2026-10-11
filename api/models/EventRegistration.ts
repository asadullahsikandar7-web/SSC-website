import mongoose, { Schema, model } from 'mongoose';

export interface IEventRegistration {
  eventId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  studentId: string;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    studentId: { type: String, required: true, trim: true, maxlength: 40 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true },
);

eventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

export const EventRegistration = mongoose.models.EventRegistration || model<IEventRegistration>('EventRegistration', eventRegistrationSchema);