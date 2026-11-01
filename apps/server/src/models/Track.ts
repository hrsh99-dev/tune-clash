import mongoose, { Schema, Document } from 'mongoose';
import { TrackStatus, TrackSourceType } from '@tune-clash/shared';
import { normalizeString } from '@tune-clash/shared';

export interface ITrack extends Document {
  slug: string;
  title: string;
  normalizedTitle: string;
  artists: string[];
  acceptedAnswers: string[];
  languages: string[];
  categories: string[];
  genres: string[];
  releaseYear?: number;
  era: string;
  difficulty: number;
  tags: string[];
  audioAssetId?: mongoose.Types.ObjectId;
  clipStartMs: number;
  clipEndMs: number;
  rightsId?: mongoose.Types.ObjectId;
  status: TrackStatus;
  sourceType: TrackSourceType;
  lastVerifiedAt?: Date;
  licenseExpiryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    normalizedTitle: { type: String, required: true, trim: true, index: true },
    artists: { type: [String], required: true },
    acceptedAnswers: { type: [String], default: [] },
    languages: { type: [String], required: true, index: true },
    categories: { type: [String], required: true, index: true },
    genres: { type: [String], default: [] },
    releaseYear: { type: Number, min: 1900, max: 2100 },
    era: { type: String, required: true, index: true },
    difficulty: { type: Number, required: true, min: 1, max: 5, default: 2, index: true },
    tags: { type: [String], default: [] },
    audioAssetId: { type: Schema.Types.ObjectId, ref: 'AudioAsset' },
    clipStartMs: { type: Number, default: 0, min: 0 },
    clipEndMs: { type: Number, default: 8000, min: 6000, max: 10000 },
    rightsId: { type: Schema.Types.ObjectId, ref: 'MusicLicense' },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'disabled'],
      default: 'draft',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['synthetic_demo', 'direct_upload', 'licensed_provider'],
      default: 'direct_upload',
    },
    lastVerifiedAt: { type: Date },
    licenseExpiryAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to populate normalizedTitle
TrackSchema.pre('validate', function (next) {
  if (this.title) {
    this.normalizedTitle = normalizeString(this.title);
  }
  next();
});

// Compound indexes for gameplay track matching (avoiding parallel array indexes in MongoDB)
TrackSchema.index({ status: 1, categories: 1, difficulty: 1 });
TrackSchema.index({ status: 1, languages: 1 });
TrackSchema.index({ status: 1, era: 1 });
TrackSchema.index({ status: 1, sourceType: 1 });

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
