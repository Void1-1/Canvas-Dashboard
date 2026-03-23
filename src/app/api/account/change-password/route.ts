import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserIdFromRequest } from '@/lib/session';
import {
  getUserById,
  getPasswordHistoryHashes,
  addPasswordToHistory,
  updateUserPassword,
} from '@/lib/users';
import { TOKEN_NAME } from '@/lib/auth';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { checkPasswordPolicy } from '@/lib/passwordPolicy';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = body ?? {};
  if (!currentPassword || typeof currentPassword !== 'string') {
    return NextResponse.json(
      { message: 'Current password is required' },
      { status: 400 }
    );
  }
  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json(
      { message: 'New password is required' },
      { status: 400 }
    );
  }
  const policyResult = checkPasswordPolicy(newPassword);
  if (!policyResult.ok) {
    return NextResponse.json(
      { message: policyResult.reason },
      { status: 400 }
    );
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 401 });
  }

  const currentMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!currentMatch) {
    return NextResponse.json(
      { message: 'Current password is incorrect' },
      { status: 401 }
    );
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
  if (sameAsCurrent) {
    return NextResponse.json(
      { message: 'New password cannot be the same as your current password' },
      { status: 400 }
    );
  }

  const historyHashes = getPasswordHistoryHashes(userId).reverse();
  for (const hash of historyHashes) {
    const reused = await bcrypt.compare(newPassword, hash);
    if (reused) {
      return NextResponse.json(
        { message: 'Cannot reuse a recent password. Choose a different one.' },
        { status: 400 }
      );
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  addPasswordToHistory(userId, user.password_hash);
  updateUserPassword(userId, newHash);

  const response = NextResponse.json({ ok: true, message: 'Password updated' });
  // Invalidate all existing sessions (including the current one) by clearing the session cookie.
  response.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  logAuditEvent({
    ...buildBaseAuditEvent('password.change', request),
    userId,
  });

  return response;
}
