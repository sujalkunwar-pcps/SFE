/**
 * Banana Brain — Game Routes
 * Protected endpoints for puzzle challenge retrieval and answer submissions.
 */
import { Router } from 'express';
import { gameController } from '../controllers/game.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Ensure all gameplay endpoints require an authenticated virtual identity
router.use(requireAuth);

// Rate limiter for challenges (60 requests per minute)
const gameLimiter = rateLimiter.middleware(60, 60 * 1000);

router.post('/challenges', gameLimiter, gameController.getChallenge);
router.post('/challenges/:id/answer', gameLimiter, gameController.submitAnswer);
router.get('/stats', gameController.getStats);
router.get('/history', gameController.getHistory);

export default router;
