import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getCredentialsWithRefresh } from '@/lib/users';

const ALLOWED_HOSTS_PATTERN = /\.instructure\.com$/;
const FETCH_TIMEOUT_MS = 15000;

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only proxy HTTPS requests to Canvas (*.instructure.com) hosts
  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 403 });
  }
  if (!ALLOWED_HOSTS_PATTERN.test(parsed.hostname)) {
    return NextResponse.json({ error: 'URL host not allowed' }, { status: 403 });
  }

  const creds = await getCredentialsWithRefresh(userId);
  if (!creds) {
    return NextResponse.json({ error: 'User credentials not found' }, { status: 401 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(parsed.href, {
      headers: { Authorization: `Bearer ${creds.canvasApiToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Canvas returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }
}
