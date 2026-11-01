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

  // 1. Check if it's an external stream asset
  try {
    const asset = await AudioAsset.findOne({ storageKey: key });
    if (asset && asset.storageProvider === 'external_stream' && asset.externalUrl) {
      try {
        let cached = previewCache.get(key);
        const now = Date.now();
        if (!cached || now - cached.cachedAt > CACHE_TTL_MS) {
          const response = await fetch(asset.externalUrl);
          if (!response.ok) {
            res.status(502).json({ error: { code: 'PREVIEW_UNAVAILABLE', message: 'Could not stream preview audio' } });
            return;
          }
          const arrayBuffer = await response.arrayBuffer();
          cached = {
            buffer: Buffer.from(arrayBuffer),
            mimeType: asset.mimeType || 'audio/mp4',
            cachedAt: now,
          };
          previewCache.set(key, cached);
        }

        const buffer = cached.buffer;
        const fileSize = buffer.length;
        const range = req.headers.range;
        const contentType = cached.mimeType;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

          if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
            return;
          }

          const chunkSize = end - start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          });
          res.end(buffer.subarray(start, end + 1));
          return;
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400',
          });
          res.end(buffer);
          return;
        }
      } catch (err: any) {
        logger.error('Failed to proxy external audio preview', { error: err.message, storageKey: key });
      }
    }
  } catch (err) {}

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
