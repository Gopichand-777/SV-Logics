import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Student dashboard summary (enrolled courses, streaks, recent tests)
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get student dashboard data
 *     description: Returns enrolled courses, current streak, recent test attempts, and study stats.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrolledCourses:
 *                   type: array
 *                 recentAttempts:
 *                   type: array
 *                 streak:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', requireAuth, getDashboard);

export default router;
