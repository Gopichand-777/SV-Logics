import { db } from '../db/index.js';
import {
  students, admins, contentManagers,
  courses, chapters, mockTests, questions, courseSubjects,
  enrollments, payments, testAttempts, attemptAnswers,
  userStreaks, studyMaterials, announcements
} from '../db/schema.js';
import { eq, desc, count, sum, and, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
export const getOverview = async (req, res) => {
  try {
    const [{ totalStudents }] = await db.select({ totalStudents: count() }).from(students);
    const [{ totalCourses }] = await db.select({ totalCourses: count() }).from(courses);
    const [{ totalEnrollments }] = await db.select({ totalEnrollments: count() }).from(enrollments);
    const [{ totalTests }] = await db.select({ totalTests: count() }).from(testAttempts);
    const [{ totalRevenue }] = await db.select({ totalRevenue: sum(payments.amount) })
      .from(payments).where(sql`${payments.status} IN ('success', 'admin_grant')`);

    return res.json({
      stats: {
        totalUsers: Number(totalStudents),
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

// ── STUDENTS (created by admin) ───────────────────────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let all = await db.select({
      id: students.id, name: students.name, username: students.username,
      phone: students.phone, isActive: students.isActive, createdAt: students.createdAt,
    }).from(students).orderBy(desc(students.createdAt));

    if (search) all = all.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
    );
    return res.json({ users: all, total: all.length });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required.' });
    }
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const usernameLower = username.toLowerCase().trim();
    const [existing] = await db.select({ id: students.id }).from(students)
      .where(eq(students.username, usernameLower));
    if (existing) return res.status(409).json({ error: 'Username already taken. Please choose another.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [newStudent] = await db.insert(students).values({
      name: name.trim(),
      username: usernameLower,
      passwordHash,
    }).returning({ id: students.id, name: students.name, username: students.username, createdAt: students.createdAt });

    return res.status(201).json({ message: 'Student created successfully!', student: newStudent });
  } catch (err) {
    console.error('Create student error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const [updated] = await db.update(students).set({ isActive, updatedAt: new Date() })
      .where(eq(students.id, parseInt(id))).returning({ id: students.id, isActive: students.isActive });
    return res.json({ message: `Student ${isActive ? 'activated' : 'deactivated'}.`, student: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    // Must delete in dependency order (child → parent) to satisfy FK constraints:
    // 1. attempt_answers references test_attempts
    // 2. test_attempts references students
    // 3. enrollments references payments AND students
    // 4. payments references students
    // 5. user_streaks references students

    // Get all test attempt IDs for this student first
    const attempts = await db.select({ id: testAttempts.id })
      .from(testAttempts).where(eq(testAttempts.studentId, studentId));
    const attemptIds = attempts.map(a => a.id);

    // 1. Delete attempt answers for each test attempt
    if (attemptIds.length > 0) {
      for (const attemptId of attemptIds) {
        await db.delete(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
      }
    }

    // 2. Delete test attempts
    await db.delete(testAttempts).where(eq(testAttempts.studentId, studentId));

    // 3. Delete enrollments (references payments.id — so delete before payments)
    await db.delete(enrollments).where(eq(enrollments.studentId, studentId));

    // 4. Delete payments
    await db.delete(payments).where(eq(payments.studentId, studentId));

    // 5. Delete user streaks
    await db.delete(userStreaks).where(eq(userStreaks.studentId, studentId));

    // 6. Finally delete the student
    const [deleted] = await db.delete(students)
      .where(eq(students.id, studentId))
      .returning({ id: students.id });

    if (!deleted) return res.status(404).json({ error: 'Student not found.' });

    return res.json({ message: 'Student and all associated data deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err.message);
    return res.status(500).json({ error: 'Could not delete student: ' + err.message });
  }
};

// ── ADMIN STAFF (admins + content_managers) ──────────────────────────────────
export const getAdminStaff = async (req, res) => {
  try {
    const adminList = await db.select({
      id: admins.id, name: admins.name, email: admins.email,
      isActive: admins.isActive, createdAt: admins.createdAt,
    }).from(admins).orderBy(desc(admins.createdAt));

    const cmList = await db.select({
      id: contentManagers.id, name: contentManagers.name, email: contentManagers.email,
      isActive: contentManagers.isActive, createdAt: contentManagers.createdAt,
    }).from(contentManagers).orderBy(desc(contentManagers.createdAt));

    const staff = [
      ...adminList.map(a => ({ ...a, role: 'super_admin' })),
      ...cmList.map(c => ({ ...c, role: 'content_manager' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ staff, total: staff.length });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const createAdminStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    // SECURITY: Super admin accounts can only be created directly in the database.
    // This prevents privilege escalation via the API.
    if (role === 'super_admin') {
      return res.status(403).json({
        error: 'Super admin accounts cannot be created via the admin panel',
      });
    }

    if (role !== 'content_manager') {
      return res.status(400).json({ error: 'Invalid role. Only content_manager accounts can be created here.' });
    }

    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const emailLower = email.toLowerCase().trim();
    // Check uniqueness across both tables
    const [existAdmin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, emailLower));
    const [existCM] = await db.select({ id: contentManagers.id }).from(contentManagers).where(eq(contentManagers.email, emailLower));
    if (existAdmin || existCM) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [newStaff] = await db.insert(contentManagers).values({
      name: name.trim(), email: emailLower, passwordHash,
    }).returning({ id: contentManagers.id, name: contentManagers.name, email: contentManagers.email, createdAt: contentManagers.createdAt });

    return res.status(201).json({ message: 'Content manager account created!', staff: { ...newStaff, role: 'content_manager' } });
  } catch (err) {
    console.error('Create staff error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};


export const updateAdminStaffStatus = async (req, res) => {
  try {
    const { id, role } = req.params;
    const { isActive } = req.body;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself.' });
    const table = role === 'super_admin' ? admins : contentManagers;
    await db.update(table).set({ isActive, updatedAt: new Date() }).where(eq(table.id, parseInt(id)));
    return res.json({ message: `Staff ${isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const deleteAdminStaff = async (req, res) => {
  try {
    const { id, role } = req.params;
    const staffId = parseInt(id);

    if (staffId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself.' });
    }

    if (role === 'super_admin') {
      // announcements.created_by has a FK → admins.id with no ON DELETE clause,
      // so PostgreSQL will RESTRICT the delete if this admin authored any announcements.
      // Null it out first so the delete can proceed cleanly.
      await db.update(announcements)
        .set({ createdBy: null })
        .where(eq(announcements.createdBy, staffId));
    }

    const table = role === 'super_admin' ? admins : contentManagers;
    await db.delete(table).where(eq(table.id, staffId));

    return res.json({ message: 'Staff account deleted.' });
  } catch (err) {
    console.error('Delete staff error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};


// ── COURSE ACCESS MANAGEMENT (grant / revoke without payment) ─────────────────

export const adminGetStudentCourses = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // Get all published courses
    const allCourses = await db.select({
      id: courses.id,
      title: courses.title,
      category: courses.category,
      thumbnailUrl: courses.thumbnailUrl,
      price: courses.price,
    }).from(courses).where(eq(courses.isPublished, true));

    // Get the student's current enrollments
    const enrolled = await db.select({ courseId: enrollments.courseId })
      .from(enrollments).where(eq(enrollments.studentId, studentId));
    const enrolledIds = new Set(enrolled.map(e => e.courseId));

    const result = allCourses.map(c => ({
      ...c,
      isEnrolled: enrolledIds.has(c.id),
    }));

    return res.json({ courses: result });
  } catch (err) {
    console.error('Get student courses error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminGrantCourseAccess = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);

    // Verify student exists
    const [student] = await db.select({ id: students.id, name: students.name })
      .from(students).where(eq(students.id, studentId));
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    // Verify course exists + get price
    const [course] = await db.select({ id: courses.id, title: courses.title, price: courses.price })
      .from(courses).where(eq(courses.id, courseId));
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    // Check if already enrolled — avoid duplicate payment
    const [existing] = await db.select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));
    if (existing) {
      return res.status(409).json({ error: 'Student is already enrolled in this course.' });
    }

    // Create a payment record for tracking purposes
    // status = 'admin_grant' | gateway = 'admin' | amount = course price
    const [payment] = await db.insert(payments).values({
      studentId,
      courseId,
      amount: course.price,      // full course price in paise
      currency: 'INR',
      status: 'admin_grant',     // distinct status so reports can filter
      gateway: 'admin',           // granted by admin, not a payment gateway
      paymentMethod: 'admin_grant',
      paidAt: new Date(),        // treat as immediately paid
    }).returning();

    // Create enrollment linked to the payment
    await db.insert(enrollments).values({
      studentId,
      courseId,
      paymentId: payment.id,
    });

    return res.status(201).json({
      message: `Access granted: ${student.name} enrolled in ${course.title}`,
      payment: {
        id: payment.id,
        amount: course.price,
        status: 'admin_grant',
      },
    });
  } catch (err) {
    console.error('Grant access error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminRevokeCourseAccess = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);

    // Find the enrollment first so we can clean up the linked payment
    const [enrollment] = await db.select({ id: enrollments.id, paymentId: enrollments.paymentId })
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Delete enrollment
    await db.delete(enrollments).where(eq(enrollments.id, enrollment.id));

    // If this enrollment was created by an admin grant, delete the payment record too
    if (enrollment.paymentId) {
      const [pmt] = await db.select({ id: payments.id, status: payments.status })
        .from(payments).where(eq(payments.id, enrollment.paymentId));
      if (pmt && pmt.status === 'admin_grant') {
        await db.delete(payments).where(eq(payments.id, pmt.id));
      }
    }

    return res.json({ message: 'Course access revoked.' });
  } catch (err) {
    console.error('Revoke access error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── COURSES ───────────────────────────────────────────────────────────────────
export const adminGetCourses = async (req, res) => {

  try {
    // IMPORTANT: Drizzle param-binding inside sql`` sends column refs as NULL.
    // Use raw SQL so `c.id` is a literal identifier, not a bound parameter.
    const { rows } = await db.execute(
      sql.raw(`SELECT c.*,
                      (SELECT COUNT(*) FROM chapters ch WHERE ch.course_id = c.id)::int AS chapters_count
               FROM   courses c
               ORDER  BY c.created_at DESC`)
    );

    const normalised = rows.map(r => ({
      ...r,
      chaptersCount: r.chapters_count ?? r.chapterscount ?? 0,
      durationHours: r.duration_hours ?? r.durationhours ?? 0,
      isPublished: r.is_published ?? r.ispublished ?? false,
      isFeatured: r.is_featured ?? r.isfeatured ?? false,
      originalPrice: r.original_price ?? r.originalprice ?? null,
      thumbnailUrl: r.thumbnail_url ?? r.thumbnailurl ?? null,
      createdAt: r.created_at ?? r.createdat ?? null,
      examType: r.exam_type ?? r.examtype ?? null,
    }));

    return res.json({ courses: normalised });
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

// ── COURSE SUBJECTS ──────────────────────────────────────────────────────────────────
export const adminGetSubjects = async (req, res) => {
  try {
    const subjects = await db.select().from(courseSubjects)
      .where(eq(courseSubjects.courseId, parseInt(req.params.courseId)))
      .orderBy(courseSubjects.orderIndex);
    return res.json({ subjects });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateSubject = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, orderIndex } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Subject name is required.' });

    // Auto-assign orderIndex if not provided
    let order = parseInt(orderIndex);
    if (!order) {
      const existing = await db.select().from(courseSubjects)
        .where(eq(courseSubjects.courseId, parseInt(courseId)));
      order = existing.length + 1;
    }

    const [subject] = await db.insert(courseSubjects).values({
      courseId: parseInt(courseId),
      name: name.trim(),
      orderIndex: order,
    }).returning();
    return res.status(201).json({ message: 'Subject created!', subject });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, orderIndex } = req.body;
    const updates = {
      ...(name?.trim() && { name: name.trim() }),
      ...(orderIndex && { orderIndex: parseInt(orderIndex) }),
    };
    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'Nothing to update.' });

    const [subject] = await db.update(courseSubjects).set(updates)
      .where(eq(courseSubjects.id, parseInt(id))).returning();
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });
    // Renaming this one row instantly reflects everywhere chapters/tests are joined
    return res.json({ message: 'Subject updated!', subject });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminDeleteSubject = async (req, res) => {
  try {
    // FK ON DELETE SET NULL means chapters/tests referencing this subject_id
    // will have subject_id = NULL and fall under 'General' on the website.
    await db.delete(courseSubjects).where(eq(courseSubjects.id, parseInt(req.params.id)));
    return res.json({ message: 'Subject deleted. Chapters moved to General.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── CHAPTERS ──────────────────────────────────────────────────────────────────
export const adminGetChapters = async (req, res) => {

  try {
    const { rows } = await db.execute(sql.raw(`
      SELECT ch.*,
             cs.name        AS subject_name,
             cs.order_index AS subject_order
      FROM   chapters ch
      LEFT JOIN course_subjects cs ON cs.id = ch.subject_id
      WHERE  ch.course_id = ${parseInt(req.params.courseId)}
      ORDER  BY ch.order_index
    `));
    const chapterList = rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      subjectId: r.subject_id ?? null,
      subjectName: r.subject_name ?? r.subject ?? null,
      description: r.description,
      videoKey: r.video_key ?? null,   // R2 key for private video (e.g. "videos/uuid.mp4")
      videoUrl: r.video_url ?? null,   // External URL (YouTube embed, etc.)
      durationMin: r.duration_min,
      orderIndex: r.order_index,
      isFree: r.is_free,
      createdAt: r.created_at,
    }));
    return res.json({ chapters: chapterList });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    // videoKey: private R2 key (e.g. "videos/uuid.mp4") — uploaded directly from browser to R2
    // videoUrl: external URL (YouTube embed, Google Drive, etc.)
    const { title, description, videoKey, videoUrl, durationMin, orderIndex, isFree, subjectId } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    let subjectName = null;
    if (subjectId) {
      const [cs] = await db.select().from(courseSubjects).where(eq(courseSubjects.id, parseInt(subjectId)));
      subjectName = cs?.name || null;
    }

    const [chapter] = await db.insert(chapters).values({
      courseId: parseInt(courseId), title,
      subjectId: subjectId ? parseInt(subjectId) : null,
      subject: subjectName,
      description,
      videoKey: videoKey || null,
      videoUrl: videoUrl || null,
      durationMin: parseInt(durationMin) || 0,
      orderIndex: parseInt(orderIndex) || 1,
      isFree: isFree || false,
    }).returning();

    await db.execute(sql`UPDATE courses SET chapters_count = (SELECT COUNT(*) FROM chapters WHERE course_id = ${parseInt(courseId)}) WHERE id = ${parseInt(courseId)}`);
    return res.status(201).json({ message: 'Chapter created!', chapter });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    // videoKey: private R2 key — set when admin uploads to R2; null clears it
    // videoUrl: external URL — set when admin uses YouTube/Drive link
    const { title, description, videoKey, videoUrl, durationMin, orderIndex, isFree, subjectId } = req.body;

    let subjectName = undefined;
    if (subjectId !== undefined) {
      if (subjectId) {
        const [cs] = await db.select().from(courseSubjects).where(eq(courseSubjects.id, parseInt(subjectId)));
        subjectName = cs?.name || null;
      } else {
        subjectName = null;
      }
    }

    const updates = {
      ...(title !== undefined && { title }),
      ...(subjectId !== undefined && { subjectId: subjectId ? parseInt(subjectId) : null }),
      ...(subjectName !== undefined && { subject: subjectName }),
      ...(description !== undefined && { description }),
      ...(videoKey !== undefined && { videoKey: videoKey || null }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
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
    const { rows } = await db.execute(sql.raw(`
      SELECT mt.*, cs.name AS subject_name
      FROM   mock_tests mt
      LEFT JOIN course_subjects cs ON cs.id = mt.subject_id
      ORDER  BY mt.created_at DESC
    `));
    const tests = rows.map(r => ({
      ...r,
      subjectId: r.subject_id,
      subjectName: r.subject_name ?? r.subject ?? null,
      totalQuestions: r.total_questions,
      durationMinutes: r.duration_minutes,
      isPublished: r.is_published,
      courseId: r.course_id,
      createdAt: r.created_at,
      defaultMarks: r.default_marks ?? 2,
      defaultNegativeMarks: r.default_negative_marks ?? 0.5,
    }));
    return res.json({ tests });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminCreateTest = async (req, res) => {
  try {
    const { title, description, courseId, category, subjectId, durationMinutes, difficulty,
      isPublished, defaultMarks, defaultNegativeMarks } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    let subjectName = null;
    if (subjectId) {
      const [cs] = await db.select().from(courseSubjects).where(eq(courseSubjects.id, parseInt(subjectId)));
      subjectName = cs?.name || null;
    }

    const [test] = await db.insert(mockTests).values({
      title, description,
      courseId: courseId ? parseInt(courseId) : null,
      category,
      subjectId: subjectId ? parseInt(subjectId) : null,
      subject: subjectName,
      durationMinutes: parseInt(durationMinutes) || 60,
      difficulty: difficulty || 'medium',
      isPublished: isPublished || false,
      defaultMarks: parseInt(defaultMarks) || 2,
      defaultNegativeMarks: String(parseFloat(defaultNegativeMarks) || 0.5),
    }).returning();
    return res.status(201).json({ message: 'Test created!', test });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const adminUpdateTest = async (req, res) => {
  try {
    const { title, description, courseId, category, subjectId, durationMinutes, difficulty,
      isPublished, defaultMarks, defaultNegativeMarks } = req.body;

    let subjectName = undefined;
    if (subjectId !== undefined) {
      if (subjectId) {
        const [cs] = await db.select().from(courseSubjects).where(eq(courseSubjects.id, parseInt(subjectId)));
        subjectName = cs?.name || null;
      } else {
        subjectName = null;
      }
    }

    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(courseId !== undefined && { courseId: courseId ? parseInt(courseId) : null }),
      ...(category !== undefined && { category }),
      ...(subjectId !== undefined && { subjectId: subjectId ? parseInt(subjectId) : null }),
      ...(subjectName !== undefined && { subject: subjectName }),
      ...(durationMinutes !== undefined && { durationMinutes: parseInt(durationMinutes) }),
      ...(difficulty !== undefined && { difficulty }),
      ...(isPublished !== undefined && { isPublished }),
      ...(defaultMarks !== undefined && { defaultMarks: parseInt(defaultMarks) }),
      ...(defaultNegativeMarks !== undefined && { defaultNegativeMarks: String(parseFloat(defaultNegativeMarks)) }),
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
      studentName: students.name,
      studentUsername: students.username,
      courseTitle: courses.title,
      courseCategory: courses.category,
    }).from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
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
      studentName: students.name,
      studentUsername: students.username,
      courseTitle: courses.title,
    }).from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
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
