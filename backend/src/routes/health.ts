import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../db/connection.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  const uptime = process.uptime();

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(uptime),
    database: {
      connected: dbConnected,
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
