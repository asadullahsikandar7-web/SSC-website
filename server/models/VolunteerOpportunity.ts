import mongoose, { Schema, model } from 'mongoose';

export type VolunteerOpportunityStatus = 'open' | 'closed';

export interface IVolunteerOpportunity {
  title: string;
  summary: string;
  details: string;
  areas: string[];
  startsAt?: Date;
  venue?: string;
  status: VolunteerOpportunityStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerOpportunitySchema = new Schema<IVolunteerOpportunity>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    summary: { type: String, required: true, trim: true, maxlength: 280 },
    details: { type: String, required: true, trim: true, maxlength: 3000 },
    areas: { type: [String], default: [] },
    startsAt: { type: Date },
    venue: { type: String, trim: true, maxlength: 180 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const VolunteerOpportunity = mongoose.models.VolunteerOpportunity || model<IVolunteerOpportunity>('VolunteerOpportunity', volunteerOpportunitySchema);