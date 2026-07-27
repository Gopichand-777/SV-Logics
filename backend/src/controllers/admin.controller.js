import { db } from '../db/index.js';
import {
  users, courses, chapters, mockTests, questions,
  enrollments, payments, testAttempts, studyMaterials, announcements
} from '../db/schema.js';
import { eq, desc, count, sum, and, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
export const getOverview = async (req, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);
    const [{ totalCourses }] = await db.select({ totalCourses: count() }).from(courses);
    const [{ totalEnrollments }] = await db.select({ totalEnrollments: count() }).from(enrollments);
    const [{ totalTests }] = await db.select({ totalTests: count() }).from(testAttempts);
    const [{ totalRevenue }] = await db.select({ totalRevenue: sum(payments.amount) })
      .from(payments).where(eq(payments.status, 'success'));

    return res.json({
      stats: {
        totalUsers: Number(totalUsers),
        totalCourses: Number(totalCourses),
        totalEnrollments: Number(totalEnrollments),
        totalTests: Number(totalTests),
        totalRevenue: Number(totalRevenue || 0),
      },
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    let allUsers = await db.select({
      id: users.id, name: users.name, email: users.email,
      phone: users.phone, role: users.role, isActive: users.isActive, createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    if (search) allUsers = allUsers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    if (role) allUsers = allUsers.filter(u => u.role === role);

    return res.json({ users: allUsers, total: allUsers.length });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowed = ['student', 'content_manager', 'super_admin'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role.' });

    const [updated] = await db.update(users).set({ role, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id))).returning({ id: users.id, name: users.name, role: users.role });
    return res.json({ message: 'Role updated.', user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const [updated] = await db.update(users).set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id))).returning({ id: users.id, isActive: users.isActive });
    return res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}.`, user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
    await db.delete(users).where(eq(users.id, parseInt(id)));
    return res.json({ message: 'User deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── COURSES ───────────────────────────────────────────────────────────────────
export const adminGetCourses = async (req, res) => {
  try {
    const allCourses = await db.select().from(courses).orderBy(desc(courses.createdAt));
    return res.json({ courses: allCourses });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateCourse = async (req, res) => {
  try {
    const { title, description, category, examType, price, originalPrice,
      durationHours, instructor, thumbnailUrl, isPublished, isFeatured } = req.body;

    if (!title || !category || price === undefined) {
      return res.status(400).json({ error: 'Title, category, and price are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const [course] = await db.insert(courses).values({
      title, slug, description, category, examType,
      price: parseInt(price), originalPrice: parseInt(originalPrice) || null,
      durationHours: parseInt(durationHours) || 0,
      instructor, thumbnailUrl,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
    }).returning();

    return res.status(201).json({ message: 'Course created!', course });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    // BUG-003: Whitelist only permitted fields — never spread raw req.body into DB
    const {
      title, description, category, examType, price, originalPrice,
      durationHours, instructor, thumbnailUrl, isPublished, isFeatured,
    } = req.body;
    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(examType !== undefined && { examType }),
      ...(price !== undefined && { price: parseInt(price) }),
      ...(originalPrice !== undefined && { originalPrice: parseInt(originalPrice) }),
      ...(durationHours !== undefined && { durationHours }),
      ...(instructor !== undefined && { instructor }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(isPublished !== undefined && { isPublished }),
      ...(isFeatured !== undefined && { isFeatured }),
      updatedAt: new Date(),
    };
    const [course] = await db.update(courses).set(updates)
      .where(eq(courses.id, parseInt(id))).returning();
    return res.json({ message: 'Course updated!', course });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteCourse = async (req, res) => {
  try {
    await db.delete(courses).where(eq(courses.id, parseInt(req.params.id)));
    return res.json({ message: 'Course deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── CHAPTERS ──────────────────────────────────────────────────────────────────
export const adminGetChapters = async (req, res) => {
  try {
    const courseChapters = await db.select().from(chapters)
      .where(eq(chapters.courseId, parseInt(req.params.courseId)))
      .orderBy(chapters.orderIndex);
    return res.json({ chapters: courseChapters });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, videoUrl, durationMin, orderIndex, isFree } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const [chapter] = await db.insert(chapters).values({
      courseId: parseInt(courseId), title, description, videoUrl,
      durationMin: parseInt(durationMin) || 0,
      orderIndex: parseInt(orderIndex) || 1, isFree: isFree || false,
    }).returning();

    // Update chapters_count on course
    await db.execute(sql`UPDATE courses SET chapters_count = (SELECT COUNT(*) FROM chapters WHERE course_id = ${parseInt(courseId)}) WHERE id = ${parseInt(courseId)}`);

    return res.status(201).json({ message: 'Chapter created!', chapter });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    // BUG-003: Whitelist only permitted fields
    const { title, description, videoUrl, durationMin, orderIndex, isFree } = req.body;
    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(durationMin !== undefined && { durationMin: parseInt(durationMin) }),
      ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) }),
      ...(isFree !== undefined && { isFree }),
    };
    const [chapter] = await db.update(chapters).set(updates)
      .where(eq(chapters.id, parseInt(id))).returning();
    return res.json({ message: 'Chapter updated!', chapter });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const [ch] = await db.select().from(chapters).where(eq(chapters.id, parseInt(id)));
    await db.delete(chapters).where(eq(chapters.id, parseInt(id)));
    if (ch) {
      await db.execute(sql`UPDATE courses SET chapters_count = (SELECT COUNT(*) FROM chapters WHERE course_id = ${ch.courseId}) WHERE id = ${ch.courseId}`);
    }
    return res.json({ message: 'Chapter deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── TESTS ─────────────────────────────────────────────────────────────────────
export const adminGetTests = async (req, res) => {
  try {
    const tests = await db.select().from(mockTests).orderBy(desc(mockTests.createdAt));
    return res.json({ tests });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateTest = async (req, res) => {
  try {
    const { title, description, courseId, category, durationMinutes, difficulty, isPublished } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const [test] = await db.insert(mockTests).values({
      title, description, courseId: courseId ? parseInt(courseId) : null,
      category, durationMinutes: parseInt(durationMinutes) || 60,
      difficulty: difficulty || 'medium', isPublished: isPublished || false,
    }).returning();
    return res.status(201).json({ message: 'Test created!', test });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateTest = async (req, res) => {
  try {
    // BUG-003: Whitelist only permitted fields
    const { title, description, courseId, category, durationMinutes, difficulty, isPublished } = req.body;
    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(courseId !== undefined && { courseId: courseId ? parseInt(courseId) : null }),
      ...(category !== undefined && { category }),
      ...(durationMinutes !== undefined && { durationMinutes: parseInt(durationMinutes) }),
      ...(difficulty !== undefined && { difficulty }),
      ...(isPublished !== undefined && { isPublished }),
    };
    const [test] = await db.update(mockTests).set(updates)
      .where(eq(mockTests.id, parseInt(req.params.id))).returning();
    return res.json({ message: 'Test updated!', test });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteTest = async (req, res) => {
  try {
    await db.delete(mockTests).where(eq(mockTests.id, parseInt(req.params.id)));
    return res.json({ message: 'Test deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── QUESTIONS ─────────────────────────────────────────────────────────────────
export const adminGetQuestions = async (req, res) => {
  try {
    const testQuestions = await db.select().from(questions)
      .where(eq(questions.testId, parseInt(req.params.testId)))
      .orderBy(questions.orderIndex);
    return res.json({ questions: testQuestions });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateQuestion = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionText, optionA, optionB, optionC, optionD, correctOption, explanation, marks, negativeMarks, orderIndex } = req.body;

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return res.status(400).json({ error: 'All question fields are required.' });
    }

    const [question] = await db.insert(questions).values({
      testId: parseInt(testId), questionText, optionA, optionB, optionC, optionD,
      correctOption, explanation, marks: parseInt(marks) || 1,
      negativeMarks: negativeMarks || '0.25', orderIndex: parseInt(orderIndex) || 1,
    }).returning();

    await db.execute(sql`UPDATE mock_tests SET total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = ${parseInt(testId)}) WHERE id = ${parseInt(testId)}`);

    return res.status(201).json({ message: 'Question added!', question });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminBulkImportQuestions = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questions: qList } = req.body;

    if (!Array.isArray(qList) || qList.length === 0) {
      return res.status(400).json({ error: 'Questions array is required.' });
    }

    const rows = qList.map((q, i) => ({
      testId: parseInt(testId),
      questionText: q.question_text,
      optionA: q.option_a, optionB: q.option_b,
      optionC: q.option_c, optionD: q.option_d,
      correctOption: q.correct_option,
      explanation: q.explanation || null,
      marks: q.marks || 1,
      negativeMarks: String(q.negative_marks || '0.25'),
      orderIndex: q.order_index || i + 1,
    }));

    await db.insert(questions).values(rows);
    await db.execute(sql`UPDATE mock_tests SET total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = ${parseInt(testId)}) WHERE id = ${parseInt(testId)}`);

    return res.json({ message: `${rows.length} questions imported!` });
  } catch (err) {
    console.error('Bulk import error:', err);
    return res.status(500).json({ error: 'Server error. Check JSON format.' });
  }
};

export const adminUpdateQuestion = async (req, res) => {
  try {
    // BUG-003: Whitelist only permitted fields
    const {
      questionText, optionA, optionB, optionC, optionD,
      correctOption, explanation, marks, negativeMarks, orderIndex,
    } = req.body;
    const updates = {
      ...(questionText !== undefined && { questionText }),
      ...(optionA !== undefined && { optionA }),
      ...(optionB !== undefined && { optionB }),
      ...(optionC !== undefined && { optionC }),
      ...(optionD !== undefined && { optionD }),
      ...(correctOption !== undefined && { correctOption }),
      ...(explanation !== undefined && { explanation }),
      ...(marks !== undefined && { marks: parseInt(marks) }),
      ...(negativeMarks !== undefined && { negativeMarks: String(negativeMarks) }),
      ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) }),
    };
    const [q] = await db.update(questions).set(updates)
      .where(eq(questions.id, parseInt(req.params.id))).returning();
    return res.json({ message: 'Question updated!', question: q });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteQuestion = async (req, res) => {
  try {
    const [q] = await db.select().from(questions).where(eq(questions.id, parseInt(req.params.id)));
    await db.delete(questions).where(eq(questions.id, parseInt(req.params.id)));
    if (q) {
      await db.execute(sql`UPDATE mock_tests SET total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = ${q.testId}) WHERE id = ${q.testId}`);
    }
    return res.json({ message: 'Question deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── ENROLLMENTS & PAYMENTS (Super Admin Only) ─────────────────────────────────
export const adminGetEnrollments = async (req, res) => {
  try {
    const allEnrollments = await db.select({
      id: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      userName: users.name,
      userEmail: users.email,
      courseTitle: courses.title,
      courseCategory: courses.category,
    }).from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.enrolledAt));
    return res.json({ enrollments: allEnrollments });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminGetPayments = async (req, res) => {
  try {
    const allPayments = await db.select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      gateway: payments.gateway,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      userName: users.name,
      userEmail: users.email,
      courseTitle: courses.title,
    }).from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(courses, eq(payments.courseId, courses.id))
      .orderBy(desc(payments.createdAt));
    return res.json({ payments: allPayments });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
export const adminGetAnnouncements = async (req, res) => {
  try {
    const all = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    return res.json({ announcements: all });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateAnnouncement = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const [ann] = await db.insert(announcements).values({ title, body, createdBy: req.user.id }).returning();
    return res.status(201).json({ message: 'Announcement created!', announcement: ann });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── STUDY MATERIALS ───────────────────────────────────────────────────────────
// BUG-006: Added missing GET handler — was causing 404 on Admin Study Materials page
export const adminGetMaterials = async (req, res) => {
  try {
    const materials = await db.select().from(studyMaterials).orderBy(desc(studyMaterials.createdAt));
    return res.json({ materials });
  } catch (err) {
    console.error('Get materials error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminAddMaterial = async (req, res) => {
  try {
    const { courseId, chapterId, title, type, fileUrl } = req.body;
    if (!title || !fileUrl) return res.status(400).json({ error: 'Title and file URL are required.' });

    const [material] = await db.insert(studyMaterials).values({
      courseId: courseId ? parseInt(courseId) : null,
      chapterId: chapterId ? parseInt(chapterId) : null,
      title, type: type || 'pdf', fileUrl,
    }).returning();
    return res.status(201).json({ message: 'Material added!', material });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteMaterial = async (req, res) => {
  try {
    await db.delete(studyMaterials).where(eq(studyMaterials.id, parseInt(req.params.id)));
    return res.json({ message: 'Material deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};
