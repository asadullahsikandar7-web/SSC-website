import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { verifyPassword } from '../lib/auth';
import { requireAuth, SESSION_COOKIE_NAME, type AuthenticatedRequest } from '../middleware/auth';
import { Session } from '../models/Session';
import { User } from '../models/User';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid login payload.',
    });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

  await Session.create({
    userId: user._id,
    token,
    expiresAt,
    userAgent: req.headers['user-agent'] ?? undefined,
    ipAddress: req.ip,
  });

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  });

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    },
  });
}));

router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.session?.id) {
    await Session.findByIdAndDelete(req.session.id);
  }

  res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}));

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default router;
