import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { storageProvider } from '../storage/index.js';
import { logger } from '../logger/index.js';

import { AudioAsset } from '../models/index.js';

export const assetsRouter = Router();

const previewCache = new Map<string, { buffer: Buffer; mimeType: string; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Stream audio file with Range support or proxy external stream
assetsRouter.get('/audio/:key', async (req: Request, res: Response): Promise<void> => {
  const { key } = req.params;

  // 1. Check if it's an external stream asset - redirect directly to CDN
  try {
    const asset = await AudioAsset.findOne({ storageKey: key });
    if (asset && asset.storageProvider === 'external_stream' && asset.externalUrl) {
      res.redirect(302, asset.externalUrl);
      return;
    }
  } catch (err: any) {
    logger.warn('Failed to resolve audio asset for redirect', { error: err.message, storageKey: key });
  }

  // 2. Fallback to local storage file
  const filePath = storageProvider.getFilePath(key);

  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: { code: 'AUDIO_NOT_FOUND', message: 'Audio asset not found' } });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'audio/wav';
  if (ext === '.mp3') contentType = 'audio/mpeg';
  if (ext === '.ogg') contentType = 'audio/ogg';
  if (ext === '.webm') contentType = 'audio/webm';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});
