/**
 * Banana Brain — Authentication Routes
 */
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Rate limit authentication attempts (15 attempts per minute)
const authLimiter = rateLimiter.middleware(15, 60 * 1000);

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

export default router;
