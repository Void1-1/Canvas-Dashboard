import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getUserById, updateManualCanvasToken } from '@/lib/users';
import { buildBaseAuditEvent, logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 401 });
  }

  // Only manual-token users can update their Canvas token via this endpoint.
  if (user.oauth_status !== 'manual') {
    return NextResponse.json({ message: 'Not applicable for OAuth users' }, { status: 400 });
  }

  let body: { canvasApiToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const newToken = String(body.canvasApiToken ?? '').trim();
  if (!newToken) {
    return NextResponse.json({ message: 'Canvas API token is required' }, { status: 400 });
  }

  // Validate the new token against Canvas before storing it.
  const canvasApiUrl = `${user.canvas_api_base}/users/self/profile`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(canvasApiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${newToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { message: 'Token is invalid. Please check and try again.' },
        { status: 400 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: 'Could not verify token with Canvas. Please try again later.' },
        { status: 502 }
      );
    }
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { message: 'Could not reach Canvas. Please try again later.' },
      { status: 504 }
    );
  }

  updateManualCanvasToken(userId, newToken);

  logAuditEvent({
    ...buildBaseAuditEvent('canvas.token_renewal', request),
    userId,
  });

  return NextResponse.json({ ok: true });
}
