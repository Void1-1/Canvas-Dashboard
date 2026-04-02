import { NextResponse } from 'next/server';

/** Public endpoint — returns whether OAuth developer key credentials are configured.
 *  Used by the signup page to decide whether to show the OAuth or manual token flow.
 */
export function GET() {
  return NextResponse.json({
    oauthEnabled: !!(process.env.CANVAS_CLIENT_ID && process.env.CANVAS_CLIENT_SECRET),
  });
}
