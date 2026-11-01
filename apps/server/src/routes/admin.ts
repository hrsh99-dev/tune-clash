import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Track, MusicLicense, AudioAsset, AuditLog } from '../models/index.js';
import { storageProvider } from '../storage/index.js';
import { TrackAdminCreateSchema, TrackAdminUpdateSchema } from '@tune-clash/shared';
import { logger } from '../logger/index.js';

export const adminRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'TuneClashAdmin2026!';
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-key';
}

// Admin auth middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { role: string };
    if (decoded && decoded.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin role required' } });
  } catch (err) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired admin token' } });
  }
}

// POST /api/admin/login
adminRouter.post('/login', (req: Request, res: Response): void => {
  const { password } = req.body;
  const adminPass = getAdminPassword();
  if (!password || password !== adminPass) {
    AuditLog.create({
      action: 'ADMIN_LOGIN_FAILED',
      entityType: 'Security',
      actor: 'anonymous',
      ip: req.ip,
    }).catch(() => {});
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin password' } });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, getJwtSecret(), { expiresIn: '8h' });

  AuditLog.create({
    action: 'ADMIN_LOGIN_SUCCESS',
    entityType: 'Security',
    actor: 'admin',
    ip: req.ip,
  }).catch(() => {});

  res.json({ token, expiresIn: '8h' });
});

// GET /api/admin/tracks - searchable and filterable catalog
adminRouter.get('/tracks', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artists: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Track.countDocuments(query);
    const tracks = await Track.find(query)
      .populate('audioAssetId')
      .populate('rightsId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/admin/tracks - create track with mandatory rights review info
adminRouter.post('/tracks', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parseResult = TrackAdminCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid track data',
        details: parseResult.error.flatten(),
      },
    });
    return;
  }

  const data = parseResult.data;
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    // 1. Create MusicLicense record
    const license = await MusicLicense.create({
      rightsHolderOrSubmitter: data.rights.rightsHolderOrSubmitter,
      licenseType: data.rights.licenseType,
      allowedUses: data.rights.allowedUses,
      territories: data.rights.territories,
      commercialUseAllowed: data.rights.commercialUseAllowed,
      modificationAllowed: data.rights.modificationAllowed,
      attributionRequired: data.rights.attributionRequired,
      attributionText: data.rights.attributionText,
      evidenceReference: data.rights.evidenceReference,
      notes: data.rights.notes,
      reviewStatus: 'pending',
    });

    // 2. Create Track in 'draft' or 'pending_review' status
    const track = await Track.create({
      slug: `${slug}-${crypto.randomBytes(3).toString('hex')}`,
      title: data.title,
      artists: data.artists,
      acceptedAnswers: data.acceptedAnswers,
      languages: data.languages,
      categories: data.categories,
      genres: data.genres,
      releaseYear: data.releaseYear,
      era: data.era,
      difficulty: data.difficulty,
      tags: data.tags,
      clipStartMs: data.clipStartMs,
      clipEndMs: data.clipEndMs,
      rightsId: license._id,
      status: 'pending_review',
      sourceType: data.sourceType,
    });

    license.trackId = track._id as any;
    await license.save();

    await AuditLog.create({
      action: 'TRACK_CREATED',
      entityType: 'Track',
      entityId: track._id.toString(),
      actor: 'admin',
      details: { title: track.title, slug: track.slug },
    });

    res.status(201).json({ track, license });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// PATCH /api/admin/tracks/:id - update track metadata
adminRouter.patch('/tracks/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parseResult = TrackAdminUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid update payload', details: parseResult.error.flatten() },
    });
    return;
  }

  try {
    const track = await Track.findById(id);
    if (!track) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track not found' } });
      return;
    }

    const data = parseResult.data;
    if (data.title) track.title = data.title;
    if (data.artists) track.artists = data.artists;
    if (data.acceptedAnswers) track.acceptedAnswers = data.acceptedAnswers;
    if (data.languages) track.languages = data.languages;
    if (data.categories) track.categories = data.categories;
    if (data.genres) track.genres = data.genres;
    if (data.era) track.era = data.era;
    if (data.difficulty !== undefined) track.difficulty = data.difficulty;
    if (data.tags) track.tags = data.tags;
    if (data.clipStartMs !== undefined) track.clipStartMs = data.clipStartMs;
    if (data.clipEndMs !== undefined) track.clipEndMs = data.clipEndMs;

    await track.save();

    await AuditLog.create({
      action: 'TRACK_UPDATED',
      entityType: 'Track',
      entityId: track._id.toString(),
      actor: 'admin',
      details: { updatedFields: Object.keys(data) },
    });

    res.json({ track });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/admin/tracks/:id/audio - upload audio file for track
adminRouter.post(
  '/tracks/:id/audio',
  requireAdmin,
  upload.single('audio'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No audio file provided' } });
      return;
    }

    try {
      const track = await Track.findById(id);
      if (!track) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track not found' } });
        return;
      }

      const mimeType = req.file.mimetype;
      const allowedMimes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm'];
      if (!allowedMimes.includes(mimeType)) {
        res.status(400).json({
          error: {
            code: 'INVALID_AUDIO_FORMAT',
            message: `Unsupported format '${mimeType}'. Supported: WAV, MP3, OGG, WebM.`,
          },
        });
        return;
      }

      let ext = '.wav';
      if (mimeType.includes('mpeg') || mimeType.includes('mp3')) ext = '.mp3';
      if (mimeType.includes('ogg')) ext = '.ogg';
      if (mimeType.includes('webm')) ext = '.webm';

      const saved = await storageProvider.saveFile(req.file.buffer, ext);

      const audioAsset = await AudioAsset.create({
        trackId: track._id,
        storageProvider: 'local',
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        durationMs: track.clipEndMs - track.clipStartMs || 8000,
        processingStatus: 'ready',
        createdBy: 'admin',
      });

      track.audioAssetId = audioAsset._id as any;
      await track.save();

      await AuditLog.create({
        action: 'AUDIO_ASSET_UPLOADED',
        entityType: 'Track',
        entityId: track._id.toString(),
        actor: 'admin',
        details: { storageKey: saved.storageKey, fileSizeBytes: saved.fileSizeBytes },
      });

      res.status(201).json({ audioAsset, track });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

// POST /api/admin/tracks/:id/approve - approve track after rights verification
adminRouter.post('/tracks/:id/approve', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const track = await Track.findById(id).populate('rightsId').populate('audioAssetId');
    if (!track) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track not found' } });
      return;
    }

    if (!track.audioAssetId) {
      res.status(400).json({
        error: { code: 'MISSING_AUDIO', message: 'Cannot approve track without an uploaded audio asset.' },
      });
      return;
    }

    const license = track.rightsId as any;
    if (!license) {
      res.status(400).json({
        error: { code: 'MISSING_LICENSE', message: 'Cannot approve track without a linked MusicLicense record.' },
      });
      return;
    }

    if (!license.allowedUses?.includes('gameplay')) {
      res.status(400).json({
        error: {
          code: 'DISALLOWED_USE',
          message: 'License must explicitly permit "gameplay" use before approval.',
        },
      });
      return;
    }

    // Check expiry
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      res.status(400).json({
        error: { code: 'LICENSE_EXPIRED', message: 'Cannot approve a track with an expired license.' },
      });
      return;
    }

    // Approve license and track
    license.reviewStatus = 'approved';
    license.reviewedBy = 'admin';
    license.reviewedAt = new Date();
    await license.save();

    track.status = 'approved';
    track.lastVerifiedAt = new Date();
    await track.save();

    await AuditLog.create({
      action: 'TRACK_APPROVED',
      entityType: 'Track',
      entityId: track._id.toString(),
      actor: 'admin',
      details: { title: track.title, licenseId: license._id },
    });

    res.json({ message: 'Track and license approved successfully', track });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/admin/tracks/:id/disable - disable track
adminRouter.post('/tracks/:id/disable', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const track = await Track.findById(id);
    if (!track) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track not found' } });
      return;
    }

    track.status = 'disabled';
    await track.save();

    await AuditLog.create({
      action: 'TRACK_DISABLED',
      entityType: 'Track',
      entityId: track._id.toString(),
      actor: 'admin',
      details: { title: track.title },
    });

    res.json({ message: 'Track disabled', track });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/admin/audit-logs - view audit logs
adminRouter.get('/audit-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

    res.json({ logs, pagination: { page, limit, total } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/admin/itunes-search - search Apple Music / iTunes commercial catalog
adminRouter.get('/itunes-search', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: { code: 'MISSING_QUERY', message: 'Search term "q" is required' } });
    return;
  }
  const { searchITunes } = await import('../services/catalogService.js');
  const results = await searchITunes(query, 12);
  res.json({ results });
});

// POST /api/admin/import-itunes - 1-click import commercial song into catalog
adminRouter.post('/import-itunes', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { title, artist, previewUrl, album, releaseYear, genre, category, language, acceptedAnswers } = req.body;
  if (!title || !previewUrl) {
    res.status(400).json({ error: { code: 'INVALID_DATA', message: 'Title and previewUrl are required' } });
    return;
  }

  const { importCommercialSong } = await import('../services/catalogService.js');
  const success = await importCommercialSong({
    searchTerm: `${title} ${artist}`,
    title,
    artists: [artist || 'Unknown Artist'],
    acceptedAnswers: acceptedAnswers || [title],
    languages: [language || 'Hindi'],
    categories: [category || 'Bollywood'],
    era: releaseYear ? (releaseYear >= 2020 ? '2020s' : releaseYear >= 2010 ? '2010s' : releaseYear >= 2000 ? '2000s' : '1990s') : '2010s',
    difficulty: 2,
  });

  if (success) {
    res.json({ message: `Successfully imported "${title}" into approved catalog!` });
  } else {
    res.status(500).json({ error: { code: 'IMPORT_FAILED', message: 'Could not import track' } });
  }
});
