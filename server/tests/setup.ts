import mongoose from 'mongoose';
import { afterAll, beforeAll, afterEach, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../lib/db';

process.env.NODE_ENV = 'test';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDatabase();
});

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  vi.restoreAllMocks();

  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  }
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});
