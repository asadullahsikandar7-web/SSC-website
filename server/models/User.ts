import mongoose, { Schema, model } from 'mongoose';
import type { UserRole } from '../lib/roles.js';

export interface IUser {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'event_manager', 'member'],
      default: 'member',
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

export const User = mongoose.models.User || model<IUser>('User', userSchema);
