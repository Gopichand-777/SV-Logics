import { getPresignedGetUrl } from '../services/r2.service.js';
import { db } from '../db/index.js';
import { studyMaterials, enrollments, chapters } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Signed URL expiry by content type
const EXPIRY = {
  video: 6 * 60 * 60,  // 6 hours — covers 2-hour lecture + pausing/rewinding buffer
  pdf:   1 * 60 * 60,  // 1 hour  — enough for reading a PDF
};

// ── GET /api/materials/:id/stream ─────────────────────────────────────────────
// Called by the frontend when a student wants to access a study material.
// Checks auth (via requireAuth middleware) + enrollment, then returns a
// time-limited signed GET URL. The file is streamed directly from R2 to the
// student's browser — no server bandwidth used.
export const getMaterialStreamUrl = async (req, res) => {
  const studentId  = req.user.id;
  const materialId = parseInt(req.params.id);

  // 1. Fetch material
  const [material] = await db
    .select()
    .from(studyMaterials)
    .where(eq(studyMaterials.id, materialId));

  if (!material) return res.status(404).json({ error: 'Material not found.' });

  // 2. Check enrollment (if material is attached to a course)
  if (material.courseId) {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, material.courseId),
      ));

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course. Please enroll to access this material.' });
    }
  }

  // 3. Check if fileKey is an R2 key or an external URL
  const isR2Key = material.fileKey && !material.fileKey.startsWith('http');
  if (!isR2Key) {
    // External URL — return directly (no signing needed)
    return res.json({ url: material.fileKey, type: material.type, expiresIn: null, title: material.title });
  }

  // 4. Generate signed GET URL
  const expiry = material.type === 'video' ? EXPIRY.video : EXPIRY.pdf;
  try {
    const url = await getPresignedGetUrl(material.fileKey, expiry);
    return res.json({
      url,
      type:      material.type,
      expiresIn: expiry,
      title:     material.title,
    });
  } catch (err) {
    console.error('Stream URL error:', err);
    return res.status(500).json({ error: 'Could not generate access URL. Try again.' });
  }
};

// ── GET /api/courses/chapters/:id/video ──────────────────────────────────────
// Called by the frontend when a student opens a chapter with a video.
// Priority: video_url (external/YouTube, no signing) > video_key (R2, needs signing).
// Free chapters skip the enrollment check.
export const getChapterVideoUrl = async (req, res) => {
  const studentId = req.user.id;
  const chapterId = parseInt(req.params.id, 10);
  if (isNaN(chapterId)) return res.status(400).json({ error: 'Invalid chapter ID.' });

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(eq(chapters.id, chapterId));

  if (!chapter) return res.status(404).json({ error: 'Chapter not found.' });
  if (!chapter.videoUrl && !chapter.videoKey) {
    return res.status(404).json({ error: 'This chapter has no video.' });
  }

  // Paid chapters require enrollment
  if (!chapter.isFree) {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, chapter.courseId),
      ));
    if (!enrollment) {
      return res.status(403).json({ error: 'Enroll in this course to watch this video.' });
    }
  }

  // ── video_url: external / YouTube link — return directly, no signing needed ─
  if (chapter.videoUrl) {
    return res.json({
      url:       chapter.videoUrl,
      expiresIn: null,
      title:     chapter.title,
      isFree:    chapter.isFree,
      source:    'external',
    });
  }

  // ── video_key: R2 private file — generate a presigned GET URL ───────────────
  try {
    const url = await getPresignedGetUrl(chapter.videoKey, EXPIRY.video);
    return res.json({
      url,
      expiresIn: EXPIRY.video,
      title:     chapter.title,
      isFree:    chapter.isFree,
      source:    'r2',
    });
  } catch (err) {
    console.error('Chapter video URL error:', err);
    return res.status(500).json({ error: 'Could not generate video URL. Try again.' });
  }
};

