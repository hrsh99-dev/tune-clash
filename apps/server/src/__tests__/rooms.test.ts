import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { Room } from '../models/index.js';

describe('Rooms API', () => {
  let app: any;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'memory';
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('creates a room with a 6-character code and host player', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ nickname: 'HostPlayer', settings: { roundCount: 5 } });

    expect(res.status).toBe(201);
    expect(res.body.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(res.body.player.nickname).toBe('HostPlayer');
    expect(res.body.player.isHost).toBe(true);
    expect(res.body.reconnectToken).toBeDefined();

    // Verify room saved in DB
    const room = await Room.findOne({ code: res.body.roomCode });
    expect(room).toBeDefined();
    expect(room?.players.length).toBe(1);
  });

  it('allows second player to join with room code', async () => {
    // 1. Create room
    const createRes = await request(app).post('/api/rooms').send({ nickname: 'Creator' });
    const code = createRes.body.roomCode;

    // 2. Join room
    const joinRes = await request(app)
      .post(`/api/rooms/${code}/join`)
      .send({ nickname: 'PlayerTwo' });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.player.nickname).toBe('PlayerTwo');
    expect(joinRes.body.player.isHost).toBe(false);

    // 3. Check public room state
    const stateRes = await request(app).get(`/api/rooms/${code}`);
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.players.length).toBe(2);
    // Ensure tokens are not leaked
    expect(stateRes.body.players[0]).not.toHaveProperty('reconnectTokenHash');
  });

  it('rejects duplicate nickname in same room', async () => {
    const createRes = await request(app).post('/api/rooms').send({ nickname: 'UniqueNick' });
    const code = createRes.body.roomCode;

    const joinRes = await request(app)
      .post(`/api/rooms/${code}/join`)
      .send({ nickname: 'uniquenick' });

    expect(joinRes.status).toBe(400);
    expect(joinRes.body.error.code).toBe('NICKNAME_TAKEN');
  });

  it('rejects joining a nonexistent room', async () => {
    const joinRes = await request(app)
      .post('/api/rooms/ZZZZZZ/join')
      .send({ nickname: 'LostPlayer' });

    expect(joinRes.status).toBe(404);
    expect(joinRes.body.error.code).toBe('ROOM_NOT_FOUND');
  });
});
