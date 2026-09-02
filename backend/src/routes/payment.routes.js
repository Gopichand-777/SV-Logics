import { Router } from 'express';
import { initiatePayment, verifyPayment, getPaymentHistory, getEnrollments, checkEnrollment } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Course payment initiation, verification and enrollment status
 */

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a course payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment order created
 *       409:
 *         description: Already enrolled
 */
router.post('/initiate', requireAuth, initiatePayment);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify a payment and grant enrollment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified, enrollment granted
 *       400:
 *         description: Verification failed
 */
router.post('/verify', requireAuth, verifyPayment);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get payment history for the current student
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *
 * /payments/enrollments:
 *   get:
 *     summary: Get all active enrollments for the current student
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrollments
 *
 * /payments/check/{courseId}:
 *   get:
 *     summary: Check if the current student is enrolled in a course
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrolled:
 *                   type: boolean
 */
router.get('/history',          requireAuth, getPaymentHistory);
router.get('/enrollments',      requireAuth, getEnrollments);
router.get('/check/:courseId',  requireAuth, checkEnrollment);

export default router;
