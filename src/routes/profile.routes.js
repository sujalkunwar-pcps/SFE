/**
 * Banana Brain — Profile Routes
 */
import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);

export default router;
