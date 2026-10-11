import mongoose from 'mongoose';
import { env } from '../config/env';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return;
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
}

export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
}
