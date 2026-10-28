/**
 * Banana Brain — Authentication Guard Middleware
 * Ensures routes are only accessible to authenticated user sessions.
 */

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to access this resource.'
      }
    });
  }

  req.user = {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role || 'player'
  };

  next();
}
