import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { initiateFileUpload, confirmFileUpload, submitAssignment } from '@/lib/canvas';
import { getCredentialsWithRefresh } from '@/lib/users';

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } | Promise<{ assignmentId: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = params instanceof Promise ? await params : params;
  const assignmentId = Number(resolvedParams.assignmentId);
  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const courseId = Number(formData.get('course_id'));
  const submissionType = formData.get('submission_type') as string;
  const comment = formData.get('comment') as string | null;

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'course_id must be a positive integer' }, { status: 400 });
  }
  if (!submissionType) {
    return NextResponse.json({ error: 'submission_type is required' }, { status: 400 });
  }

  try {
    if (submissionType === 'online_upload') {
      const file = formData.get('file') as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'A file is required for online_upload' }, { status: 400 });
      }

      // Step 1: Notify Canvas of the upload
      const initResult = await initiateFileUpload(
        userId,
        file.name,
        file.size,
        file.type || 'application/octet-stream'
      );

      // Step 2: Upload to S3 (no Canvas auth — request is cryptographically signed by Canvas)
      const uploadForm = new FormData();
      for (const [key, value] of Object.entries(initResult.upload_params)) {
        uploadForm.append(key, value);
      }
      // File must be appended last
      uploadForm.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name);

      const uploadRes = await fetch(initResult.upload_url, {
        method: 'POST',
        body: uploadForm,
        redirect: 'manual',
      });

      let fileId: number;

      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        // 201 Created — already confirmed
        const fileData = await uploadRes.json();
        fileId = fileData.id;
      } else if (uploadRes.status >= 300 && uploadRes.status < 400) {
        // 301 redirect to confirm endpoint
        const confirmUrl = uploadRes.headers.get('Location');
        if (!confirmUrl) {
          return NextResponse.json({ error: 'Canvas upload redirect missing Location header' }, { status: 502 });
        }
        // Validate confirmUrl is an HTTPS Canvas host before following the redirect
        const creds = await getCredentialsWithRefresh(userId);
        if (!creds) {
          return NextResponse.json({ error: 'User credentials not found' }, { status: 401 });
        }
        let parsedConfirm: URL;
        try {
          parsedConfirm = new URL(confirmUrl);
        } catch {
          return NextResponse.json({ error: 'Invalid upload confirm URL' }, { status: 502 });
        }
        const expectedHost = new URL(creds.canvasApiBase).hostname;
        if (parsedConfirm.protocol !== 'https:' || parsedConfirm.hostname !== expectedHost) {
          return NextResponse.json({ error: 'Upload confirm URL host not allowed' }, { status: 502 });
        }
        // Step 3: Confirm the upload with Canvas
        const confirmed = await confirmFileUpload(userId, confirmUrl);
        fileId = confirmed.id;
      } else {
        const body = await uploadRes.text().catch(() => '');
        return NextResponse.json(
          { error: `S3 upload failed with status ${uploadRes.status}`, detail: body },
          { status: 502 }
        );
      }

      // Step 4: Submit assignment with the file ID
      const submissionBody: Record<string, unknown> = {
        submission: { submission_type: 'online_upload', file_ids: [fileId] },
      };
      if (comment) submissionBody.comment = { text_comment: comment };

      const submission = await submitAssignment(userId, courseId, assignmentId, submissionBody);
      return NextResponse.json({ success: true, submission });
    }

    if (submissionType === 'online_text_entry') {
      const body = formData.get('body') as string | null;
      if (!body?.trim()) {
        return NextResponse.json({ error: 'body is required for online_text_entry' }, { status: 400 });
      }
      const submissionBody: Record<string, unknown> = {
        submission: { submission_type: 'online_text_entry', body },
      };
      if (comment) submissionBody.comment = { text_comment: comment };

      const submission = await submitAssignment(userId, courseId, assignmentId, submissionBody);
      return NextResponse.json({ success: true, submission });
    }

    if (submissionType === 'online_url') {
      const url = formData.get('url') as string | null;
      if (!url?.trim()) {
        return NextResponse.json({ error: 'url is required for online_url' }, { status: 400 });
      }
      const submissionBody: Record<string, unknown> = {
        submission: { submission_type: 'online_url', url },
      };
      if (comment) submissionBody.comment = { text_comment: comment };

      const submission = await submitAssignment(userId, courseId, assignmentId, submissionBody);
      return NextResponse.json({ success: true, submission });
    }

    return NextResponse.json({ error: `Unsupported submission_type: ${submissionType}` }, { status: 400 });
  } catch (error) {
    console.error('Submission failed:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Submission failed' },
      { status: 500 }
    );
  }
}
