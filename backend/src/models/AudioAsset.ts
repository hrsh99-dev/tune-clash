import mongoose, { Schema, Document } from 'mongoose';

export interface IAudioAsset extends Document {
  trackId?: mongoose.Types.ObjectId;
  storageProvider: 'local' | 's3_compatible' | 'external_stream';
  storageKey: string;
  externalUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  durationMs: number;
  checksumSha256?: string;
  processingStatus: 'pending' | 'ready' | 'failed';
  createdAt: Date;
  createdBy?: string;
}

const AudioAssetSchema = new Schema<IAudioAsset>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
    storageProvider: {
      type: String,
      enum: ['local', 's3_compatible', 'external_stream'],
      default: 'local',
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
      default: 'audio/wav',
    },
    fileSizeBytes: { type: Number, required: true, default: 1024 * 1024, min: 1 },
    durationMs: { type: Number, required: true, default: 30000, min: 1000 },
    checksumSha256: { type: String, trim: true },
    processingStatus: {
      type: String,
      enum: ['pending', 'ready', 'failed'],
      default: 'ready',
    },
    createdBy: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AudioAssetSchema.index({ trackId: 1 });

export const AudioAsset = mongoose.model<IAudioAsset>('AudioAsset', AudioAssetSchema);
