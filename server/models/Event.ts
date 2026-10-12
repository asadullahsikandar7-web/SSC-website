import mongoose, { Schema, model } from 'mongoose';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface IEvent {
  title: string;
  slug: string;
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  capacity?: number;
  registrationCount: number;
  registrationOpen: boolean;
  status: EventStatus;
  coverImage?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    summary: { type: String, required: true, trim: true, maxlength: 280 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: { type: String, required: true, trim: true, maxlength: 180 },
    capacity: { type: Number, min: 1 },
    registrationCount: { type: Number, min: 0, default: 0 },
    registrationOpen: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
    coverImage: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

eventSchema.pre('validate', function validateEventDates(next) {
  if (this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'Event end time must be after its start time.');
  }
  next();
});

export const Event = mongoose.models.Event || model<IEvent>('Event', eventSchema);