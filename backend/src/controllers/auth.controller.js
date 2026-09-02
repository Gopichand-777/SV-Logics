import { db } from '../db/index.js';
import { students, admins, contentManagers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { updateStreak } from '../utils/streak.util.js';

// sessionToken is embedded in JWT and also stored in DB.
// On each request, middleware checks they match — if they differ,
// another device has logged in and this session is kicked out.
const signStudentToken = (s, sessionToken) => jwt.sign(
  { id: s.id, name: s.name, username: s.username, tableSource: 'student', sessionToken },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const signAdminToken = (a, role, sessionToken) => jwt.sign(
  { id: a.id, name: a.name, email: a.email, role, tableSource: 'admin', sessionToken },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const studentLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req, res) => {
  try {
    const parsed = studentLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const { username, password } = parsed.data;
    const [student] = await db.select().from(students).where(eq(students.username, username.toLowerCase().trim()));
    if (!student) return res.status(401).json({ error: 'Invalid username or password.' });
    if (!student.isActive) return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    const isValid = await bcrypt.compare(password, student.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid username or password.' });

    // Generate new sessionToken — invalidates any existing session on another device
    const sessionToken = randomUUID();
    await db.update(students)
      .set({ sessionToken, updatedAt: new Date() })
      .where(eq(students.id, student.id));

    const token = signStudentToken(student, sessionToken);

    // Update day streak — fire-and-forget, non-blocking
    updateStreak(student.id).catch(() => {});

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: student.id, name: student.name, username: student.username, tableSource: 'student' },
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const { email, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();
    let [account] = await db.select().from(admins).where(eq(admins.email, emailLower));
    let role = 'super_admin';
    if (!account) { [account] = await db.select().from(contentManagers).where(eq(contentManagers.email, emailLower)); role = 'content_manager'; }
    if (!account) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!account.isActive) return res.status(403).json({ error: 'Your account has been deactivated. Contact the super admin.' });
    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

    // Generate new sessionToken — invalidates any existing admin session
    const sessionToken = randomUUID();
    const table = role === 'super_admin' ? admins : contentManagers;
    await db.update(table)
      .set({ sessionToken, updatedAt: new Date() })
      .where(eq(table.id, account.id));

    const token = signAdminToken(account, role, sessionToken);
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: account.id, name: account.name, email: account.email, role, tableSource: 'admin' },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
// Clears sessionToken in DB — the current JWT is immediately dead.
// Any request from any device using this JWT will get 401 after this.
export const logout = async (req, res) => {
  try {
    const { id, tableSource, role } = req.user;
    const table = tableSource === 'student'
      ? students
      : role === 'super_admin' ? admins : contentManagers;
    await db.update(table)
      .set({ sessionToken: null, updatedAt: new Date() })
      .where(eq(table.id, id));
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id, tableSource, role } = req.user;
    if (tableSource === 'student') {
      const [s] = await db.select({ id: students.id, name: students.name, username: students.username, phone: students.phone, isActive: students.isActive, createdAt: students.createdAt }).from(students).where(eq(students.id, id));
      if (!s) return res.status(404).json({ error: 'Student not found.' });

      // Update day streak on every app-load (idempotent — skips if already counted today)
      updateStreak(id).catch(() => {});

      return res.json({ user: { ...s, tableSource: 'student' } });
    }
    const table = role === 'super_admin' ? admins : contentManagers;
    const [a] = await db.select({ id: table.id, name: table.name, email: table.email, isActive: table.isActive, createdAt: table.createdAt }).from(table).where(eq(table.id, id));
    if (!a) return res.status(404).json({ error: 'Admin account not found.' });
    return res.json({ user: { ...a, role, tableSource: 'admin' } });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { id, tableSource, role } = req.user;
    const { name, phone } = req.body;
    if (tableSource === 'student') {
      if (name !== undefined && name.trim() === '') return res.status(400).json({ error: 'Name cannot be empty.' });
      const [updated] = await db.update(students).set({ name: name?.trim() || undefined, phone: phone?.trim() || undefined, updatedAt: new Date() }).where(eq(students.id, id)).returning({ id: students.id, name: students.name, username: students.username, phone: students.phone });
      return res.json({ message: 'Profile updated!', user: updated });
    }
    if (name !== undefined && name.trim() === '') return res.status(400).json({ error: 'Name cannot be empty.' });
    const table = role === 'super_admin' ? admins : contentManagers;
    const [updated] = await db.update(table).set({ name: name?.trim() || undefined, updatedAt: new Date() }).where(eq(table.id, id)).returning({ id: table.id, name: table.name, email: table.email });
    return res.json({ message: 'Profile updated!', user: updated });
  } catch (err) {
    console.error('Update me error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id, tableSource, role } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    const table = tableSource === 'student' ? students : role === 'super_admin' ? admins : contentManagers;
    const [account] = await db.select().from(table).where(eq(table.id, id));
    const isValid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(table).set({ passwordHash, updatedAt: new Date() }).where(eq(table.id, id));
    return res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
