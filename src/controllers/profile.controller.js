/**
 * Banana Brain — Profile Controller
 * Exposes endpoints for managing virtual identity attributes.
 */
import { authService } from '../services/auth.service.js';

export const profileController = {
  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        user: profile
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updated = await authService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updated
      });
    } catch (err) {
      next(err);
    }
  }
};
