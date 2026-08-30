import { db } from '../db/index.js';
import { courses, chapters, courseSubjects, studyMaterials, enrollments, announcements } from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// NOTE on sql`` vs sql.raw():
//  • sql`...`  (tagged template) — drizzle binds ${value} as a safe query parameter.
//              Use this for any user-supplied or dynamic values.
//  • sql.raw() — injects a plain string directly into SQL. NO parameter binding.
//              Only safe for hard-coded SQL fragments (e.g., column expressions).
// All controllers below use sql`` for values and sql.raw() only for identifiers.
// ─────────────────────────────────────────────────────────────────────────────

export const getCourses = async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    // Build WHERE clauses as raw SQL fragments
    const clauses = [`c.is_published = true`];
    const params  = [];

    if (category && category !== 'All') {
      params.push(category);
      clauses.push(`c.category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      clauses.push(`c.title ILIKE $${params.length}`);
    }
    if (featured === 'true') {
      clauses.push(`c.is_featured = true`);
    }

    const where = clauses.join(' AND ');

    // Raw SQL with a correlated subquery — column names are identifiers, not params
    const { rows } = await db.execute(
      sql.raw(
        `SELECT c.*,
                (SELECT COUNT(*) FROM chapters ch WHERE ch.course_id = c.id)::int AS chapters_count
         FROM   courses c
         WHERE  ${where}`,
        params
      )
    );

    // Normalise snake_case → camelCase for the fields the frontend uses
    const normalised = rows.map(r => ({
      ...r,
      chaptersCount:  r.chapters_count  ?? r.chapterscount  ?? 0,
      durationHours:  r.duration_hours  ?? r.durationhours  ?? 0,
      isPublished:    r.is_published    ?? r.ispublished    ?? false,
      isFeatured:     r.is_featured     ?? r.isfeatured     ?? false,
      originalPrice:  r.original_price  ?? r.originalprice  ?? null,
      thumbnailUrl:   r.thumbnail_url   ?? r.thumbnailurl   ?? null,
      createdAt:      r.created_at      ?? r.createdat      ?? null,
      examType:       r.exam_type       ?? r.examtype       ?? null,
    }));

    return res.json({ courses: normalised });
  } catch (err) {
    console.error('Get courses error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid course ID.' });

    const [course] = await db.select().from(courses).where(
      and(eq(courses.id, courseId), eq(courses.isPublished, true))
    );
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    // ── Chapters with subject name ────────────────────────────────────────────
    // Uses sql`` tagged template so courseId is bound as a safe query parameter.
    // Selects both video_key (R2 private) and video_url (external/YouTube).
    // For free chapters: expose video_url directly; expose a boolean hasVideoKey
    //   so the frontend knows to call /api/courses/chapters/:id/video for a signed URL.
    // For paid chapters: both fields are nulled out (require enrollment + signed URL).
    const { rows: chapterRows } = await db.execute(sql`
      SELECT
        ch.id,
        ch.title,
        ch.description,
        ch.duration_min                                   AS "durationMin",
        ch.order_index                                    AS "orderIndex",
        ch.is_free                                        AS "isFree",
        ch.subject_id                                     AS "subjectId",
        COALESCE(cs.name, ch.subject)                    AS "subjectName",
        -- video_url: external/YouTube link — embed directly, no signing needed.
        --   Exposed for free chapters only.
        CASE WHEN ch.is_free = true THEN ch.video_url ELSE NULL END  AS "videoUrl",
        -- hasVideoKey: true if an R2 private video exists (needs signed URL).
        --   Frontend calls /api/courses/chapters/:id/video to get the signed URL.
        CASE WHEN ch.is_free = true AND ch.video_key IS NOT NULL THEN true ELSE false END AS "hasVideoKey"
      FROM   chapters ch
      LEFT JOIN course_subjects cs ON cs.id = ch.subject_id
      WHERE  ch.course_id = ${courseId}
      ORDER  BY ch.order_index
    `);

    const materials = await db.select().from(studyMaterials).where(eq(studyMaterials.courseId, courseId));

    return res.json({
      course: { ...course, chaptersCount: chapterRows.length },
      chapters: chapterRows,
      materials,
    });
  } catch (err) {
    console.error('Get course error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getCourseChapters = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid course ID.' });

    const userId = req.user?.id;

    let isEnrolled = false;
    if (userId) {
      const [enrollment] = await db.select().from(enrollments).where(
        and(eq(enrollments.studentId, userId), eq(enrollments.courseId, courseId))
      );
      isEnrolled = !!enrollment;
    }

    // ── Chapters with subject name (JOIN course_subjects) ─────────────────────
    // subjectName is required by the enrolled player view (EnrolledView) to group
    // chapters by subject in the sidebar. Without this JOIN, subjectName is always
    // undefined and all chapters fall into the "General" group.
    const { rows } = await db.execute(sql`
      SELECT
        ch.id,
        ch.title,
        ch.description,
        ch.duration_min   AS "durationMin",
        ch.order_index    AS "orderIndex",
        ch.is_free        AS "isFree",
        ch.subject_id     AS "subjectId",
        ch.video_key      AS "videoKey",
        ch.video_url      AS "videoUrl",
        COALESCE(cs.name, ch.subject) AS "subjectName"
      FROM   chapters ch
      LEFT JOIN course_subjects cs ON cs.id = ch.subject_id
      WHERE  ch.course_id = ${courseId}
      ORDER  BY ch.order_index
    `);

    // For enrolled students: expose a flag so frontend knows to fetch signed URL.
    // Video key is never sent raw — frontend must call /api/courses/chapters/:id/video.
    const result = rows.map(ch => ({
      ...ch,
      // hasVideoKey: enrolled student knows an R2 video exists → fetch signed URL
      hasVideoKey: isEnrolled && !!ch.videoKey,
      // videoKey is intentionally stripped from response (private R2 key)
      videoKey: undefined,
      // videoUrl: external/YouTube URL — expose if enrolled OR if chapter is free
      videoUrl: isEnrolled || ch.isFree ? ch.videoUrl : null,
      locked: !isEnrolled && !ch.isFree,
    }));

    return res.json({ chapters: result, isEnrolled });
  } catch (err) {
    console.error('Get chapters error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── PUBLIC ANNOUNCEMENTS ────────────────────────────────────────────────────────
// No auth required — visible to all visitors.
export const getPublicAnnouncements = async (req, res) => {
  try {
    const list = await db
      .select({ id: announcements.id, title: announcements.title, body: announcements.body, createdAt: announcements.createdAt })
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(10);
    return res.json({ announcements: list });
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
