import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_NAME, SESSION_ABSOLUTE_MAX_AGE, verifySession } from '@/lib/auth';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';
import { getUserIdFromRequest } from '@/lib/session';
import { revokeToken } from '@/lib/blacklist';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Get userId for audit log before revoking
  const userId = getUserIdFromRequest(request);

  // Revoke the current session token before clearing the cookie
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (token) {
    const decoded = verifySession(token);
    if (decoded?.jti) {
      const expiresAt = (decoded.origIat ?? decoded.iat) + SESSION_ABSOLUTE_MAX_AGE;
      revokeToken(decoded.jti, decoded.sub, expiresAt);
    }
  }

  const res = NextResponse.redirect(`${baseUrl}/login`, 303);
  res.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  logAuditEvent({
    ...buildBaseAuditEvent('logout', request),
    userId: userId ?? undefined,
  });

  return res;
} 