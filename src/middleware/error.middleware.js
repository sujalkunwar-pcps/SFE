/**
 * Banana Brain — Centralized Error Handling Middleware
 * Catches unhandled exceptions and formats consistent, sanitized JSON responses.
 */
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isServerFault = statusCode >= 500;

  if (isServerFault) {
    logger.error(`Server Error: ${err.message}`, {
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  } else {
    logger.warn(`Client Error: ${err.message}`, {
      path: req.path,
      method: req.method,
      status: statusCode
    });
  }

  // Sanitize error response: Never leak internal stack traces in production
  const errorResponse = {
    success: false,
    error: {
      code: err.code || (statusCode === 404 ? 'NOT_FOUND' : isServerFault ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
      message: isServerFault && env.isProduction
        ? 'An unexpected server error occurred. Please try again later.'
        : err.message
    }
  };

  if (!env.isProduction && err.stack) {
    errorResponse.error.stack = err.stack.split('\n').slice(0, 4);
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `The requested endpoint [${req.method} ${req.originalUrl}] does not exist.`
    }
  });
}
