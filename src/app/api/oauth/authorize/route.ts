import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/users';
import {
  buildAuthorizationUrl,
  generateState,
  buildOAuthStateCookie,
  parsePendingSignupCookie,
  OAuthStateCookiePayload,
} from '@/lib/oauth';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';

const PENDING_SIGNUP_COOKIE = 'pending_signup';

export async function GET(request: NextRequest) {
  let statePayload: OAuthStateCookiePayload;

  // Check for a pending signup cookie first (new user registration path).
  // In this case there is no session yet — the user has not been written to DB.
  const pendingSignupValue = request.cookies.get(PENDING_SIGNUP_COOKIE)?.value;
  const pendingSignup = pendingSignupValue ? parsePendingSignupCookie(pendingSignupValue) : null;

  if (pendingSignup && Date.now() <= pendingSignup.expiresAt) {
    const state = generateState();
    statePayload = {
      state,
      canvasApiBase: pendingSignup.canvasApiBase,
      expiresAt: Date.now() + 600_000,
      pendingSignup: {
        username: pendingSignup.username,
        passwordHash: pendingSignup.passwordHash,
        canvasApiBase: pendingSignup.canvasApiBase,
      },
    };

    logAuditEvent({
      ...buildBaseAuditEvent('oauth.authorize', request),
      pendingUsername: pendingSignup.username,
    });
  } else {
    // Existing user re-authorizing — must have a valid session.
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const state = generateState();
    statePayload = {
      state,
      canvasApiBase: user.canvas_api_base,
      expiresAt: Date.now() + 600_000,
      userId,
    };

    logAuditEvent({
      ...buildBaseAuditEvent('oauth.authorize', request),
      userId,
    });
  }

  const authUrl = buildAuthorizationUrl(statePayload.canvasApiBase, statePayload.state);
  const stateCookieValue = buildOAuthStateCookie(statePayload);

  const response = NextResponse.redirect(authUrl);
  // sameSite: 'lax' is required — Canvas redirects the browser back cross-site, so 'strict'
  // would cause the browser to drop this cookie on the return trip.
  response.cookies.set('oauth_state', stateCookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/oauth/callback',
    maxAge: 600,
  });

  return response;
}
