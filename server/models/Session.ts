import mongoose, { Schema, model } from 'mongoose';

export interface ISession {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB removes sessions once they expire.
      index: { expires: 0 },
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Session = mongoose.models.Session || model<ISession>('Session', sessionSchema);
