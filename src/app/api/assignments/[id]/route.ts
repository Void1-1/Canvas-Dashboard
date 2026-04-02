import { NextRequest, NextResponse } from 'next/server';
import { getAssignment } from '@/lib/canvas';
import { getUserIdFromRequest } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const searchParams = request.nextUrl.searchParams;
    const courseIdRaw = searchParams.get('course_id');

    const assignmentId = Number(id);
    const courseId = Number(courseIdRaw);

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });
    }
    if (!Number.isFinite(courseId) || courseId <= 0) {
      return NextResponse.json({ error: 'course_id must be a positive integer' }, { status: 400 });
    }

    const assignment = await getAssignment(userId, courseId, assignmentId);
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Failed to fetch assignment:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

