/**
 * Banana Brain — Leaderboard Routes
 */
import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller.js';

const router = Router();

router.get('/', leaderboardController.getLeaderboard);

export default router;
