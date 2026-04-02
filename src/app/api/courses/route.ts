import { NextRequest, NextResponse } from 'next/server';
import { getCourses } from '@/lib/canvas';
import { getUserIdFromRequest } from '@/lib/session';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await getCourses(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch courses', error);
    return NextResponse.json({ message: 'Failed to fetch courses' }, { status: 500 });
  }
} 