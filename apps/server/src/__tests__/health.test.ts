import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';

describe('Health API', () => {
  let app: any;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'memory';
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /api/health returns 200 with database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database.connected).toBe(true);
    expect(res.body).not.toHaveProperty('mongoUri');
  });
});
