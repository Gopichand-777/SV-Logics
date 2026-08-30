import { Router } from 'express';
import { login, adminLogin, getMe, updateMe, changePassword, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login',           login);           // Student login -- main website
router.post('/admin-login',     adminLogin);      // Admin/CM login -- admin panel
router.post('/logout',          requireAuth, logout); // Clears sessionToken in DB
router.get('/me',               requireAuth, getMe);
router.put('/me',               requireAuth, updateMe);
router.post('/change-password', requireAuth, changePassword);

export default router;

