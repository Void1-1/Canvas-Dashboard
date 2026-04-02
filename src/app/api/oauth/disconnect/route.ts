import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getUserById, clearOAuthTokens } from '@/lib/users';
import { revokeToken } from '@/lib/oauth';
import { decryptCanvasToken } from '@/lib/encryption';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = getUserById(userId);
  if (user?.canvas_api_token) {
    try {
      const token = decryptCanvasToken(user.canvas_api_token);
      await revokeToken(user.canvas_api_base, token);
    } catch {
      // Best-effort revocation; proceed regardless
    }
  }

  clearOAuthTokens(userId);

  logAuditEvent({
    ...buildBaseAuditEvent('oauth.disconnect', request),
    userId,
  });

  return NextResponse.json({ ok: true });
}
