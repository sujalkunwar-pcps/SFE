/**
 * Banana Brain — Server Entry Point
 * Initializes relational database and boots the HTTP server.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './config/database.js';
import { initializeDatabase } from './database/init.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    logger.info('Starting Banana Brain Platform...');

    // Initialize database schema and seeds
    await initializeDatabase();

    // Create Express application
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`  BANANA BRAIN — DISTRIBUTED PUZZLE CHALLENGE PLATFORM  `);
      logger.info(`  Server running at: http://localhost:${env.PORT}        `);
      logger.info(`  Environment:       ${env.NODE_ENV}                    `);
      logger.info(`  Database Driver:   ${db.driver}                       `);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Gracefully shutting down Banana Brain...`);
      server.close(async () => {
        await db.close();
        logger.info('HTTP server and database connections closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    logger.error('Fatal startup error during server bootstrap:', {
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
}

bootstrap();
