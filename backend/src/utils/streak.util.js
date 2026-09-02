import { db } from '../db/index.js';
import { userStreaks } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Updates the day streak for a student.
 * - Called on login AND on app-load token validation (getMe).
 * - Idempotent: if already active today, does nothing.
 * - Increments streak if last active was yesterday.
 * - Resets to 1 if last active was 2+ days ago.
 */
export async function updateStreak(studentId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

    const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.studentId, studentId));

    if (!streak) {
      // First time — create streak record
      await db.insert(userStreaks).values({
        studentId,
        currentStreak: 1,
        longestStreak: 1,
        lastActive: today,
      });
      return;
    }

    // Already counted today — nothing to do
    if (streak.lastActive === today) return;

    // Consecutive day → increment; gap → reset
    const newStreak = streak.lastActive === yesterday ? streak.currentStreak + 1 : 1;
    const longest   = Math.max(newStreak, streak.longestStreak);

    await db.update(userStreaks)
      .set({ currentStreak: newStreak, longestStreak: longest, lastActive: today })
      .where(eq(userStreaks.studentId, studentId));
  } catch (e) {
    // Non-fatal — log and continue; don't block auth flow
    console.error('Streak update error:', e);
  }
}
