import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin, requireSuperAdmin, requireContentManager } from '../middleware/admin.middleware.js';
import {
  getOverview,
  getUsers, updateUserRole, updateUserStatus, deleteUser,
  adminGetCourses, adminCreateCourse, adminUpdateCourse, adminDeleteCourse,
  adminGetChapters, adminCreateChapter, adminUpdateChapter, adminDeleteChapter,
  adminGetTests, adminCreateTest, adminUpdateTest, adminDeleteTest,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion, adminBulkImportQuestions,
  adminGetEnrollments, adminGetPayments,
  adminGetAnnouncements, adminCreateAnnouncement,
  adminGetMaterials, adminAddMaterial, adminDeleteMaterial,
} from '../controllers/admin.controller.js';

const router = Router();
// All admin routes require auth + at least content_manager role
router.use(requireAuth, requireAdmin);

// ── Analytics (super admin only) ──
router.get('/overview', requireSuperAdmin, getOverview);

// ── Users (super admin only) ──
router.get('/users', requireSuperAdmin, getUsers);
router.patch('/users/:id/role', requireSuperAdmin, updateUserRole);
router.patch('/users/:id/status', requireSuperAdmin, updateUserStatus);
router.delete('/users/:id', requireSuperAdmin, deleteUser);

// ── Courses (content manager + super admin) ──
router.get('/courses', adminGetCourses);
router.post('/courses', adminCreateCourse);
router.put('/courses/:id', adminUpdateCourse);
router.delete('/courses/:id', adminDeleteCourse);

// ── Chapters ──
router.get('/courses/:courseId/chapters', adminGetChapters);
router.post('/courses/:courseId/chapters', adminCreateChapter);
router.put('/chapters/:id', adminUpdateChapter);
router.delete('/chapters/:id', adminDeleteChapter);

// ── Tests ──
router.get('/tests', adminGetTests);
router.post('/tests', adminCreateTest);
router.put('/tests/:id', adminUpdateTest);
router.delete('/tests/:id', adminDeleteTest);

// ── Questions ──
router.get('/tests/:testId/questions', adminGetQuestions);
router.post('/tests/:testId/questions', adminCreateQuestion);
router.post('/tests/:testId/questions/bulk', adminBulkImportQuestions);
router.put('/questions/:id', adminUpdateQuestion);
router.delete('/questions/:id', adminDeleteQuestion);

// ── Enrollments & Payments (super admin only) ──
router.get('/enrollments', requireSuperAdmin, adminGetEnrollments);
router.get('/payments', requireSuperAdmin, adminGetPayments);

// ── Announcements ──
router.get('/announcements', adminGetAnnouncements);
router.post('/announcements', adminCreateAnnouncement);

// ── Study Materials ──
// BUG-006: Added missing GET route (was 404 before)
router.get('/materials', adminGetMaterials);
router.post('/materials', adminAddMaterial);
router.delete('/materials/:id', adminDeleteMaterial);

export default router;
