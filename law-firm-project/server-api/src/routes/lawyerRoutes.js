import { Router } from 'express';
import { requireAuth, requireLawyer } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as bookingController from '../controllers/lawyer/bookingController.js';
import * as portalController from '../controllers/lawyer/portalController.js';

const router = Router();
router.use(requireAuth, requireLawyer);

router.get('/profile', asyncHandler(portalController.profile));
router.patch('/profile', asyncHandler(portalController.updateProfile));
router.get('/schedules', asyncHandler(portalController.schedules));
router.put('/schedules', asyncHandler(portalController.replaceSchedules));

router.get('/bookings', asyncHandler(bookingController.list));
router.get('/bookings/:id', asyncHandler(bookingController.getOne));
router.patch('/bookings/:id/status', asyncHandler(bookingController.updateStatus));
router.delete('/bookings/:id', asyncHandler(bookingController.remove));

export default router;
