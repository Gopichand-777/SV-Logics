import { Router } from 'express';
import { getCourses, getCourseById, getCourseChapters } from '../controllers/courses.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.get('/:id/chapters', requireAuth, getCourseChapters);

export default router;
