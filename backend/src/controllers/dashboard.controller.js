import { db } from '../db/index.js';
import { enrollments, testAttempts, courses, mockTests, userStreaks } from '../db/schema.js';
import { eq, desc, avg, count, sql } from 'drizzle-orm';

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Enrolled courses count
    const [{ enrolledCount }] = await db.select({ enrolledCount: count() })
      .from(enrollments).where(eq(enrollments.userId, userId));

    // Tests attempted count
    const [{ testsCount }] = await db.select({ testsCount: count() })
      .from(testAttempts).where(eq(testAttempts.userId, userId));

    // Average score
    const [{ avgScore }] = await db.select({ avgScore: avg(testAttempts.score) })
      .from(testAttempts).where(eq(testAttempts.userId, userId));

    // Streak
    const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));

    // Recent attempts (last 5)
    const recentAttempts = await db.select({
      id: testAttempts.id,
      score: testAttempts.score,
      totalMarks: testAttempts.totalMarks,
      correctCount: testAttempts.correctCount,
      wrongCount: testAttempts.wrongCount,
      attemptedAt: testAttempts.attemptedAt,
      testTitle: mockTests.title,
      testCategory: mockTests.category,
    }).from(testAttempts)
      .leftJoin(mockTests, eq(testAttempts.testId, mockTests.id))
      .where(eq(testAttempts.userId, userId))
      .orderBy(desc(testAttempts.attemptedAt))
      .limit(5);

    // Enrolled courses details
    const enrolledCourses = await db.select({
      id: courses.id,
      courseTitle: courses.title,       // Dashboard.jsx reads c.courseTitle
      courseCategory: courses.category, // Dashboard.jsx reads c.courseCategory
      thumbnailUrl: courses.thumbnailUrl,
      durationHours: courses.durationHours,
      chaptersCount: courses.chaptersCount,
      enrolledAt: enrollments.enrolledAt,
    }).from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return res.json({
      stats: {
        enrolledCourses: Number(enrolledCount),
        testsAttempted: Number(testsCount),
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        avgScore: avgScore ? Math.round(Number(avgScore)) : 0,
      },
      recentAttempts,
      enrolledCourses,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
