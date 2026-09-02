import { Router } from 'express';
import { login, adminLogin, getMe, updateMe, changePassword, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints for students and admins
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Student login
 *     description: Log in as a student using username and password. Returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: student123
 *               password:
 *                 type: string
 *                 example: mypassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/admin-login:
 *   post:
 *     summary: Admin / Content Manager login
 *     description: Log in as a super_admin or content_manager using email and password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/admin-login', adminLogin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (invalidate session)
 *     description: Clears the sessionToken in the database, enforcing single-session policy.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', requireAuth, logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.get('/me',  requireAuth, getMe);
router.put('/me',  requireAuth, updateMe);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Wrong current password
 */
router.post('/change-password', requireAuth, changePassword);

export default router;
