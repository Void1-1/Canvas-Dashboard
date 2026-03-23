import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { TOKEN_NAME, SESSION_ABSOLUTE_MAX_AGE, SESSION_IDLE_TIMEOUT, DecodedSession, refreshSessionToken, shouldRefreshSession, verifySession } from './auth';
import { getUserById } from './users';
import { isTokenRevoked } from './blacklist';

/** Get the current user id from the session cookie. Returns null if not logged in. Use in server components. */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  const decoded = verifySession(token) as DecodedSession | null;
  if (!decoded) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const absoluteAge = nowSec - (decoded.origIat ?? decoded.iat);
  const idleAge = nowSec - decoded.iat;
  if (absoluteAge > SESSION_ABSOLUTE_MAX_AGE || idleAge > SESSION_IDLE_TIMEOUT) {
    return null;
  }

  if (decoded.jti && isTokenRevoked(decoded.jti)) {
    return null;
  }

  const user = getUserById(decoded.sub);
  if (!user) return null;

  if (user.password_changed_at && decoded.iat * 1000 < user.password_changed_at) {
    return null;
  }

  return user.id;
}

/** Get the current user id from the request cookie. Returns null if not logged in. Use in API routes. */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) return null;
  const decoded = verifySession(token) as DecodedSession | null;
  if (!decoded) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const absoluteAge = nowSec - (decoded.origIat ?? decoded.iat);
  const idleAge = nowSec - decoded.iat;
  if (absoluteAge > SESSION_ABSOLUTE_MAX_AGE || idleAge > SESSION_IDLE_TIMEOUT) {
    return null;
  }

  if (decoded.jti && isTokenRevoked(decoded.jti)) {
    return null;
  }

  const user = getUserById(decoded.sub);
  if (!user) return null;

  if (user.password_changed_at && decoded.iat * 1000 < user.password_changed_at) {
    return null;
  }

  return user.id;
}

/** Optionally refresh the session cookie for API responses using a sliding expiration window.
 *  This helper is invoked from `middleware.ts` so it runs on all authenticated API routes.
 */
export function maybeRefreshSessionCookie(request: NextRequest, response: Response): Response {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) return response;

  const decoded = verifySession(token);
  if (!decoded) return response;

  const nowSec = Math.floor(Date.now() / 1000);
  const status = shouldRefreshSession(decoded, nowSec);
  if (status.expired || !status.refresh) {
    return response;
  }

  const newToken = refreshSessionToken(decoded);

  if ('headers' in response) {
    const cookieHeader = [
      `${TOKEN_NAME}=${newToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
      `Max-Age=${SESSION_ABSOLUTE_MAX_AGE}`,
    ]
      .filter(Boolean)
      .join('; ');

    response.headers.append('Set-Cookie', cookieHeader);
  }

  return response;
}
