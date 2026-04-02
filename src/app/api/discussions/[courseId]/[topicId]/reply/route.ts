import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { postDiscussionEntry } from '@/lib/canvas';

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: { courseId: string; topicId: string } | Promise<{ courseId: string; topicId: string }>;
  }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = params instanceof Promise ? await params : params;
  const courseId = Number(resolvedParams.courseId);
  const topicId = Number(resolvedParams.topicId);

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
  }
  if (!Number.isFinite(topicId) || topicId <= 0) {
    return NextResponse.json({ error: 'Invalid topicId' }, { status: 400 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message } = body;
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const entry = await postDiscussionEntry(userId, courseId, topicId, message);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Failed to post discussion entry:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to post reply' },
      { status: 500 }
    );
  }
}
