import { describe, it, expect, vi } from 'vitest';

// Mock next/headers before importing session.ts (getCurrentUserId uses cookies())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock next/server to provide a minimal NextRequest stub
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: class NextResponse {},
}));

import { getUserIdFromRequest, maybeRefreshSessionCookie } from '../../lib/session';
import { createSession, TOKEN_NAME, SESSION_IDLE_TIMEOUT } from '../../lib/auth';
import { createUser } from '../../lib/users';
import { getDb } from '../../lib/db';
import bcrypt from 'bcryptjs';

function uniqueUsername(prefix = 'session') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function makeTestUser() {
  const hash = await bcrypt.hash('TestPassword123!', 10);
  const user = createUser({
    username: uniqueUsername(),
    passwordHash: hash,
    canvasApiBase: 'https://canvas.test.com/api/v1',
    canvasApiToken: 'test-token',
  });
  // Set password_changed_at to 0 so any newly-created JWT iat will be after it,
  // avoiding a sub-second mismatch between password_changed_at (ms) and iat (sec).
  getDb().prepare('UPDATE users SET password_changed_at = 0 WHERE id = ?').run(user.id);
  return user;
}

/** Builds a minimal NextRequest-like object with the session cookie set. */
function makeRequestWithToken(token: string | null): any {
  return {
    cookies: {
      get: (name: string) => (name === TOKEN_NAME && token ? { value: token } : undefined),
    },
    headers: { get: () => null },
    ip: '127.0.0.1',
  };
}

describe('session', () => {
  describe('getUserIdFromRequest', () => {
    it('returns null when no cookie is present', () => {
      const req = makeRequestWithToken(null);
      expect(getUserIdFromRequest(req)).toBeNull();
    });

    it('returns null for an invalid/malformed token', () => {
      const req = makeRequestWithToken('not.a.real.token');
      expect(getUserIdFromRequest(req)).toBeNull();
    });

    it('returns the user id for a valid token belonging to an existing user', async () => {
      const user = await makeTestUser();
      const token = createSession(user.id);
      const req = makeRequestWithToken(token);
      expect(getUserIdFromRequest(req)).toBe(user.id);
    });

    it('returns null for a valid token referencing a non-existent user', () => {
      const token = createSession('nonexistent-user-id-xyz');
      const req = makeRequestWithToken(token);
      expect(getUserIdFromRequest(req)).toBeNull();
    });

    it('returns null when session has exceeded idle timeout', async () => {
      const user = await makeTestUser();
      // createSession always uses current time for iat, so manually sign a token
      // with a stale iat to simulate an idle-timeout scenario
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET as string;
      const staleIat = Math.floor(Date.now() / 1000) - SESSION_IDLE_TIMEOUT - 10;
      const staleToken = jwt.default.sign(
        { sub: user.id, iat: staleIat, origIat: staleIat },
        secret,
        { algorithm: 'HS512', issuer: 'canvas-dashboard', audience: 'canvas-users' }
      );
      const req = makeRequestWithToken(staleToken);
      expect(getUserIdFromRequest(req)).toBeNull();
    });

    it('returns null when password was changed after token was issued', async () => {
      const user = await makeTestUser();

      // Sign a token with an iat 10 seconds in the past to guarantee
      // that the subsequent password change timestamp is after the token's iat
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET as string;
      const oldIat = Math.floor(Date.now() / 1000) - 10;
      const oldToken = jwt.default.sign(
        { sub: user.id, iat: oldIat, origIat: oldIat },
        secret,
        { algorithm: 'HS512', issuer: 'canvas-dashboard', audience: 'canvas-users' }
      );

      // Change the password now — password_changed_at will be > oldIat * 1000
      const { updateUserPassword } = await import('../../lib/users');
      const newHash = await bcrypt.hash('NewPassword456!', 10);
      updateUserPassword(user.id, newHash);

      const req = makeRequestWithToken(oldToken);
      expect(getUserIdFromRequest(req)).toBeNull();
    });
  });

  describe('maybeRefreshSessionCookie', () => {
    it('returns the response unchanged when no cookie is present', () => {
      const req = makeRequestWithToken(null);
      const res = new Response(null, { status: 200 });
      const result = maybeRefreshSessionCookie(req, res);
      expect(result).toBe(res);
      expect(result.headers.get('Set-Cookie')).toBeNull();
    });

    it('returns the response unchanged when token is invalid', () => {
      const req = makeRequestWithToken('invalid.token.here');
      const res = new Response(null, { status: 200 });
      const result = maybeRefreshSessionCookie(req, res);
      expect(result).toBe(res);
    });

    it('returns the response unchanged for a fresh session (no refresh needed)', async () => {
      const user = await makeTestUser();
      const token = createSession(user.id);
      const req = makeRequestWithToken(token);
      const res = new Response(null, { status: 200 });
      const result = maybeRefreshSessionCookie(req, res);
      // Fresh session — iat is just now, no refresh needed
      expect(result.headers.get('Set-Cookie')).toBeNull();
    });

    it('sets a new Set-Cookie header when session needs refresh (idle > 1 hour)', async () => {
      const user = await makeTestUser();
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET as string;
      const idleIat = Math.floor(Date.now() / 1000) - 3700; // > 1 hour idle
      const token = jwt.default.sign(
        { sub: user.id, iat: idleIat, origIat: idleIat },
        secret,
        { algorithm: 'HS512', issuer: 'canvas-dashboard', audience: 'canvas-users' }
      );
      const req = makeRequestWithToken(token);
      const res = new Response(null, { status: 200 });
      const result = maybeRefreshSessionCookie(req, res);
      // Should have appended a new Set-Cookie
      expect(result.headers.get('Set-Cookie')).toContain(TOKEN_NAME);
    });

    it('does not refresh when session is expired (idle > 24h)', async () => {
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET as string;
      const expiredIat = Math.floor(Date.now() / 1000) - SESSION_IDLE_TIMEOUT - 100;
      const token = jwt.default.sign(
        { sub: 'some-user', iat: expiredIat, origIat: expiredIat },
        secret,
        { algorithm: 'HS512', issuer: 'canvas-dashboard', audience: 'canvas-users' }
      );
      const req = makeRequestWithToken(token);
      const res = new Response(null, { status: 200 });
      const result = maybeRefreshSessionCookie(req, res);
      // Expired session — shouldRefreshSession returns { expired: true } so no new cookie
      expect(result.headers.get('Set-Cookie')).toBeNull();
    });
  });
});
