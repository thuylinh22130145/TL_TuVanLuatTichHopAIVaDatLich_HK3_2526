import { Router } from 'express';

import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';
import customerRoutes from './customerRoutes.js';
import lawyerRoutes from './lawyerRoutes.js';

const router = Router();

/**
 * =====================================
 * Authentication
 * Base URL: /api/auth
 * =====================================
 */
router.use('/auth', authRoutes);

/**
 * =====================================
 * Public APIs
 * Base URL: /api/public
 * =====================================
 */
router.use('/public', publicRoutes);

/**
 * =====================================
 * Admin APIs
 * Base URL: /api/admin
 * =====================================
 */
router.use('/admin', adminRoutes);

router.use('/customer', customerRoutes);
router.use('/lawyer', lawyerRoutes);

export default router;
