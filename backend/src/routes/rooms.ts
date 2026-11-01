import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Room } from '../models/index.js';
import { CreateRoomSchema, JoinRoomSchema, RoomSettingsSchema } from '../shared/index.js';
import { logger } from '../logger/index.js';

export const roomsRouter = Router();

// Room code alphabet omitting confusing characters: O, 0, I, 1
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}

async function getUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRandomCode();
    const existing = await Room.findOne({ code: candidate });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('Failed to generate unique room code');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/rooms - Create room
roomsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parseResult.error.flatten() },
    });
    return;
  }

  const { nickname, settings } = parseResult.data;

  try {
    const code = await getUniqueRoomCode();
    const hostPlayerId = `p_${crypto.randomBytes(6).toString('hex')}`;
    const reconnectToken = crypto.randomBytes(16).toString('hex');
    const reconnectTokenHash = hashToken(reconnectToken);

    const mergedSettings = RoomSettingsSchema.parse(settings || {});

    const hostPlayer = {
      playerId: hostPlayerId,
      nickname,
      isHost: true,
      isReady: true, // Host is implicitly ready
      isConnected: true,
      joinOrder: 1,
      score: 0,
      correctCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: Date.now(),
      reconnectTokenHash,
    };

    const room = await Room.create({
      code,
      hostPlayerId,
      status: 'lobby',
      settings: mergedSettings,
      players: [hostPlayer],
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours for lobby TTL
    });

    logger.info('Room created', { component: 'rooms', roomCode: code, host: nickname });

    res.status(201).json({
      roomCode: room.code,
      player: {
        playerId: hostPlayer.playerId,
        nickname: hostPlayer.nickname,
        isHost: true,
        isReady: true,
      },
      reconnectToken,
    });
  } catch (err: any) {
    logger.error('Room creation failed', { component: 'rooms', error: err.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Could not create room' } });
  }
});

// POST /api/rooms/:code/join - Join room
roomsRouter.post('/:code/join', async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code?.toUpperCase();
  const parseResult = JoinRoomSchema.safeParse({ ...req.body, roomCode: code });

  if (!parseResult.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid join input', details: parseResult.error.flatten() },
    });
    return;
  }

  const { nickname, reconnectToken } = parseResult.data;

  try {
    const room = await Room.findOne({ code });
    if (!room) {
      res.status(404).json({ error: { code: 'ROOM_NOT_FOUND', message: 'Room does not exist' } });
      return;
    }

    if (room.status === 'closed') {
      res.status(400).json({ error: { code: 'ROOM_CLOSED', message: 'This room is closed' } });
      return;
    }

    // Check reconnection with token
    if (reconnectToken) {
      const hashed = hashToken(reconnectToken);
      const existingPlayer = room.players.find((p) => p.reconnectTokenHash === hashed);
      if (existingPlayer) {
        existingPlayer.isConnected = true;
        existingPlayer.lastActiveAt = Date.now();
        await room.save();
        res.json({
          roomCode: room.code,
          player: {
            playerId: existingPlayer.playerId,
            nickname: existingPlayer.nickname,
            isHost: existingPlayer.isHost,
            isReady: existingPlayer.isReady,
          },
          reconnectToken,
        });
        return;
      }
    }

    if (room.status !== 'lobby') {
      res.status(400).json({
        error: { code: 'GAME_IN_PROGRESS', message: 'Game has already started in this room' },
      });
      return;
    }

    if (room.players.length >= 12) {
      res.status(400).json({ error: { code: 'ROOM_FULL', message: 'Room is full (maximum 12 players)' } });
      return;
    }

    // Check duplicate nickname
    const duplicate = room.players.find((p) => p.nickname.toLowerCase() === nickname.toLowerCase());
    if (duplicate) {
      res.status(400).json({
        error: { code: 'NICKNAME_TAKEN', message: 'A player with this nickname is already in the room' },
      });
      return;
    }

    const playerId = `p_${crypto.randomBytes(6).toString('hex')}`;
    const newReconnectToken = crypto.randomBytes(16).toString('hex');
    const newPlayer = {
      playerId,
      nickname,
      isHost: false,
      isReady: false,
      isConnected: true,
      joinOrder: room.players.length + 1,
      score: 0,
      correctCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: Date.now(),
      reconnectTokenHash: hashToken(newReconnectToken),
    };

    room.players.push(newPlayer as any);
    await room.save();

    logger.info('Player joined room', { component: 'rooms', roomCode: code, nickname });

    res.json({
      roomCode: room.code,
      player: {
        playerId: newPlayer.playerId,
        nickname: newPlayer.nickname,
        isHost: false,
        isReady: false,
      },
      reconnectToken: newReconnectToken,
    });
  } catch (err: any) {
    logger.error('Join room failed', { component: 'rooms', error: err.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Could not join room' } });
  }
});

// GET /api/rooms/:code - Public room state
roomsRouter.get('/:code', async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code?.toUpperCase();

  try {
    const room = await Room.findOne({ code });
    if (!room) {
      res.status(404).json({ error: { code: 'ROOM_NOT_FOUND', message: 'Room does not exist' } });
      return;
    }

    // Strip sensitive fields (reconnectTokenHash, socketId)
    const publicPlayers = room.players.map((p) => ({
      playerId: p.playerId,
      nickname: p.nickname,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      joinOrder: p.joinOrder,
      score: p.score,
      correctCount: p.correctCount,
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      lastActiveAt: p.lastActiveAt,
    }));

    res.json({
      roomCode: room.code,
      status: room.status,
      hostPlayerId: room.hostPlayerId,
      players: publicPlayers,
      settings: room.settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to retrieve room' } });
  }
});
