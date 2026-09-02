import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin.middleware.js';
import { generatePresignedPutUrl } from '../controllers/upload.controller.js';
import {
  getOverview,
  getStudents, createStudent, updateStudentStatus, deleteStudent, resetStudentPassword,
  adminGetStudentCourses, adminGrantCourseAccess, adminRevokeCourseAccess,
  getAdminStaff, createAdminStaff, updateAdminStaffStatus, deleteAdminStaff,
  adminGetCourses, adminCreateCourse, adminUpdateCourse, adminDeleteCourse,
  adminGetSubjects, adminCreateSubject, adminUpdateSubject, adminDeleteSubject,
  adminGetChapters, adminCreateChapter, adminUpdateChapter, adminDeleteChapter,
  adminGetTests, adminCreateTest, adminUpdateTest, adminDeleteTest,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion, adminBulkImportQuestions,
  adminGetEnrollments, adminGetPayments,
  adminGetAnnouncements, adminCreateAnnouncement,
  adminGetMaterials, adminAddMaterial, adminDeleteMaterial,
  adminGetLiveClasses, adminCreateLiveClass, adminUpdateLiveClass, adminDeleteLiveClass,
} from '../controllers/admin.controller.js';

const router = Router();
// All admin routes require auth + at least content_manager role
router.use(requireAuth, requireAdmin);

// Analytics (super admin only)
router.get('/overview', requireSuperAdmin, getOverview);

// Students (super admin only)
router.get('/students', requireSuperAdmin, getStudents);
router.post('/students', requireSuperAdmin, createStudent);
router.patch('/students/:id/status', requireSuperAdmin, updateStudentStatus);
router.patch('/students/:id/reset-password', requireSuperAdmin, resetStudentPassword);
router.delete('/students/:id', requireSuperAdmin, deleteStudent);

// Student course access management (super admin only)
router.get('/students/:studentId/courses', requireSuperAdmin, adminGetStudentCourses);
router.post('/students/:studentId/courses/:courseId/grant', requireSuperAdmin, adminGrantCourseAccess);
router.delete('/students/:studentId/courses/:courseId/revoke', requireSuperAdmin, adminRevokeCourseAccess);

// Admin Staff (super admin only)
router.get('/staff', requireSuperAdmin, getAdminStaff);
router.post('/staff', requireSuperAdmin, createAdminStaff);
router.patch('/staff/:id/:role/status', requireSuperAdmin, updateAdminStaffStatus);
router.delete('/staff/:id/:role', requireSuperAdmin, deleteAdminStaff);

// Courses (content manager + super admin)
router.get('/courses', adminGetCourses);
router.post('/courses', adminCreateCourse);
router.put('/courses/:id', adminUpdateCourse);
router.delete('/courses/:id', adminDeleteCourse);

// Course Subjects
router.get('/courses/:courseId/subjects', adminGetSubjects);
router.post('/courses/:courseId/subjects', adminCreateSubject);
router.put('/subjects/:id', adminUpdateSubject);
router.delete('/subjects/:id', adminDeleteSubject);

// Chapters
router.get('/courses/:courseId/chapters', adminGetChapters);
router.post('/courses/:courseId/chapters', adminCreateChapter);
router.put('/chapters/:id', adminUpdateChapter);
router.delete('/chapters/:id', adminDeleteChapter);

// Tests
router.get('/tests', adminGetTests);
router.post('/tests', adminCreateTest);
router.put('/tests/:id', adminUpdateTest);
router.delete('/tests/:id', adminDeleteTest);

// Questions
router.get('/tests/:testId/questions', adminGetQuestions);
router.post('/tests/:testId/questions', adminCreateQuestion);
router.post('/tests/:testId/questions/bulk', adminBulkImportQuestions);
router.put('/questions/:id', adminUpdateQuestion);
router.delete('/questions/:id', adminDeleteQuestion);

// Enrollments & Payments (super admin only)
router.get('/enrollments', requireSuperAdmin, adminGetEnrollments);
router.get('/payments', requireSuperAdmin, adminGetPayments);

// Announcements
router.get('/announcements', adminGetAnnouncements);
router.post('/announcements', adminCreateAnnouncement);

// Study Materials
router.get('/materials', adminGetMaterials);
router.post('/materials', adminAddMaterial);
router.delete('/materials/:id', adminDeleteMaterial);

// File Upload — generates presigned PUT URL for direct browser→R2 upload
// File never touches Render server; browser uploads directly to Cloudflare R2
// Restricted to super_admin only — content managers cannot upload files
router.post('/upload/presign', requireSuperAdmin, generatePresignedPutUrl);

/**
 * @swagger
 * /admin/live-classes:
 *   get:
 *     summary: List all live classes (admin)
 *     tags: [Admin - Live Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All live classes
 *   post:
 *     summary: Create a live class
 *     tags: [Admin - Live Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LiveClassInput'
 *     responses:
 *       201:
 *         description: Created
 *
 * /admin/live-classes/{id}:
 *   put:
 *     summary: Update a live class
 *     tags: [Admin - Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LiveClassInput'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete a live class
 *     tags: [Admin - Live Classes]
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
 *         description: Deleted
 */
// Live Classes (content manager + super admin)
router.get('/live-classes',     adminGetLiveClasses);
router.post('/live-classes',    adminCreateLiveClass);
router.put('/live-classes/:id', adminUpdateLiveClass);
router.delete('/live-classes/:id', adminDeleteLiveClass);

export default router;

