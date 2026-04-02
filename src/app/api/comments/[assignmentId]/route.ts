import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getSubmission, postSubmissionComment } from '@/lib/canvas';

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } | Promise<{ assignmentId: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { assignmentId: assignmentIdRaw } = params instanceof Promise ? await params : params;
  const assignmentId = Number(assignmentIdRaw);
  const courseId = Number(request.nextUrl.searchParams.get('course_id'));
  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });
  }
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'course_id must be a positive integer' }, { status: 400 });
  }

  try {
    const submission = await getSubmission(userId, courseId, assignmentId);
    const comments = Array.isArray(submission?.submission_comments)
      ? submission.submission_comments
      : [];
    return NextResponse.json({ comments, user_id: submission?.user_id ?? null });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } | Promise<{ assignmentId: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { assignmentId: assignmentIdRawPost } = params instanceof Promise ? await params : params;
  const assignmentIdPost = Number(assignmentIdRawPost);
  if (!Number.isFinite(assignmentIdPost) || assignmentIdPost <= 0) {
    return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });
  }

  let body: { course_id: number; text: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { course_id, text } = body;
  const courseIdPost = Number(course_id);
  if (!Number.isFinite(courseIdPost) || courseIdPost <= 0) {
    return NextResponse.json({ error: 'course_id must be a positive integer' }, { status: 400 });
  }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  try {
    const result = await postSubmissionComment(userId, courseIdPost, assignmentIdPost, text.trim());
    const newComments: any[] = result?.submission_comments ?? [];
    const latest = newComments[newComments.length - 1] ?? null;
    return NextResponse.json({ success: true, comment: latest });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
