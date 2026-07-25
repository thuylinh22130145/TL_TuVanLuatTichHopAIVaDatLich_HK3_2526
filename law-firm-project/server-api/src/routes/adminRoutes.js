import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

import {
  requireAuth,
  requireAdmin,
} from '../middleware/authMiddleware.js';

import * as lawyerCtrl from '../controllers/admin/lawyerController.js';
import * as lawyerApplicationCtrl from '../controllers/admin/lawyerApplicationController.js';
import * as bookingCtrl from '../controllers/admin/bookingController.js';
import * as documentCtrl from '../controllers/admin/documentController.js';
import * as portalCtrl from '../controllers/admin/portalController.js';

const router = Router();

/**
 * Tất cả API Admin đều yêu cầu:
 * - Đăng nhập
 * - Role = ADMIN
 */
router.use(requireAuth);
router.use(requireAdmin);

router.get('/overview', asyncHandler(portalCtrl.overview));
router.get('/users', asyncHandler(portalCtrl.users));
router.patch('/users/:id/status', asyncHandler(portalCtrl.updateUserStatus));
router.delete('/users/:id', asyncHandler(portalCtrl.deleteUserAccount));
router.get('/categories', asyncHandler(portalCtrl.categories));
router.post('/categories', asyncHandler(portalCtrl.createCategory));
router.put('/categories/:id', asyncHandler(portalCtrl.updateCategory));
router.delete('/categories/:id', asyncHandler(portalCtrl.deleteCategory));

/* =========================
   Lawyer Management
========================= */

router.get('/lawyers', asyncHandler(lawyerCtrl.list));

router.get('/lawyers/:id', asyncHandler(lawyerCtrl.getOne));

router.post('/lawyers', asyncHandler(lawyerCtrl.create));

router.put('/lawyers/:id', asyncHandler(lawyerCtrl.update));

router.delete('/lawyers/:id', asyncHandler(lawyerCtrl.remove));

/* =========================
   Lawyer Application Approvals
========================= */
router.get('/lawyer-applications', asyncHandler(lawyerApplicationCtrl.list));
router.get('/lawyer-applications/:id', asyncHandler(lawyerApplicationCtrl.getOne));
router.post('/lawyer-applications/:id/approve', asyncHandler(lawyerApplicationCtrl.approve));
router.post('/lawyer-applications/:id/reject', asyncHandler(lawyerApplicationCtrl.reject));

/* =========================
   Booking Management
========================= */

router.get('/bookings', asyncHandler(bookingCtrl.list));

router.get('/bookings/:id', asyncHandler(bookingCtrl.getOne));

router.post('/bookings', asyncHandler(bookingCtrl.create));

router.put('/bookings/:id', asyncHandler(bookingCtrl.update));

router.delete('/bookings/:id', asyncHandler(bookingCtrl.remove));

/* =========================
   Document Management
========================= */

router.get('/documents', asyncHandler(documentCtrl.list));

router.get('/documents/:docId', asyncHandler(documentCtrl.getOne));

router.post('/documents', asyncHandler(documentCtrl.create));

router.put('/documents/:docId', asyncHandler(documentCtrl.update));

router.delete('/documents/:docId', asyncHandler(documentCtrl.remove));

export default router;
