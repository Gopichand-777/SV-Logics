import { getPresignedPutUrl } from '../services/r2.service.js';
import { randomUUID } from 'crypto';
import path from 'path';

// Allowed file types and their max sizes
const ALLOWED_TYPES = {
  'application/pdf': { folder: 'pdfs',   ext: '.pdf',  maxBytes: 50   * 1024 * 1024 },  // 50 MB
  'video/mp4':       { folder: 'videos', ext: '.mp4',  maxBytes: 4096 * 1024 * 1024 },  // 4 GB
  'video/webm':      { folder: 'videos', ext: '.webm', maxBytes: 4096 * 1024 * 1024 },  // 4 GB
  'video/quicktime': { folder: 'videos', ext: '.mov',  maxBytes: 4096 * 1024 * 1024 },  // 4 GB
};

// POST /api/admin/upload/presign
// Called by admin before uploading a file.
// Returns a presigned PUT URL (60 min) + the R2 key to store in DB.
// The browser then uploads the file DIRECTLY to R2 using the PUT URL.
// The file never touches Render — zero bandwidth cost on the server.
export const generatePresignedPutUrl = async (req, res) => {
  const { filename, contentType, fileSize } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename and contentType are required' });
  }

  const typeConfig = ALLOWED_TYPES[contentType];
  if (!typeConfig) {
    return res.status(400).json({
      error: 'Unsupported file type. Allowed: PDF, MP4 video, WebM video, MOV video.',
    });
  }

  if (fileSize && fileSize > typeConfig.maxBytes) {
    const maxMB = typeConfig.maxBytes / 1024 / 1024;
    return res.status(400).json({ error: `File too large. Maximum size: ${maxMB}MB` });
  }

  // Build a unique key: e.g. "videos/550e8400-e29b-41d4-a716-446655440000.mp4"
  const ext = path.extname(filename) || typeConfig.ext;
  const key = `${typeConfig.folder}/${randomUUID()}${ext}`;

  try {
    // 60-minute window — enough for uploading a 4GB file on slow connections
    const uploadUrl = await getPresignedPutUrl(key, contentType, 60 * 60);
    return res.json({ uploadUrl, key });
  } catch (err) {
    console.error('Presign error:', err);
    return res.status(500).json({ error: 'Failed to generate upload URL. Try again.' });
  }
};
