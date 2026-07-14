import { Router } from 'express';
import { requireAuth, requireUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as bookingController from '../controllers/customer/bookingController.js';

const router = Router();
router.use(requireAuth, requireUser);

router.get('/bookings', asyncHandler(bookingController.list));
router.get('/bookings/:id', asyncHandler(bookingController.getOne));
router.post('/bookings', asyncHandler(bookingController.create));
router.put('/bookings/:id', asyncHandler(bookingController.update));
router.patch('/bookings/:id/cancel', asyncHandler(bookingController.cancel));

export default router;
