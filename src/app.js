/**
 * Banana Brain — Express Application Factory
 * Configures middleware pipeline, security headers, sessions, API routing, and static file serving.
 */
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { db } from './config/database.js';
import { logger } from './utils/logger.js';
import { csrfProtection, getCsrfToken } from './middleware/csrf.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { registerDomainEventHandlers } from './events/event-handlers.js';

import authRoutes from './routes/auth.routes.js';
import gameRoutes from './routes/game.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import profileRoutes from './routes/profile.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

export function createApp() {
  const app = express();

  // Register domain event handlers
  registerDomainEventHandlers();

  // 1. Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 2. Request Parsing & Body Size Limits
  app.use(express.json({ limit: '500kb' }));
  app.use(express.urlencoded({ extended: true, limit: '500kb' }));

  // 3. Server-Side Session Management
  app.use(
    session({
      name: env.SESSION_NAME,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // Inaccessible to JavaScript (XSS protection)
        secure: env.COOKIE_SECURE, // true in HTTPS production
        sameSite: 'lax', // CSRF mitigation
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // 4. CSRF Protection Middleware
  app.use(csrfProtection);

  // 5. Static File Serving (HTML/CSS/JS frontend)
  app.use(express.static(publicDir));

  // 6. System & Utility Endpoints
  app.get('/api/csrf-token', getCsrfToken);

  app.get('/api/health', async (req, res) => {
    res.json({
      status: 'ok',
      service: 'Banana Brain Distributed System',
      timestamp: new Date().toISOString(),
      databaseDriver: db.driver,
      environment: env.NODE_ENV
    });
  });

  // 7. Core REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/game', gameRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/profile', profileRoutes);

  // 8. 404 & Centralized Error Handling
  app.use('/api', notFoundHandler);

  // Fallback for SPA/browser routes: serve index.html if unmatched GET request
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      return res.sendFile(path.join(publicDir, 'index.html'));
    }
    next();
  });

  app.use(errorHandler);

  return app;
}
