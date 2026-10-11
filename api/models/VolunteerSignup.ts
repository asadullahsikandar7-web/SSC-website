import mongoose, { Schema, model } from 'mongoose';

export type VolunteerSignupStatus = 'applied' | 'accepted' | 'declined' | 'withdrawn';

export interface IVolunteerSignup {
  opportunityId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  note?: string;
  status: VolunteerSignupStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSignupSchema = new Schema<IVolunteerSignup>(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: 'VolunteerOpportunity', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['applied', 'accepted', 'declined', 'withdrawn'], default: 'applied' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

volunteerSignupSchema.index({ opportunityId: 1, memberId: 1 }, { unique: true });

export const VolunteerSignup = mongoose.models.VolunteerSignup || model<IVolunteerSignup>('VolunteerSignup', volunteerSignupSchema);