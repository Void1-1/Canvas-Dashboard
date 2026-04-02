import { describe, it, expect } from 'vitest';
import { trackSession, enforceSessionLimit, removeTrackedSession } from '../../lib/sessionTracker';
import { isTokenRevoked } from '../../lib/blacklist';
import { createUser } from '../../lib/users';
import bcrypt from 'bcryptjs';

// Uses SQLITE_DB_PATH=:memory: from vitest.config.ts

function uniqueUsername(prefix = 'tracker') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function makeTestUser() {
  const hash = await bcrypt.hash('TestPassword123!', 10);
  return createUser({
    username: uniqueUsername(),
    passwordHash: hash,
    canvasApiBase: 'https://canvas.test.com/api/v1',
    canvasApiToken: 'test-token',
  });
}

function futureExpiry(secondsAhead = 3600) {
  return Math.floor(Date.now() / 1000) + secondsAhead;
}

describe('sessionTracker', () => {
  describe('trackSession', () => {
    it('does not throw when tracking a valid session', async () => {
      const user = await makeTestUser();
      const jti = `track-${Date.now()}`;
      expect(() => trackSession(jti, user.id, futureExpiry())).not.toThrow();
    });

    it('handles duplicate JTIs gracefully (INSERT OR IGNORE)', async () => {
      const user = await makeTestUser();
      const jti = `dup-${Date.now()}`;
      expect(() => {
        trackSession(jti, user.id, futureExpiry());
        trackSession(jti, user.id, futureExpiry());
      }).not.toThrow();
    });
  });

  describe('removeTrackedSession', () => {
    it('does not throw when removing a tracked session', async () => {
      const user = await makeTestUser();
      const jti = `remove-${Date.now()}`;
      trackSession(jti, user.id, futureExpiry());
      expect(() => removeTrackedSession(jti)).not.toThrow();
    });

    it('does not throw when removing a non-existent session', () => {
      expect(() => removeTrackedSession('nonexistent-jti')).not.toThrow();
    });
  });

  describe('enforceSessionLimit', () => {
    it('does not revoke sessions when under the limit', async () => {
      const user = await makeTestUser();
      const jti1 = `limit-under-1-${Date.now()}`;
      const jti2 = `limit-under-2-${Date.now()}`;

      trackSession(jti1, user.id, futureExpiry());
      trackSession(jti2, user.id, futureExpiry());

      enforceSessionLimit(user.id, 3);

      // Both sessions should still be active (not revoked)
      expect(isTokenRevoked(jti1)).toBe(false);
      expect(isTokenRevoked(jti2)).toBe(false);
    });

    it('revokes oldest sessions when limit is exceeded', async () => {
      const user = await makeTestUser();
      const base = Date.now();
      const jti1 = `oldest-${base}-1`;
      const jti2 = `oldest-${base}-2`;
      const jti3 = `oldest-${base}-3`;

      trackSession(jti1, user.id, futureExpiry());
      await new Promise((r) => setTimeout(r, 5));
      trackSession(jti2, user.id, futureExpiry());
      await new Promise((r) => setTimeout(r, 5));
      trackSession(jti3, user.id, futureExpiry());

      // Max 2 concurrent sessions — oldest (jti1) should be revoked
      enforceSessionLimit(user.id, 2);

      expect(isTokenRevoked(jti1)).toBe(true);
      expect(isTokenRevoked(jti2)).toBe(false);
      expect(isTokenRevoked(jti3)).toBe(false);
    });

    it('prunes expired sessions before enforcing limit', async () => {
      const user = await makeTestUser();
      const expiredJti = `expired-session-${Date.now()}`;
      const activeJti = `active-session-${Date.now()}`;

      // Track an already-expired session
      const pastExpiry = Math.floor(Date.now() / 1000) - 10;
      trackSession(expiredJti, user.id, pastExpiry);
      trackSession(activeJti, user.id, futureExpiry());

      // With limit of 1, expired session should be pruned first (not counted)
      enforceSessionLimit(user.id, 1);

      // The active session should NOT be revoked because the expired one was pruned first
      expect(isTokenRevoked(activeJti)).toBe(false);
    });

    it('does not throw when no sessions exist for user', async () => {
      const user = await makeTestUser();
      expect(() => enforceSessionLimit(user.id)).not.toThrow();
    });
  });
});
