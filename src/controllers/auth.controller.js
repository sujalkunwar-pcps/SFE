/**
 * Banana Brain — Authentication Controller
 * Manages HTTP boundaries for virtual identity registration, authentication, sessions, and logout.
 */
import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);

      // Session regeneration to prevent session fixation
      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.status(201).json({
          success: true,
          message: 'Virtual identity created successfully',
          user
        });
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const user = await authService.login(req.body);

      // Session regeneration on privilege boundary transition
      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({
          success: true,
          message: 'Authenticated successfully',
          user
        });
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie(process.env.SESSION_NAME || 'banana_brain_sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  },

  async me(req, res, next) {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No active session'
          }
        });
      }

      const profile = await authService.getProfile(req.session.userId);
      res.json({
        success: true,
        user: profile
      });
    } catch (err) {
      next(err);
    }
  }
};
