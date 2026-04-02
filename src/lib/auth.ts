import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername } from './users';

export const TOKEN_NAME = 'canvas-dashboard-session';
const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

// Session lifetime (in seconds)
export const SESSION_ABSOLUTE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const SESSION_IDLE_TIMEOUT = 60 * 60 * 24; // 24 hours

function validateJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not set. It must be a strong, random secret string (at least 32 characters).'
    );
  }

  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for adequate entropy.');
  }
}

// Validate at module load so misconfiguration fails fast at startup.
validateJwtSecret();

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Find user by username and verify password. Returns user id if valid, null otherwise. */
export async function findUserAndVerify(username: string, password: string): Promise<string | null> {
  const user = getUserByUsername(username);
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  return valid ? user.id : null;
}

export type DecodedSession = {
  sub: string;
  iat: number;
  origIat?: number;
  jti?: string;
};

export function createSession(userId: string, originalIat?: number) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables. Set JWT_SECRET to sign sessions.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const origIat = originalIat ?? nowSec;

  const payload = {
    sub: userId,
    iat: nowSec,
    origIat,
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS512',
    expiresIn: '7d',
    issuer: 'canvas-dashboard',
    audience: 'canvas-users',
  });
}

export function verifySession(token: string): DecodedSession | null {
  try {
    if (!JWT_SECRET) return null;

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS512'],
      issuer: 'canvas-dashboard',
      audience: 'canvas-users',
    }) as DecodedSession;
    return decoded;
  } catch {
    return null;
  }
}

export function shouldRefreshSession(decoded: DecodedSession, nowSec = Math.floor(Date.now() / 1000)) {
  const idleAge = nowSec - decoded.iat;
  const absoluteAge = nowSec - (decoded.origIat ?? decoded.iat);

  if (absoluteAge > SESSION_ABSOLUTE_MAX_AGE || idleAge > SESSION_IDLE_TIMEOUT) {
    return { expired: true, refresh: false };
  }

  // Refresh interval: 1 hour of inactivity
  const REFRESH_THRESHOLD = 60 * 60;
  if (idleAge > REFRESH_THRESHOLD) {
    return { expired: false, refresh: true };
  }

  return { expired: false, refresh: false };
}

export function refreshSessionToken(decoded: DecodedSession): string {
  const origIat = decoded.origIat ?? decoded.iat;
  return createSession(decoded.sub, origIat);
}