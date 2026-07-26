import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.post('/change-password', requireAuth, changePassword);

export default router;
