import mongoose, { Schema, Document } from 'mongoose';
import { GameSessionStatus, RoomSettings, PlayerLeaderboardEntry, FinalGameStats } from '@tune-clash/shared';

export interface IGameSession extends Document {
  roomCode: string;
  hostPlayerId: string;
  status: GameSessionStatus;
  settingsSnapshot: RoomSettings;
  playerSnapshots: Array<{
    playerId: string;
    nickname: string;
    joinOrder: number;
    finalScore: number;
    correctCount: number;
    rank: number;
  }>;
  winnerPlayerId?: string;
  finalStandings?: PlayerLeaderboardEntry[];
  finalStats?: FinalGameStats;
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>(
  {
    roomCode: { type: String, required: true, uppercase: true, index: true },
    hostPlayerId: { type: String, required: true },
    status: {
      type: String,
      enum: ['created', 'in_progress', 'finished', 'cancelled'],
      default: 'created',
      index: true,
    },
    settingsSnapshot: { type: Schema.Types.Mixed, required: true },
    playerSnapshots: [{ type: Schema.Types.Mixed }] as any,
    winnerPlayerId: { type: String },
    finalStandings: [{ type: Schema.Types.Mixed }] as any,
    finalStats: { type: Schema.Types.Mixed },
    startedAt: { type: Date, default: () => new Date() },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

GameSessionSchema.index({ roomCode: 1, createdAt: -1 });

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);
