/**
 * Banana Brain — Game Controller
 * Exposes REST endpoints for challenges, answers, statistics, and history.
 */
import { gameService } from '../services/game.service.js';

export const gameController = {
  async getChallenge(req, res, next) {
    try {
      const sessionId = req.query.sessionId || null;
      const challenge = await gameService.startChallenge(req.user.id, sessionId);

      res.status(200).json({
        success: true,
        challenge
      });
    } catch (err) {
      next(err);
    }
  },

  async submitAnswer(req, res, next) {
    try {
      const challengeId = req.params.id;
      const { answer } = req.body;

      const result = await gameService.submitAnswer(req.user.id, challengeId, answer);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await gameService.getUserStats(req.user.id);
      res.status(200).json({
        success: true,
        stats
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
      const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

      const history = await gameService.getUserHistory(req.user.id, limit, offset);
      res.status(200).json({
        success: true,
        count: history.length,
        history
      });
    } catch (err) {
      next(err);
    }
  }
};
