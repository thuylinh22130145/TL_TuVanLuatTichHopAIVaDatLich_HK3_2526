import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

import * as authController from '../controllers/auth/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * ===========================
 * Authentication
 * Base URL: /api/auth
 * ===========================
 */

// Đăng ký
router.post(
  '/register',
  asyncHandler(authController.register)
);

// Đăng nhập
router.post(
  '/login',
  asyncHandler(authController.login)
);

// Đăng xuất
router.post(
  '/logout',
  requireAuth,
  asyncHandler(authController.logout)
);

// Lấy thông tin tài khoản hiện tại
router.get(
  '/profile',
  requireAuth,
  asyncHandler(authController.profile)
);

export default router;