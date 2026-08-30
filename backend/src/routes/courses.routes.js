import { Router } from 'express';
import { getCourses, getCourseById, getCourseChapters, getPublicAnnouncements } from '../controllers/courses.controller.js';
import { getMaterialStreamUrl, getChapterVideoUrl } from '../controllers/stream.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// ── Static routes MUST come before /:id wildcard ─────────────────────────────
// Express matches routes in registration order. If /:id is registered first,
// it would swallow /announcements, /materials/:id/stream, and /chapters/:id/video.

router.get('/announcements', getPublicAnnouncements);   // public — no auth

// Secure file/video access — auth + enrollment checked in controller
// Returns a time-limited signed URL to stream from private R2.
// NOTE: These MUST be declared before router.get('/:id') below.
router.get('/materials/:id/stream', requireAuth, getMaterialStreamUrl);
router.get('/chapters/:id/video',   requireAuth, getChapterVideoUrl);

// ── Dynamic routes (wildcard last) ───────────────────────────────────────────
router.get('/',              getCourses);
router.get('/:id',           getCourseById);
router.get('/:id/chapters',  requireAuth, getCourseChapters);

export default router;
