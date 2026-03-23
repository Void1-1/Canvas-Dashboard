import { NextRequest, NextResponse } from 'next/server';
import { findUserAndVerify, createSession, TOKEN_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { addLoginHistory } from '@/lib/users';

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyPrefix: 'login',
  });
  if (!rate.allowed) {
    const res = NextResponse.json(
      { message: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
    res.headers.set('Retry-After', String(rate.retryAfterSeconds));
    return res;
  }

  const body = await request.json();
  const { username, password } = body ?? {};

  if (!username || !password) {
    return NextResponse.json(
      { message: 'Username and password required' },
      { status: 400 }
    );
  }

  const usernameStr = String(username).trim();
  const userId = await findUserAndVerify(usernameStr, password);
  if (!userId) {
    logAuditEvent({
      ...buildBaseAuditEvent('login.failure', request),
      username: usernameStr.toLowerCase(),
    });
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const token = createSession(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days to match JWT
  });

  const successEvent = buildBaseAuditEvent('login.success', request);
  logAuditEvent({ ...successEvent, username: usernameStr.toLowerCase() });
  addLoginHistory(userId, successEvent.ip);

  return res;
} 