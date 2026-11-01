import mongoose, { Schema, Document } from 'mongoose';
import { RoomStatus, RoomSettings, Player } from '@tune-clash/shared';

export interface IRoomPlayer extends Player {
  reconnectTokenHash?: string;
  socketId?: string;
}

export interface IRoom extends Document {
  code: string;
  hostPlayerId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: IRoomPlayer[];
  activeGameSessionId?: mongoose.Types.ObjectId;
  closedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomPlayerSchema = new Schema<IRoomPlayer>(
  {
    playerId: { type: String, required: true },
    nickname: { type: String, required: true, trim: true },
    isHost: { type: Boolean, default: false },
    isReady: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
    joinOrder: { type: Number, required: true },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    fastestGuessMs: { type: Number },
    lastActiveAt: { type: Number, default: () => Date.now() },
    reconnectTokenHash: { type: String },
    socketId: { type: String },
  },
  { _id: false }
);

const RoomSchema = new Schema<IRoom>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
      index: true,
    },
    hostPlayerId: { type: String, required: true },
    status: {
      type: String,
      enum: ['lobby', 'in_progress', 'finished', 'closed'],
      default: 'lobby',
      index: true,
    },
    settings: {
      languages: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      eras: { type: [String], default: [] },
      genres: { type: [String], default: [] },
      difficultyMode: { type: Schema.Types.Mixed, default: 'all' },
      roundCount: { type: Number, default: 5, min: 1, max: 20 },
      chaosMode: { type: Boolean, default: false },
      clipSeconds: { type: Number, default: 8, min: 6, max: 10 },
    },
    players: { type: [RoomPlayerSchema], default: [] },
    activeGameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession' },
    closedAt: { type: Date },
    // Abandoned lobby TTL cleanup index (only expires when in lobby or closed state)
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

RoomSchema.index({ status: 1, updatedAt: 1 });
// Sparse TTL index on expiresAt for automatic abandoned lobby cleanup
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
