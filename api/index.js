/**
 * Banana Brain — Vercel Serverless Function Entry Point
 * Exports an asynchronous request handler that boots the database and delegates to Express.
 */
import { createApp } from '../src/app.js';
import { initializeDatabase } from '../src/database/init.js';
import { logger } from '../src/utils/logger.js';

let appInstance = null;
let initPromise = null;

async function getApp() {
  if (!appInstance) {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await initializeDatabase();
          logger.info('Database initialized successfully for serverless handler.');
        } catch (err) {
          logger.error('Database initialization failed in serverless handler:', { error: err.message, stack: err.stack });
          throw err;
        }
      })();
    }
    await initPromise;
    appInstance = createApp();
  }
  return appInstance;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    logger.error('Unhandled serverless function invocation error:', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: {
        code: 'FUNCTION_ERROR',
        message: 'Internal server error during request execution'
      }
    });
  }
}
