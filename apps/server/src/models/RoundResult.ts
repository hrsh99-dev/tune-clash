import mongoose, { Schema, Document } from 'mongoose';
import { PlayerRoundResult, RoundStatus, ChaosModifier } from '@tune-clash/shared';

export interface IRoundResult extends Document {
  gameSessionId: mongoose.Types.ObjectId;
  roomCode: string;
  roundNumber: number;
  trackId: mongoose.Types.ObjectId;
  modifier: ChaosModifier;
  status: RoundStatus;
  startedAt: Date;
  endedAt?: Date;
  playerResults: PlayerRoundResult[];
  createdAt: Date;
}

const RoundResultSchema = new Schema<IRoundResult>(
  {
    gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true, index: true },
    roomCode: { type: String, required: true, uppercase: true },
    roundNumber: { type: Number, required: true },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
    modifier: { type: String, default: 'None' },
    status: {
      type: String,
      enum: ['preparing', 'playing', 'revealing', 'finished', 'cancelled'],
      default: 'preparing',
    },
    startedAt: { type: Date, default: () => new Date() },
    endedAt: { type: Date },
    playerResults: [{ type: Schema.Types.Mixed }] as any,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RoundResultSchema.index({ gameSessionId: 1, roundNumber: 1 });

export const RoundResult = mongoose.model<IRoundResult>('RoundResult', RoundResultSchema);
