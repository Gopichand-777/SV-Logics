import { Router } from 'express';
import { initiatePayment, verifyPayment, getPaymentHistory, getEnrollments } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/initiate', requireAuth, initiatePayment);
router.post('/verify', requireAuth, verifyPayment);
router.get('/history', requireAuth, getPaymentHistory);
router.get('/enrollments', requireAuth, getEnrollments);

export default router;
