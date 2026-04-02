import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionEdge, signSessionEdge } from '@/lib/auth-edge';

const SESSION_COOKIE_NAME = 'canvas-dashboard-session';
// /api/oauth covers all OAuth sub-routes; each enforces its own auth internally.
const PUBLIC_PATHS = ['/login', '/signup', '/api/login', '/api/signup', '/api/first-time', '/api/oauth'];

const SESSION_ABSOLUTE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)
const SESSION_IDLE_TIMEOUT = 60 * 60 * 24;          // 24 hours (seconds)
const REFRESH_THRESHOLD = 60 * 60;                  // 1 hour (seconds)

// Valid child routes for /classes/[id]/
const VALID_CLASS_ROUTES = ['', 'announcements', 'assignments', 'grades', 'modules', 'people'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internal routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Skip sliding session refresh for routes that manage cookies explicitly
  if (pathname === '/api/login' || pathname === '/api/logout') {
    const res = NextResponse.next();
    res.headers.set('x-pathname', pathname);
    return res;
  }

  // Verify JWT validity and enforce session timeouts for all protected routes
  const decoded = await verifySessionEdge(token);
  if (!decoded) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const origIat = decoded.origIat ?? decoded.iat;
  const idleAge = nowSec - decoded.iat;
  const absoluteAge = nowSec - origIat;

  if (idleAge > SESSION_IDLE_TIMEOUT || absoluteAge > SESSION_ABSOLUTE_MAX_AGE) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Set x-pathname header for server components
  const res = NextResponse.next();
  res.headers.set('x-pathname', pathname);

  // Sliding session refresh (all protected routes, including page navigations)
  if (idleAge > REFRESH_THRESHOLD && decoded.sub) {
    const newToken = await signSessionEdge(decoded.sub, origIat);
    res.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_ABSOLUTE_MAX_AGE,
    });
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)|.*not-found).*)'],
};