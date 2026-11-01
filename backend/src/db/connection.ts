import mongoose from 'mongoose';
import { logger } from '../logger/index.js';

let memoryServer: any = null;

export async function connectDatabase(): Promise<string> {
  const uri = process.env.MONGODB_URI?.trim();

  // If a real MongoDB connection string is provided
  if (uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) {
    try {
      logger.info('Connecting to MongoDB...', { component: 'db' });
      await mongoose.connect(uri);
      logger.info('Connected to MongoDB successfully', { component: 'db' });
      return uri;
    } catch (err: any) {
      logger.error('Failed to connect to provided MONGODB_URI', {
        component: 'db',
        error: err.message,
      });
      throw err;
    }
  }

  // Fallback to in-memory MongoDB for local development and testing
  logger.info('No remote MONGODB_URI provided. Initializing in-memory MongoDB for local dev...', {
    component: 'db',
  });

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    logger.info('Connected to In-Memory MongoDB successfully', { component: 'db' });
    return memoryUri;
  } catch (err: any) {
    logger.error('Failed to start in-memory MongoDB', {
      component: 'db',
      error: err.message,
    });
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  logger.info('Disconnected from database', { component: 'db' });
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
