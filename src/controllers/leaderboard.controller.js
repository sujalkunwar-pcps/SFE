/**
 * Banana Brain — Leaderboard Controller
 * Exposes global ranking and comparative player position endpoints.
 */
import { leaderboardService } from '../services/leaderboard.service.js';

export const leaderboardController = {
  async getLeaderboard(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit || '25', 10), 100);
      const currentUserId = req.session?.userId || null;

      const data = await leaderboardService.getLeaderboard(limit, currentUserId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
};
