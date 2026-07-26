import { Router } from 'express';
import { getTests, getTestById, submitTest, getAttemptResult, getAttemptHistory } from '../controllers/tests.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, getTests);
router.get('/attempts/history', requireAuth, getAttemptHistory);
router.get('/attempts/:attemptId', requireAuth, getAttemptResult);
router.get('/:id', requireAuth, getTestById);
router.post('/:id/submit', requireAuth, submitTest);

export default router;
