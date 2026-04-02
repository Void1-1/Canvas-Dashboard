import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, parseOAuthStateCookie } from '@/lib/oauth';
import { createUser, updateOAuthTokens, getUserById } from '@/lib/users';
import { decryptCanvasToken } from '@/lib/encryption';
import { createSession, TOKEN_NAME, SESSION_ABSOLUTE_MAX_AGE } from '@/lib/auth';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { trackSession, enforceSessionLimit } from '@/lib/sessionTracker';
import jwt from 'jsonwebtoken';

const OAUTH_STATE_COOKIE = 'oauth_state';
const PENDING_SIGNUP_COOKIE = 'pending_signup';

function clearTransientCookies(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    maxAge: 0,
    path: '/api/oauth/callback',
  });
  response.cookies.set(PENDING_SIGNUP_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // User denied authorization on Canvas
  if (errorParam) {
    logAuditEvent({
      ...buildBaseAuditEvent('oauth.callback.failure', request),
      reason: `canvas_denied:${errorParam}`,
    });
    const res = NextResponse.redirect(new URL('/signup?error=access_denied', request.url));
    clearTransientCookies(res);
    return res;
  }

  // Validate state cookie
  const stateCookieValue = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!stateCookieValue) {
    logAuditEvent({
      ...buildBaseAuditEvent('oauth.callback.failure', request),
      reason: 'state_cookie_missing',
    });
    return NextResponse.redirect(new URL('/login?error=oauth_state_missing', request.url));
  }

  const payload = parseOAuthStateCookie(stateCookieValue);

  if (!payload || payload.state !== state || Date.now() > payload.expiresAt) {
    logAuditEvent({
      ...buildBaseAuditEvent('oauth.callback.failure', request),
      reason: !payload
        ? 'state_cookie_invalid'
        : payload.state !== state
          ? 'state_mismatch'
          : 'state_expired',
    });
    const res = NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    clearTransientCookies(res);
    return res;
  }

  if (!code) {
    logAuditEvent({
      ...buildBaseAuditEvent('oauth.callback.failure', request),
      reason: 'missing_code',
    });
    const res = NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    clearTransientCookies(res);
    return res;
  }

  // Exchange authorization code for tokens
  let tokenResponse;
  try {
    tokenResponse = await exchangeCodeForTokens(payload.canvasApiBase, code);
  } catch (e) {
    logAuditEvent({
      ...buildBaseAuditEvent('oauth.callback.failure', request),
      userId: payload.userId,
      reason: `token_exchange_failed:${e instanceof Error ? e.message : 'unknown'}`,
    });
    const res = NextResponse.redirect(new URL('/signup?error=oauth_failed', request.url));
    clearTransientCookies(res);
    return res;
  }

  // Resolve target user — create new record for signups, use existing for re-auth
  let targetUserId: string;

  if (payload.pendingSignup) {
    // New user: create the DB record now that Canvas has confirmed authorization.
    // This ensures no orphaned pending entries from abandoned signup flows.
    try {
      const newUser = createUser({
        username: payload.pendingSignup.username,
        passwordHash: payload.pendingSignup.passwordHash,
        canvasApiBase: payload.pendingSignup.canvasApiBase,
        canvasApiToken: '',
        oauthStatus: 'pending', // updateOAuthTokens below will set this to 'active'
      });
      targetUserId = newUser.id;
    } catch {
      // Most likely a username conflict (rare race condition between two concurrent signups).
      logAuditEvent({
        ...buildBaseAuditEvent('oauth.callback.failure', request),
        reason: 'create_user_failed_username_conflict',
      });
      const res = NextResponse.redirect(new URL('/signup?error=username_taken', request.url));
      clearTransientCookies(res);
      return res;
    }
  } else {
    targetUserId = payload.userId!;
  }

  const expiresAt = Date.now() + tokenResponse.expires_in * 1000;

  // Guard against Canvas omitting refresh_token (non-standard but possible).
  // For re-auth flows, preserve the existing refresh token as a fallback.
  let refreshToken: string = tokenResponse.refresh_token ?? '';
  if (!refreshToken && !payload.pendingSignup) {
    const existingUser = getUserById(targetUserId);
    if (existingUser?.canvas_refresh_token) {
      refreshToken = decryptCanvasToken(existingUser.canvas_refresh_token);
    }
  }

  updateOAuthTokens(targetUserId, {
    accessToken: tokenResponse.access_token,
    refreshToken,
    expiresAt,
  });

  logAuditEvent({
    ...buildBaseAuditEvent('oauth.callback.success', request),
    userId: targetUserId,
  });

  // Issue full 7-day session and redirect to dashboard
  const sessionToken = createSession(targetUserId);

  // Track this session and enforce the per-user concurrent session limit
  const sessionPayload = jwt.decode(sessionToken) as { jti?: string; exp?: number } | null;
  if (sessionPayload?.jti) {
    const sessionExpiresAt = sessionPayload.exp ?? Math.floor(Date.now() / 1000) + SESSION_ABSOLUTE_MAX_AGE;
    trackSession(sessionPayload.jti, targetUserId, sessionExpiresAt);
    enforceSessionLimit(targetUserId);
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  clearTransientCookies(response);
  response.cookies.set(TOKEN_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_ABSOLUTE_MAX_AGE,
  });

  return response;
}
