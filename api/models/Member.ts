import mongoose, { Schema, model } from 'mongoose';

export interface IMember {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  memberNumber?: string;
  fullName: string;
  studentId: string;
  department: string;
  semester: string;
  preferredLanguage: 'en' | 'ur' | 'skr';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipApplication',
    },
    memberNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ur', 'skr'],
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Member = mongoose.models.Member || model<IMember>('Member', memberSchema);
