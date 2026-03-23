import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/users';

const TOKEN_WARNING_DAYS = 100;
const TOKEN_EXPIRY_DAYS = 120;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 401 });
  }

  // OAuth users manage their own token expiry — no renewal warning needed.
  if (user.oauth_status === 'active' || user.oauth_status === 'pending') {
    return NextResponse.json({ needsRenewal: false });
  }

  // Manual users: check how old the stored Canvas API token is.
  const tokenSetAt = user.canvas_token_set_at ?? user.created_at;
  const daysOld = (Date.now() - tokenSetAt) / MS_PER_DAY;
  const daysUntilExpiry = TOKEN_EXPIRY_DAYS - daysOld;
  const needsRenewal = daysOld >= TOKEN_WARNING_DAYS;

  return NextResponse.json({
    needsRenewal,
    daysOld: Math.floor(daysOld),
    daysUntilExpiry: Math.max(0, Math.floor(daysUntilExpiry)),
  });
}
