import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { GameManager } from './game/GameManager.js';
import { Track } from './models/index.js';
import { seedPopularCommercialCatalog, purgePreloadedDemoTracks } from './services/catalogService.js';
import { logger } from './logger/index.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

async function bootstrap() {
  try {
    // 1. Connect to Database (real or in-memory)
    await connectDatabase();

    // 2. Remove any preloaded synthetic demo tracks from memory so they never clash with original songs
    await purgePreloadedDemoTracks();

    // 3. Seed authentic popular Bollywood & Hollywood tracks
    const approvedCount = await Track.countDocuments({ status: 'approved' });
    if (approvedCount < 10) {
      logger.info('Seeding catalog with authentic popular Bollywood & Hollywood tracks...', {
        component: 'bootstrap',
      });
      await seedPopularCommercialCatalog();
    } else {
      logger.info(`Detected ${approvedCount} approved authentic tracks in catalog ready for play.`, {
        component: 'bootstrap',
      });
    }

    // 3. Initialize Express & HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 10000,
      pingInterval: 5000,
    });

    // 5. Initialize Game Manager
    new GameManager(io);

    // 6. Start listening
    server.listen(PORT, () => {
      logger.info(`Tune Clash Game Server running on port ${PORT}`, {
        component: 'bootstrap',
        port: PORT,
        origin: ALLOWED_ORIGIN,
      });
    });

    // 7. Graceful shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`, { component: 'bootstrap' });
      io.close();
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server and database shut down cleanly.', { component: 'bootstrap' });
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err: any) {
    logger.error('Server failed to start', { component: 'bootstrap', error: err.message });
    process.exit(1);
  }
}

bootstrap();
