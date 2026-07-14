import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import * as lawyerCtrl from '../controllers/public/lawyerController.js';
import * as lawyerApplicationCtrl from '../controllers/public/lawyerApplicationController.js';
import * as bookingCtrl from '../controllers/public/bookingController.js';
import * as chatCtrl from '../controllers/public/chatController.js';

const router = Router();

router.get('/lawyers', asyncHandler(lawyerCtrl.getLawyers));
router.post('/lawyer-applications', optionalAuth, asyncHandler(lawyerApplicationCtrl.submitApplication));
router.post('/bookings', asyncHandler(bookingCtrl.createBooking));
router.post('/chat', asyncHandler(chatCtrl.postChat));

export default router;
