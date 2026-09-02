import { Router } from 'express';
import { getCourses, getCourseById, getCourseChapters, getPublicAnnouncements } from '../controllers/courses.controller.js';
import { getMaterialStreamUrl, getChapterVideoUrl } from '../controllers/stream.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course catalogue, chapters, and media streaming
 */

/**
 * @swagger
 * /courses/announcements:
 *   get:
 *     summary: Get public announcements
 *     description: Returns active announcements (no auth required).
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of announcements
 */
router.get('/announcements', getPublicAnnouncements);

/**
 * @swagger
 * /courses/materials/{id}/stream:
 *   get:
 *     summary: Get a signed streaming URL for a study material
 *     description: Returns a time-limited signed URL to stream a private file from R2 storage. Checks auth and enrollment.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study material ID
 *     responses:
 *       200:
 *         description: Signed URL for streaming
 *       403:
 *         description: Not enrolled
 */
router.get('/materials/:id/stream', requireAuth, getMaterialStreamUrl);

/**
 * @swagger
 * /courses/chapters/{id}/video:
 *   get:
 *     summary: Get a signed video URL for a chapter
 *     tags: [Courses]
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
 *         description: Signed video URL
 *       403:
 *         description: Not enrolled
 */
router.get('/chapters/:id/video', requireAuth, getChapterVideoUrl);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *
 * /courses/{id}:
 *   get:
 *     summary: Get a single course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID or slug
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Not found
 *
 * /courses/{id}/chapters:
 *   get:
 *     summary: Get chapters for a course (enrolled students only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of chapters
 *       403:
 *         description: Not enrolled
 */
router.get('/',             getCourses);
router.get('/:id',          getCourseById);
router.get('/:id/chapters', requireAuth, getCourseChapters);

export default router;
