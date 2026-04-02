import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '@/lib/users';
import { isOAuthEnabled, buildPendingSignupCookie } from '@/lib/oauth';
import { checkRateLimit } from '@/lib/rateLimit';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { checkPasswordPolicy } from '@/lib/passwordPolicy';

function validateCanvasBase(url: string): boolean {
  const normalized = url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return /^https:\/\/[a-zA-Z0-9.-]+\.instructure\.com$/.test(normalized);
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request, {
      windowMs: 15 * 60 * 1000,
      max: 5,
      keyPrefix: 'signup',
    });
    if (!rate.allowed) {
      const res = NextResponse.json(
        { message: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
      res.headers.set('Retry-After', String(rate.retryAfterSeconds));
      return res;
    }

    const body = await request.json();
    const { username, password, canvasApiBase, canvasApiToken } = body ?? {};

    // --- Shared validation (both modes) ---

    const userStr = String(username ?? '').trim().toLowerCase();
    if (!userStr || userStr.length < 2 || userStr.length > 64) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr || undefined,
        reason: 'invalid_username_length',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_.\-]+$/.test(userStr)) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'invalid_username_chars',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    const policyResult = checkPasswordPolicy(String(password ?? ''));
    if (!policyResult.ok) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'password_policy_violation',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    const baseStr = String(canvasApiBase ?? '').trim();
    if (!baseStr) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'missing_canvas_base',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    if (!validateCanvasBase(baseStr)) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'invalid_canvas_base',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    if (getUserByUsername(userStr)) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'username_already_taken',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    const normalizedBase = baseStr.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (isOAuthEnabled()) {
      // --- OAuth mode: store validated data in encrypted cookie; no DB write yet.
      // The user record is created only after Canvas confirms authorization in
      // the /api/oauth/callback handler. This prevents orphaned pending entries.
      const cookieValue = buildPendingSignupCookie({
        username: userStr,
        passwordHash,
        canvasApiBase: normalizedBase + '/api/v1',
        expiresAt: Date.now() + 600_000, // 10 minutes
      });

      logAuditEvent({
        ...buildBaseAuditEvent('signup.success', request),
        username: userStr,
      });

      const res = NextResponse.json({ ok: true, mode: 'oauth' });
      res.cookies.set('pending_signup', cookieValue, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 600,
      });
      return res;
    }

    // --- Manual mode (no developer key configured): validate token and create immediately.

    if (!canvasApiToken || String(canvasApiToken).trim().length === 0) {
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'missing_canvas_token',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    // Validate Canvas credentials by calling the Canvas API.
    // Reconstruct the URL from the parsed hostname to avoid taint from raw user input.
    const parsedBase = new URL(normalizedBase);
    const canvasApiUrl = new URL('/api/v1/users/self/profile', parsedBase.origin).href;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(canvasApiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${String(canvasApiToken).trim()}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        logAuditEvent({
          ...buildBaseAuditEvent('signup.failure', request),
          username: userStr,
          reason: 'canvas_invalid_credentials',
        });
        return NextResponse.json(
          { message: 'Account creation failed. Please check your details and try again.' },
          { status: 400 }
        );
      }

      if (!res.ok) {
        logAuditEvent({
          ...buildBaseAuditEvent('signup.failure', request),
          username: userStr,
          reason: `canvas_validation_http_${res.status}`,
        });
        return NextResponse.json(
          { message: 'Account creation failed. Please try again later.' },
          { status: 502 }
        );
      }
    } catch {
      clearTimeout(timeoutId);
      logAuditEvent({
        ...buildBaseAuditEvent('signup.failure', request),
        username: userStr,
        reason: 'canvas_validation_timeout_or_network_error',
      });
      return NextResponse.json(
        { message: 'Account creation failed. Please try again later.' },
        { status: 504 }
      );
    }

    createUser({
      username: userStr,
      passwordHash,
      canvasApiBase: normalizedBase + '/api/v1',
      canvasApiToken: String(canvasApiToken).trim(),
      // oauthStatus defaults to 'manual'
    });

    logAuditEvent({
      ...buildBaseAuditEvent('signup.success', request),
      username: userStr,
    });

    return NextResponse.json({ ok: true, mode: 'manual' });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ message: 'Failed to create account' }, { status: 500 });
  }
}
