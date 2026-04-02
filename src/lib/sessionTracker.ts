import { getDb } from './db';
import { revokeToken } from './blacklist';

const MAX_SESSIONS_PER_USER = 3;

/** Record a newly-created session so it counts toward the per-user limit. */
export function trackSession(jti: string, userId: string, expiresAt: number): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT OR IGNORE INTO user_sessions (jti, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(jti, userId, now, expiresAt);
}

/**
 * Enforce the concurrent session limit for a user.
 * If the user has more than maxSessions active tracked sessions, the oldest ones
 * are revoked (added to the blacklist) and removed from tracking.
 */
export function enforceSessionLimit(userId: string, maxSessions = MAX_SESSIONS_PER_USER): void {
  const db = getDb();
  const nowSec = Math.floor(Date.now() / 1000);

  // Prune expired sessions first so they don't count against the limit
  db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND expires_at <= ?').run(userId, nowSec);

  const sessions = db
    .prepare('SELECT jti, expires_at FROM user_sessions WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId) as { jti: string; expires_at: number }[];

  if (sessions.length <= maxSessions) return;

  const toRevoke = sessions.slice(0, sessions.length - maxSessions);
  for (const session of toRevoke) {
    revokeToken(session.jti, userId, session.expires_at);
    db.prepare('DELETE FROM user_sessions WHERE jti = ?').run(session.jti);
  }
}

/** Remove a session from tracking (call on logout). */
export function removeTrackedSession(jti: string): void {
  const db = getDb();
  db.prepare('DELETE FROM user_sessions WHERE jti = ?').run(jti);
}
