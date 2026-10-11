import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { ISession } from '../models/Session';
import type { IUser } from '../models/User';
import { Session } from '../models/Session';
import { User } from '../models/User';

export const SESSION_COOKIE_NAME = 'ssc_session';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  session?: {
    id: string;
    userId: string;
  };
}

const sessionTokenSchema = z.string().min(10);

export async function attachSession(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return next();
  }

  const parsedToken = sessionTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return next();
  }

  const session = (await Session.findOne({
    token: parsedToken.data,
    expiresAt: { $gt: new Date() },
  }).lean()) as (ISession & { _id: string }) | null;

  if (!session) {
    return next();
  }

  const user = (await User.findById(session.userId).lean()) as (IUser & { _id: string }) | null;
  if (!user || !user.isActive) {
    return next();
  }

  req.session = {
    id: String(session._id),
    userId: String(session.userId),
  };
  req.user = {
    id: String(user._id),
    email: user.email,
    role: user.role,
  };

  return next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  return next();
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    return next();
  };
}
