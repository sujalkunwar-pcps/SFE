/**
 * Banana Brain — Structured Logger Utility
 * Provides timestamped, level-tagged logging with sanitization of sensitive values.
 */

const SENSITIVE_KEYS = ['password', 'confirmPassword', 'token', 'secret', 'solution', 'cookie'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  let logStr = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    logStr += ` | ${JSON.stringify(sanitize(meta))}`;
  }
  return logStr;
}

export const logger = {
  info(message, meta = {}) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta = {}) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta = {}) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('debug', message, meta));
    }
  }
};
