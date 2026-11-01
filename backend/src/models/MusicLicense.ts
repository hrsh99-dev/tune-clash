import mongoose, { Schema, Document } from 'mongoose';
import { LicenseReviewStatus } from '../shared/index.js';

export interface IMusicLicense extends Document {
  trackId?: mongoose.Types.ObjectId;
  rightsHolderOrSubmitter: string;
  licenseType: string;
  allowedUses: string[];
  territories: string[];
  commercialUseAllowed: boolean;
  modificationAllowed: boolean;
  attributionRequired: boolean;
  attributionText?: string;
  startsAt?: Date;
  expiresAt?: Date;
  evidenceReference: string;
  reviewStatus: LicenseReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MusicLicenseSchema = new Schema<IMusicLicense>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
    rightsHolderOrSubmitter: { type: String, required: true, trim: true },
    licenseType: { type: String, required: true, trim: true },
    allowedUses: { type: [String], required: true, default: ['gameplay'] },
    territories: { type: [String], default: ['worldwide'] },
    commercialUseAllowed: { type: Boolean, default: false },
    modificationAllowed: { type: Boolean, default: false },
    attributionRequired: { type: Boolean, default: false },
    attributionText: { type: String, trim: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    evidenceReference: { type: String, required: true, trim: true },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    reviewedBy: { type: String, trim: true },
    reviewedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

MusicLicenseSchema.index({ reviewStatus: 1 });
MusicLicenseSchema.index({ trackId: 1 });

export const MusicLicense = mongoose.model<IMusicLicense>('MusicLicense', MusicLicenseSchema);
