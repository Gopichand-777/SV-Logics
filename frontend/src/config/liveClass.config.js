/**
 * Live Class configuration — single source of truth.
 * Change these values here and they will automatically apply everywhere
 * (Navbar red dot, LiveClasses page join button, countdown timer, etc.).
 */

/** How many minutes after class start a student is allowed to join. */
export const JOIN_GRACE_MINUTES = 10;

/** Same value in milliseconds — derived, never set manually. */
export const JOIN_GRACE_MS = JOIN_GRACE_MINUTES * 60 * 1000;
