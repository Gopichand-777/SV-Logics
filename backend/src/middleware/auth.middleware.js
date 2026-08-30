import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { students, admins, contentManagers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const requireAuth = async (req, res, next) => {
  try {
    // ── Step 1: Verify JWT signature & expiry ─────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Step 2: Verify sessionToken against DB ────────────────────────────────
    // This enforces single-session: if the user logged in from another device,
    // the DB sessionToken changed → mismatch → kick this device out.
    const { id, tableSource, role, sessionToken } = decoded;

    const table = tableSource === 'student'
      ? students
      : role === 'super_admin' ? admins : contentManagers;

    const [account] = await db
      .select({ sessionToken: table.sessionToken, isActive: table.isActive })
      .from(table)
      .where(eq(table.id, id));

    if (!account) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }
    if (!account.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }
    if (account.sessionToken !== sessionToken) {
      // Another device logged in — this session is now invalid
      return res.status(401).json({
        error:   'SESSION_INVALIDATED',
        message: 'Your account was logged in from another device. Please log in again.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
};

// Ensures only student JWTs can access student-only routes
export const requireStudentAuth = (req, res, next) => {
  if (!req.user || req.user.tableSource !== 'student') {
    return res.status(403).json({ error: 'Student access only.' });
  }
  next();
};
