import './config/env.js'; // validate env vars first
import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { mkdirSync } from 'fs';

// Ensure upload dir exists
try { mkdirSync(env.UPLOAD_DIR, { recursive: true }); } catch {}

const server = createServer(app);

async function start() {
  try {
    await connectDatabase();

    server.listen(env.PORT, () => {
      logger.info(`🚀 Aletheia API running on http://localhost:${env.PORT}`);
      logger.info(`   Environment : ${env.NODE_ENV}`);
      logger.info(`   Stellar     : ${env.STELLAR_NETWORK}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabase();
    logger.info('Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

start();
