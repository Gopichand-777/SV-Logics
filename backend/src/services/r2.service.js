import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 is S3-compatible. The endpoint is unique per account.
// Bucket is ALWAYS private — no public access enabled.
const r2 = new S3Client({
  region: 'auto', // R2 does not use AWS regions — 'auto' is correct
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = () => process.env.R2_BUCKET_NAME;

// ── ADMIN UPLOAD ──────────────────────────────────────────────────────────────
// Returns a presigned PUT URL valid for 60 minutes.
// The admin browser uploads the file DIRECTLY to R2 — it never touches Render.
// expiresIn: 3600s (60 min) — enough for slow connections uploading 2–4 GB videos.
export const getPresignedPutUrl = (key, contentType, expiresIn = 3600) =>
  getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET(), Key: key, ContentType: contentType }),
    { expiresIn }
  );

// ── STUDENT ACCESS ────────────────────────────────────────────────────────────
// Returns a presigned GET URL.
// ONLY called by the backend AFTER verifying auth + enrollment.
// Default expiry:
//   - Video: 6 hours  (21600s) — covers a full 2-hour lecture with pausing/rewinding
//   - PDF:   1 hour   (3600s)
export const getPresignedGetUrl = (key, expiresIn = 21600) =>
  getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET(), Key: key }),
    { expiresIn }
  );

// ── DELETE FILE ───────────────────────────────────────────────────────────────
// Called when admin removes a material or chapter — cleans up R2.
export const deleteR2File = (key) =>
  r2.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
