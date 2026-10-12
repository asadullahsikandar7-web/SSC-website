import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ssc-dev',
  sessionSecret: process.env.SESSION_SECRET ?? 'development-session-secret-change-me',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
