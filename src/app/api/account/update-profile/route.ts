import { type NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { updateDisplayName, getUserById } from '@/lib/users';

const MAX_DISPLAY_NAME_LENGTH = 64;

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { displayName } = body as { displayName?: unknown };

  // Allow null/empty string to clear the display name
  if (displayName !== null && displayName !== undefined && typeof displayName !== 'string') {
    return NextResponse.json({ error: 'displayName must be a string or null' }, { status: 400 });
  }

  const trimmed = typeof displayName === 'string' ? displayName.trim() : null;

  if (trimmed && trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  updateDisplayName(userId, trimmed || null);

  const user = getUserById(userId);
  return NextResponse.json({ displayName: user?.display_name ?? null });
}
