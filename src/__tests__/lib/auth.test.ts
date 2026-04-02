import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  verifySession,
  shouldRefreshSession,
  refreshSessionToken,
  verifyPassword,
  SESSION_ABSOLUTE_MAX_AGE,
  SESSION_IDLE_TIMEOUT,
  type DecodedSession,
} from '../../lib/auth';
import bcrypt from 'bcryptjs';

// JWT_SECRET and other env vars are set in vitest.config.ts

describe('auth', () => {
  const TEST_USER_ID = 'test-user-id-123';

  describe('createSession', () => {
    it('returns a non-empty JWT string', () => {
      const token = createSession(TEST_USER_ID);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // JWTs have three dot-separated base64 parts
      expect(token.split('.')).toHaveLength(3);
    });

    it('encodes the userId as the sub claim', () => {
      const token = createSession(TEST_USER_ID);
      const decoded = verifySession(token);
      expect(decoded?.sub).toBe(TEST_USER_ID);
    });

    it('sets origIat to current time when not provided', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = createSession(TEST_USER_ID);
      const after = Math.floor(Date.now() / 1000);
      const decoded = verifySession(token);
      expect(decoded?.origIat).toBeGreaterThanOrEqual(before);
      expect(decoded?.origIat).toBeLessThanOrEqual(after);
    });

    it('uses provided originalIat when passed', () => {
      const originalIat = 1700000000;
      const token = createSession(TEST_USER_ID, originalIat);
      const decoded = verifySession(token);
      expect(decoded?.origIat).toBe(originalIat);
    });

    it('includes a jti claim (unique token ID)', () => {
      const token1 = createSession(TEST_USER_ID);
      const token2 = createSession(TEST_USER_ID);
      const decoded1 = verifySession(token1);
      const decoded2 = verifySession(token2);
      expect(decoded1?.jti).toBeTruthy();
      expect(decoded2?.jti).toBeTruthy();
      expect(decoded1?.jti).not.toBe(decoded2?.jti);
    });
  });

  describe('verifySession', () => {
    it('returns decoded payload for a valid token', () => {
      const token = createSession(TEST_USER_ID);
      const decoded = verifySession(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(TEST_USER_ID);
    });

    it('returns null for an invalid token', () => {
      expect(verifySession('not.a.valid.token')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(verifySession('')).toBeNull();
    });

    it('returns null for a tampered token', () => {
      const token = createSession(TEST_USER_ID);
      const parts = token.split('.');
      parts[1] = Buffer.from('{"sub":"hacker","iat":0}').toString('base64url');
      expect(verifySession(parts.join('.'))).toBeNull();
    });

    it('returns null for a token signed with a different secret', async () => {
      const jwt = await import('jsonwebtoken');
      const fakeToken = jwt.default.sign(
        { sub: TEST_USER_ID, iat: Math.floor(Date.now() / 1000) },
        'different-secret-key-that-is-at-least-32chars',
        { algorithm: 'HS512', issuer: 'canvas-dashboard', audience: 'canvas-users' }
      );
      expect(verifySession(fakeToken)).toBeNull();
    });
  });

  describe('shouldRefreshSession', () => {
    const nowSec = Math.floor(Date.now() / 1000);

    it('returns { expired: false, refresh: false } for a fresh session', () => {
      const decoded: DecodedSession = { sub: TEST_USER_ID, iat: nowSec, origIat: nowSec };
      expect(shouldRefreshSession(decoded, nowSec)).toEqual({ expired: false, refresh: false });
    });

    it('returns { expired: true, refresh: false } when absolute max age exceeded', () => {
      const oldOrigIat = nowSec - SESSION_ABSOLUTE_MAX_AGE - 1;
      const decoded: DecodedSession = { sub: TEST_USER_ID, iat: nowSec, origIat: oldOrigIat };
      expect(shouldRefreshSession(decoded, nowSec)).toEqual({ expired: true, refresh: false });
    });

    it('returns { expired: true, refresh: false } when idle timeout exceeded', () => {
      const oldIat = nowSec - SESSION_IDLE_TIMEOUT - 1;
      const decoded: DecodedSession = { sub: TEST_USER_ID, iat: oldIat, origIat: nowSec - 100 };
      expect(shouldRefreshSession(decoded, nowSec)).toEqual({ expired: true, refresh: false });
    });

    it('returns { expired: false, refresh: true } when idle for more than 1 hour', () => {
      const oneHourOneSecAgo = nowSec - 3601;
      const decoded: DecodedSession = {
        sub: TEST_USER_ID,
        iat: oneHourOneSecAgo,
        origIat: nowSec - 3700,
      };
      expect(shouldRefreshSession(decoded, nowSec)).toEqual({ expired: false, refresh: true });
    });

    it('falls back to iat for origIat when origIat is missing', () => {
      const decoded: DecodedSession = { sub: TEST_USER_ID, iat: nowSec };
      expect(shouldRefreshSession(decoded, nowSec)).toEqual({ expired: false, refresh: false });
    });
  });

  describe('refreshSessionToken', () => {
    it('creates a new token preserving origIat', () => {
      const originalIat = Math.floor(Date.now() / 1000) - 7200;
      const token = createSession(TEST_USER_ID, originalIat);
      const decoded = verifySession(token) as DecodedSession;

      const refreshed = refreshSessionToken(decoded);
      const refreshedDecoded = verifySession(refreshed);

      expect(refreshedDecoded?.sub).toBe(TEST_USER_ID);
      expect(refreshedDecoded?.origIat).toBe(originalIat);
    });

    it('updates iat to current time', () => {
      const originalIat = Math.floor(Date.now() / 1000) - 7200;
      const token = createSession(TEST_USER_ID, originalIat);
      const decoded = verifySession(token) as DecodedSession;
      const before = Math.floor(Date.now() / 1000);

      const refreshed = refreshSessionToken(decoded);
      const refreshedDecoded = verifySession(refreshed) as DecodedSession;

      expect(refreshedDecoded.iat).toBeGreaterThanOrEqual(before);
    });
  });

  describe('verifyPassword', () => {
    it('returns true when password matches hash', async () => {
      const password = 'MyStr0ngP@ssword!';
      const hash = await bcrypt.hash(password, 10);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('returns false when password does not match hash', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      expect(await verifyPassword('wrong-password', hash)).toBe(false);
    });

    it('returns false for empty password against a hash', async () => {
      const hash = await bcrypt.hash('somepassword', 10);
      expect(await verifyPassword('', hash)).toBe(false);
    });
  });
});
