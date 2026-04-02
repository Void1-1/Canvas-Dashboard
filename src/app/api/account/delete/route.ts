import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getUserById, deleteUser } from '@/lib/users';
import { findUserAndVerify, TOKEN_NAME } from '@/lib/auth';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rateLimit';

export async function DELETE(request: NextRequest) {
  const rate = checkRateLimit(request, {
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: 'account-delete',
  });
  if (!rate.allowed) {
    const res = NextResponse.json(
      { message: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
    res.headers.set('Retry-After', String(rate.retryAfterSeconds));
    return res;
  }

  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { password } = body ?? {};
  if (!password) {
    return NextResponse.json({ message: 'Password is required to delete your account.' }, { status: 400 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Verify password before deletion
  const verified = await findUserAndVerify(user.username, password);
  if (!verified) {
    return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 });
  }

  deleteUser(userId);

  logAuditEvent({
    ...buildBaseAuditEvent('account.delete', request),
    userId,
  });

  // Clear session cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
