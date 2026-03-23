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
    const courseId = searchParams.get('course_id');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      );
    }
    
    const assignment = await getAssignment(userId, Number(courseId), Number(id));
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Failed to fetch assignment:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

