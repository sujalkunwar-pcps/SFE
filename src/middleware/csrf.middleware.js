/**
 * Banana Brain — CSRF Protection Middleware
 * Implements Synchronizer Token Pattern using session-backed cryptographically secure tokens.
 */
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function csrfProtection(req, res, next) {
  // Ensure session has a CSRF token
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }

  // Safe HTTP read methods are exempt from CSRF checks
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // In test environment, bypass CSRF verification for seamless agent testing
  if (process.env.NODE_ENV === 'test' || env.isTest) {
    return next();
  }

  // Check incoming header or body against session token
  const clientToken = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!req.session?.csrfToken || !clientToken || clientToken !== req.session.csrfToken) {
    // If it's initial login/register and no token exists yet, we generate and allow initial handshake
    if ((req.path === '/api/auth/login' || req.path === '/api/auth/register') && !clientToken) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      }
    });
  }

  next();
}

/**
 * Controller endpoint to deliver the CSRF token to the client.
 */
export function getCsrfToken(req, res) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.json({
    success: true,
    csrfToken: req.session.csrfToken
  });
}
