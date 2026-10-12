import mongoose, { Schema, model } from 'mongoose';

export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type MembershipEmailStatus = 'not_sent' | 'sent' | 'failed' | 'skipped';
export type AccountSetupStatus = 'not_required' | 'pending' | 'ready' | 'failed' | 'existing_staff_account';

export interface IMembershipApplication {
  fullName: string;
  studentId: string;
  department: string;
  semester: string;
  universityEmail?: string;
  phoneNumber?: string;
  areasOfInterest: string[];
  motivationStatement?: string;
  preferredLanguage: 'en' | 'ur' | 'skr';
  privacyAcknowledged: boolean;
  status: MembershipStatus;
  emailNotificationStatus: MembershipEmailStatus;
  emailNotificationSentAt?: Date;
  accountSetupStatus: AccountSetupStatus;
  reviewerId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const membershipApplicationSchema = new Schema<IMembershipApplication>(
  {
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
    universityEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    areasOfInterest: {
      type: [String],
      default: [],
    },
    motivationStatement: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ur', 'skr'],
      default: 'en',
    },
    privacyAcknowledged: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    emailNotificationStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'failed', 'skipped'],
      default: 'not_sent',
    },
    emailNotificationSentAt: {
      type: Date,
    },
    accountSetupStatus: {
      type: String,
      enum: ['not_required', 'pending', 'ready', 'failed', 'existing_staff_account'],
      default: 'not_required',
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const MembershipApplication =
  mongoose.models.MembershipApplication || model<IMembershipApplication>('MembershipApplication', membershipApplicationSchema);
