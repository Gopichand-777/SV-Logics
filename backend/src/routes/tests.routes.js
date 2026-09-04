import { Router } from 'express';
import { getTests, getTestById, submitTest, getAttemptResult, getAttemptHistory } from '../controllers/tests.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: Mock test catalogue and attempt management
 */

/**
 * @swagger
 * /tests:
 *   get:
 *     summary: Get paginated published mock tests
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 9
 *         description: Tests per page (max 50)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by exam category (e.g. SSC CGL)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject (case-insensitive match)
 *     responses:
 *       200:
 *         description: Paginated list of tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MockTest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:      { type: integer }
 *                     page:       { type: integer }
 *                     limit:      { type: integer }
 *                     totalPages: { type: integer }
 */
router.get('/', requireAuth, getTests);


/**
 * @swagger
 * /tests/attempts/history:
 *   get:
 *     summary: Get the current student's attempt history
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attempt history list
 */
router.get('/attempts/history', requireAuth, getAttemptHistory);

/**
 * @swagger
 * /tests/attempts/{attemptId}:
 *   get:
 *     summary: Get a specific attempt result with answer details
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Full attempt result
 *       404:
 *         description: Attempt not found
 */
router.get('/attempts/:attemptId', requireAuth, getAttemptResult);

/**
 * @swagger
 * /tests/{id}:
 *   get:
 *     summary: Get a single test with its questions
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test with questions
 *       404:
 *         description: Not found
 *
 * /tests/{id}/submit:
 *   post:
 *     summary: Submit a test attempt
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     selectedOption:
 *                       type: string
 *                       enum: [a, b, c, d]
 *               timeTakenSec:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Attempt submitted, returns score
 */
router.get('/:id',          requireAuth, getTestById);
router.post('/:id/submit',  requireAuth, submitTest);

export default router;
