import { getDb } from './db';

/** Add a token to the revocation blacklist. expiresAt is a Unix timestamp (seconds). */
export function revokeToken(jti: string, userId: string, expiresAt: number): void {
  const db = getDb();
  db.prepare(
    'INSERT OR IGNORE INTO revoked_sessions (jti, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(jti, userId, expiresAt);

  // Probabilistic cleanup: remove expired entries ~1% of the time
  if (Math.random() < 0.01) {
    cleanupExpiredTokens();
  }
}

/** Returns true if the given jti is on the blacklist and not yet expired. */
export function isTokenRevoked(jti: string): boolean {
  const db = getDb();
  const nowSec = Math.floor(Date.now() / 1000);
  const row = db
    .prepare('SELECT 1 FROM revoked_sessions WHERE jti = ? AND expires_at > ?')
    .get(jti, nowSec);
  return row !== undefined;
}

/** Delete all blacklist entries whose token has already expired. */
export function cleanupExpiredTokens(): void {
  const db = getDb();
  const nowSec = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM revoked_sessions WHERE expires_at <= ?').run(nowSec);
}
