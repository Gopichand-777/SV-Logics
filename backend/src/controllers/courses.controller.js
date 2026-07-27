import { db } from '../db/index.js';
import { courses, chapters, studyMaterials, enrollments } from '../db/schema.js';
import { eq, like, and, sql } from 'drizzle-orm';

export const getCourses = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let conditions = [eq(courses.isPublished, true)];

    if (category && category !== 'All') {
      conditions.push(eq(courses.category, category));
    }
    if (search) {
      conditions.push(like(courses.title, `%${search}%`));
    }
    if (featured === 'true') {
      conditions.push(eq(courses.isFeatured, true));
    }

    const result = await db.select().from(courses).where(and(...conditions));
    return res.json({ courses: result });
  } catch (err) {
    console.error('Get courses error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [course] = await db.select().from(courses).where(
      and(eq(courses.id, parseInt(id)), eq(courses.isPublished, true))
    );
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const courseChapters = await db.select({
      id: chapters.id,
      title: chapters.title,
      description: chapters.description,
      durationMin: chapters.durationMin,
      orderIndex: chapters.orderIndex,
      isFree: chapters.isFree,
      // Only include video URL for free chapters — must use SQL CASE, not JS ternary
      // (chapters.isFree is a Drizzle column ref object, always truthy in JS)
      videoUrl: sql`CASE WHEN ${chapters.isFree} = true THEN ${chapters.videoUrl} ELSE NULL END`,
    }).from(chapters).where(eq(chapters.courseId, parseInt(id)));

    const materials = await db.select().from(studyMaterials).where(eq(studyMaterials.courseId, parseInt(id)));

    return res.json({ course, chapters: courseChapters, materials });
  } catch (err) {
    console.error('Get course error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getCourseChapters = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check enrollment
    let isEnrolled = false;
    if (userId) {
      const [enrollment] = await db.select().from(enrollments).where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, parseInt(id)))
      );
      isEnrolled = !!enrollment;
    }

    const courseChapters = await db.select().from(chapters)
      .where(eq(chapters.courseId, parseInt(id)))
      .orderBy(chapters.orderIndex);

    // If not enrolled, hide video URLs for paid chapters
    const result = courseChapters.map(ch => ({
      ...ch,
      videoUrl: isEnrolled || ch.isFree ? ch.videoUrl : null,
      locked: !isEnrolled && !ch.isFree,
    }));

    return res.json({ chapters: result, isEnrolled });
  } catch (err) {
    console.error('Get chapters error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
