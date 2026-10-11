import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { asyncHandler } from './lib/asyncHandler';
import { connectDatabase } from './lib/db';
import { attachSession, requireRole } from './middleware/auth';
import authRoutes from './routes/auth';
import membershipRoutes from './routes/membership';
import eventRoutes from './routes/events';
import contentRoutes from './routes/content';
import memberRoutes from './routes/members';
import volunteerRoutes from './routes/volunteers';
import contactRoutes from './routes/contact';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

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
