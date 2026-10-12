import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { asyncHandler } from './lib/asyncHandler.js';
import { connectDatabase } from './lib/db.js';
import { attachSession, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import membershipRoutes from './routes/membership.js';
import eventRoutes from './routes/events.js';
import contentRoutes from './routes/content.js';
import memberRoutes from './routes/members.js';
import volunteerRoutes from './routes/volunteers.js';
import contactRoutes from './routes/contact.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

if (process.env.VERCEL) {
  // Behind Vercel's proxy: needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((_req: Request, res: Response, next: express.NextFunction) => {
  connectDatabase().then(
    () => next(),
    (error: unknown) => {
      console.error('Database connection failed:', error instanceof Error ? error.message : 'Unknown database error');
      res.status(500).json({
        success: false,
        message: 'Service unavailable.',
      });
    },
  );
});
app.use(asyncHandler(attachSession));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/membership', membershipRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/contact', contactRoutes);

app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await connectDatabase();
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'saraiki-student-council-api',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Service unavailable.',
    });
  }
});

app.get('/api/v1/site', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Saraiki Student Council',
      locale: 'en',
      supportedLocales: ['en', 'ur', 'skr'],
    },
  });
});

app.get('/api/v1/admin-check', requireRole(['admin']), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted.',
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 500;
  if (status === 400 || status === 413) {
    res.status(status).json({
      success: false,
      message: status === 413 ? 'The request is too large.' : 'The request could not be read.',
    });
    return;
  }

  console.error('Unhandled API error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Not found',
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

export default app;
