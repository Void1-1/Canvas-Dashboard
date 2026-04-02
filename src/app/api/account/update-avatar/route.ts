import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { initiateAvatarUpload, confirmAvatarUpload, setAvatar, getAvatarOptions } from '@/lib/canvas';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type — only images accepted
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate file size — max 5 MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size must be under 5 MB' }, { status: 400 });
  }

  try {
    // Step 1: Initiate the file upload with Canvas to get the upload URL and params
    const uploadInstructions = await initiateAvatarUpload(
      userId,
      file.name,
      file.size,
      file.type
    );

    if (!uploadInstructions?.upload_url) {
      return NextResponse.json({ error: 'Failed to initiate avatar upload' }, { status: 502 });
    }

    // Step 2: Upload the file to the Canvas-provided upload URL using upload_params
    const uploadForm = new FormData();
    const uploadParams = uploadInstructions.upload_params ?? {};
    for (const [key, value] of Object.entries(uploadParams)) {
      uploadForm.append(key, String(value));
    }
    uploadForm.append('file', file);

    // Canvas returns a redirect (302) to a confirm URL; follow it
    const uploadRes = await fetch(uploadInstructions.upload_url, {
      method: 'POST',
      body: uploadForm,
      redirect: 'follow',
    });

    if (!uploadRes.ok && uploadRes.status !== 201) {
      return NextResponse.json({ error: 'File upload to Canvas failed' }, { status: 502 });
    }

    // The confirm URL is either the final URL after redirect or provided in Location header
    const confirmUrl = uploadRes.url;

    // Step 3: Confirm the upload by POSTing to the confirm URL
    let confirmedFile: any;
    try {
      confirmedFile = await confirmAvatarUpload(userId, confirmUrl);
    } catch {
      // Some Canvas instances confirm automatically on the upload redirect
      confirmedFile = null;
    }

    // Step 4: Fetch avatar options and find the matching token for the uploaded file
    const avatarOptions = await getAvatarOptions(userId);
    const uploadedAvatar = Array.isArray(avatarOptions)
      ? avatarOptions.find(
          (av: any) =>
            av.type === 'attachment' &&
            (confirmedFile?.id
              ? av.id === confirmedFile.id || String(av.url ?? '').includes(String(confirmedFile.id))
              : true)
        ) ?? avatarOptions.find((av: any) => av.type === 'attachment')
      : null;

    if (!uploadedAvatar?.token) {
      return NextResponse.json({ error: 'Could not find uploaded avatar token' }, { status: 502 });
    }

    // Step 5: Set the avatar using the token
    const updated = await setAvatar(userId, uploadedAvatar.token);
    const avatarUrl = updated?.avatar_url ?? uploadedAvatar.url ?? null;

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Avatar upload failed' },
      { status: 500 }
    );
  }
}
