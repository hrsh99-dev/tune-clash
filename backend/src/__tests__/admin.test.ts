import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';

describe('Admin Catalog API', () => {
  let app: any;
  let adminToken: string;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'memory';
    process.env.ADMIN_PASSWORD = 'TestAdminPassword123!';
    await connectDatabase();
    app = createApp();

    // Login as admin
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ password: 'TestAdminPassword123!' });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('rejects unauthorized access without token', async () => {
    const res = await request(app).get('/api/admin/tracks');
    expect(res.status).toBe(401);
  });

  it('creates track with required rights information in draft/pending status', async () => {
    const res = await request(app)
      .post('/api/admin/tracks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Original Test Tune',
        artists: ['Test Artist'],
        acceptedAnswers: ['Test Tune'],
        languages: ['English'],
        categories: ['Indie'],
        era: '2020s',
        difficulty: 1,
        rights: {
          rightsHolderOrSubmitter: 'Self Composer',
          licenseType: 'Creative Commons Zero',
          allowedUses: ['gameplay'],
          territories: ['worldwide'],
          commercialUseAllowed: true,
          evidenceReference: 'Public domain release note',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.track.title).toBe('Original Test Tune');
    expect(res.body.track.status).toBe('pending_review');
    expect(res.body.license.rightsHolderOrSubmitter).toBe('Self Composer');
  });

  it('refuses to approve track without uploaded audio asset', async () => {
    // Create track first
    const createRes = await request(app)
      .post('/api/admin/tracks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'No Audio Tune',
        artists: ['Test Artist'],
        languages: ['Hindi'],
        categories: ['Bollywood'],
        rights: {
          rightsHolderOrSubmitter: 'Composer',
          licenseType: 'Direct Permission',
          allowedUses: ['gameplay'],
          evidenceReference: 'Signed letter ref #123',
        },
      });

    const trackId = createRes.body.track._id;

    // Try to approve without audio
    const approveRes = await request(app)
      .post(`/api/admin/tracks/${trackId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(400);
    expect(approveRes.body.error.code).toBe('MISSING_AUDIO');
  });
});
