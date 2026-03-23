import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/canvas';
import { getUserIdFromRequest } from '@/lib/session';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await getUserProfile(userId);
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
} 