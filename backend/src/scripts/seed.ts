import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { Track, MusicLicense, AudioAsset, AuditLog } from '../models/index.js';
import { storageProvider } from '../storage/index.js';
// @ts-ignore
import { DEMO_TRACKS, generateAllDemoAudio } from '../../../../scripts/generate-demo-audio.js';
import { logger } from '../logger/index.js';

export async function seedDemoTracks() {
  logger.info('Starting seed process for demo tracks...', { component: 'seed' });

  // 1. Ensure audio files are generated
  const uploadsDir = path.resolve(process.cwd(), 'uploads/audio');
  generateAllDemoAudio(uploadsDir);

  for (const demo of DEMO_TRACKS) {
    const filename = `${demo.slug}.wav`;
    const audioFilePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(audioFilePath)) {
      logger.error(`Audio file not found: ${audioFilePath}`, { component: 'seed' });
      continue;
    }

    const stat = fs.statSync(audioFilePath);

    // 2. Create or find AudioAsset
    let audioAsset = await AudioAsset.findOne({ storageKey: filename });
    if (!audioAsset) {
      audioAsset = await AudioAsset.create({
        storageProvider: 'local',
        storageKey: filename,
        mimeType: 'audio/wav',
        fileSizeBytes: stat.size,
        durationMs: 8500,
        processingStatus: 'ready',
        createdBy: 'seed-script',
      });
    }

    // 3. Create or find MusicLicense
    let license = await MusicLicense.findOne({
      rightsHolderOrSubmitter: 'Antigravity TuneClash Project',
      licenseType: 'Original Synthetic Gameplay Demo',
    });

    if (!license) {
      license = await MusicLicense.create({
        rightsHolderOrSubmitter: 'Antigravity TuneClash Project',
        licenseType: 'Original Synthetic Gameplay Demo',
        allowedUses: ['gameplay', 'preview'],
        territories: ['worldwide'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        attributionRequired: true,
        attributionText: 'Original algorithmic demo melody for Tune Clash.',
        evidenceReference: 'Internal procedural audio generation script',
        reviewStatus: 'approved',
        reviewedBy: 'Admin Auto-Reviewer',
        reviewedAt: new Date(),
        notes: 'Safe synthetic demo track for test and gameplay.',
      });
    }

    // 4. Create or update Track
    let track = await Track.findOne({ slug: demo.slug });
    if (!track) {
      track = await Track.create({
        slug: demo.slug,
        title: demo.title,
        artists: demo.artists,
        acceptedAnswers: demo.acceptedAnswers,
        languages: demo.languages,
        categories: demo.categories,
        genres: demo.genres,
        releaseYear: 2026,
        era: demo.era,
        difficulty: demo.difficulty,
        tags: demo.tags,
        audioAssetId: audioAsset._id,
        clipStartMs: 0,
        clipEndMs: 8500,
        rightsId: license._id,
        status: 'approved',
        sourceType: 'synthetic_demo',
        lastVerifiedAt: new Date(),
      });
      logger.info(`✓ Seeded demo track: "${demo.title}"`, { component: 'seed' });
    } else {
      track.audioAssetId = audioAsset._id as any;
      track.rightsId = license._id as any;
      track.status = 'approved';
      await track.save();
      logger.info(`✓ Updated existing track: "${demo.title}"`, { component: 'seed' });
    }

    // Update references
    audioAsset.trackId = track._id as any;
    await audioAsset.save();
  }

  await AuditLog.create({
    action: 'SEED_DEMO_TRACKS',
    entityType: 'Track',
    actor: 'seed-script',
    details: { count: DEMO_TRACKS.length },
  });

  logger.info(`Successfully seeded ${DEMO_TRACKS.length} demo tracks into database.`, {
    component: 'seed',
  });
}

// Standalone execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDemoTracks();
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error('Seed failed:', err);
      process.exit(1);
    }
  })();
}
