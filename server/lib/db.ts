import mongoose from 'mongoose';
import { env } from '../config/env.js';

let connection: Promise<typeof mongoose> | undefined;

export async function connectDatabase() {
  if (!connection) {
    // Read at call time so a URI set after module load (e.g. the test setup) is honoured.
    connection = mongoose.connect(process.env.MONGODB_URI ?? env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    await connection;
  } catch (error) {
    connection = undefined;
    throw error;
  }
}

export async function disconnectDatabase() {
  if (!connection) {
    return;
  }

  await mongoose.disconnect();
  connection = undefined;
}
