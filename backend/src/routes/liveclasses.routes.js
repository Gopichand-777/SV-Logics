import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getLiveClasses } from '../controllers/admin.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Live Classes
 *   description: Live class sessions (Zoom / Google Meet) for students
 */

/**
 * @swagger
 * /live-classes:
 *   get:
 *     summary: Get all published live classes
 *     description: Returns all active (published) live classes ordered by scheduledAt ascending. Accessible to all logged-in students.
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of live classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liveClasses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveClass'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', requireAuth, getLiveClasses);

export default router;
