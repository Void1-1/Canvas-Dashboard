import { describe, it, expect, beforeAll } from 'vitest';
import { revokeToken, isTokenRevoked, cleanupExpiredTokens } from '../../lib/blacklist';

// Uses SQLITE_DB_PATH=:memory: from vitest.config.ts

describe('blacklist', () => {
  const TEST_USER_ID = 'blacklist-test-user';

  describe('isTokenRevoked', () => {
    it('returns false for an unknown jti', () => {
      expect(isTokenRevoked('unknown-jti-that-was-never-revoked')).toBe(false);
    });

    it('returns true for a recently revoked token', () => {
      const jti = `jti-${Date.now()}-revoke`;
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // expires in 1 hour
      revokeToken(jti, TEST_USER_ID, expiresAt);
      expect(isTokenRevoked(jti)).toBe(true);
    });

    it('returns false for an expired revoked token', () => {
      const jti = `jti-${Date.now()}-expired`;
      const expiresAt = Math.floor(Date.now() / 1000) - 1; // already expired
      revokeToken(jti, TEST_USER_ID, expiresAt);
      expect(isTokenRevoked(jti)).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('does not throw on duplicate revocations (INSERT OR IGNORE)', () => {
      const jti = `jti-${Date.now()}-dup`;
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      expect(() => {
        revokeToken(jti, TEST_USER_ID, expiresAt);
        revokeToken(jti, TEST_USER_ID, expiresAt);
      }).not.toThrow();
    });

    it('revokes multiple different tokens', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const jti1 = `multi-jti-1-${Date.now()}`;
      const jti2 = `multi-jti-2-${Date.now()}`;
      revokeToken(jti1, TEST_USER_ID, expiresAt);
      revokeToken(jti2, TEST_USER_ID, expiresAt);
      expect(isTokenRevoked(jti1)).toBe(true);
      expect(isTokenRevoked(jti2)).toBe(true);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('removes expired entries without affecting valid ones', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const expiredJti = `cleanup-expired-${Date.now()}`;
      const validJti = `cleanup-valid-${Date.now()}`;

      revokeToken(expiredJti, TEST_USER_ID, nowSec - 10);  // already expired
      revokeToken(validJti, TEST_USER_ID, nowSec + 3600);   // still valid

      cleanupExpiredTokens();

      expect(isTokenRevoked(expiredJti)).toBe(false);
      expect(isTokenRevoked(validJti)).toBe(true);
    });

    it('does not throw when there are no expired entries', () => {
      expect(() => cleanupExpiredTokens()).not.toThrow();
    });
  });
});
