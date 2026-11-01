import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger/index.js';

export interface StorageProvider {
  saveFile(buffer: Buffer, extension: string): Promise<{ storageKey: string; fileSizeBytes: number; mimeType: string }>;
  getFilePath(storageKey: string): string | null;
  deleteFile(storageKey: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.env.STORAGE_LOCAL_DIR || path.resolve(process.cwd(), 'uploads/audio');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(
    buffer: Buffer,
    extension: string
  ): Promise<{ storageKey: string; fileSizeBytes: number; mimeType: string }> {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    // Opaque random UUID key to never leak title
    const randomKey = crypto.randomUUID();
    const filename = `${randomKey}${ext}`;
    const filePath = path.join(this.baseDir, filename);

    fs.writeFileSync(filePath, buffer);

    let mimeType = 'audio/wav';
    if (ext === '.mp3') mimeType = 'audio/mpeg';
    if (ext === '.ogg') mimeType = 'audio/ogg';
    if (ext === '.webm') mimeType = 'audio/webm';

    logger.info('Saved audio asset to local storage', {
      component: 'storage',
      storageKey: filename,
      fileSizeBytes: buffer.length,
    });

    return {
      storageKey: filename,
      fileSizeBytes: buffer.length,
      mimeType,
    };
  }

  getFilePath(storageKey: string): string | null {
    // Sanitize to prevent directory traversal
    const safeKey = path.basename(storageKey);
    const fullPath = path.join(this.baseDir, safeKey);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = this.getFilePath(storageKey);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

export const storageProvider = new LocalStorageProvider();
