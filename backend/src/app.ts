import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { healthRouter } from './routes/health.js';
import { catalogRouter } from './routes/catalog.js';
import { assetsRouter } from './routes/assets.js';
import { adminRouter } from './routes/admin.js';
import { roomsRouter } from './routes/rooms.js';
import { logger } from './logger/index.js';

export function createApp(): Express {
  const app = express();

  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

  // Enable gzip/deflate response compression for all responses
  app.use(compression());

  // Security headers: allow audio streaming and CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    if (req.path !== '/api/health') {
      logger.debug(`${req.method} ${req.path}`, { component: 'http' });
    }
    next();
  });

  // Root server status
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Tune Clash Game Server',
      status: 'online',
      version: '1.0.0',
      health: '/api/health',
      catalog: '/api/catalog',
      message: 'This is the WebSocket & API backend. Visit your Vercel frontend URL to play the game!',
    });
  });

  // Mount API routes
  app.use('/api', healthRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/rooms', roomsRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'API route not found' },
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    logger.error('Unhandled server error', { component: 'http', error: err.message });
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected internal error occurred' },
    });
  });

  return app;
}
