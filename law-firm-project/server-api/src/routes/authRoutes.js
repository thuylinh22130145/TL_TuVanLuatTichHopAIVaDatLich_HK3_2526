import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authController from '../controllers/auth/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post(
  '/verify-register-otp',
  asyncHandler(authController.verifyRegistrationOtp)
);
router.post('/login', asyncHandler(authController.login));
router.post('/logout', requireAuth, asyncHandler(authController.logout));
router.get('/profile', requireAuth, asyncHandler(authController.profile));

export default router;
