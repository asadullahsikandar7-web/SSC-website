import mongoose, { Schema, model } from 'mongoose';

export interface IMemberInvite {
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberInviteSchema = new Schema<IMemberInvite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'MembershipApplication', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

export const MemberInvite = mongoose.models.MemberInvite || model<IMemberInvite>('MemberInvite', memberInviteSchema);