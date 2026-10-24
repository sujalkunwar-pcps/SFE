/**
 * Banana Brain — In-Memory Rate Limiting Middleware
 * Protects critical authentication and submission routes against brute force attacks.
 */

class RateLimiter {
  constructor(windowMs = 60 * 1000, maxRequests = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();

    // Clean up expired buckets periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now > record.resetTime) {
          this.hits.delete(key);
        }
      }
    }, windowMs).unref();
  }

  middleware(max = this.maxRequests, windowMs = this.windowMs) {
    return (req, res, next) => {
      // In test mode, skip rate limiting to avoid test interference
      if (process.env.NODE_ENV === 'test') {
        return next();
      }

      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const key = `${clientIp}:${req.baseUrl || req.path}`;
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + windowMs };
        this.hits.set(key, record);
      } else {
        record.count++;
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > max) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please try again after ${retryAfter} seconds.`
          }
        });
      }

      next();
    };
  }
}

export const rateLimiter = new RateLimiter();
