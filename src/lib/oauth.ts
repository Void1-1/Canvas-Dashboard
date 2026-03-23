import crypto from 'crypto';
import { encryptCanvasToken, decryptCanvasToken } from './encryption';

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.CANVAS_CLIENT_ID;
  const clientSecret = process.env.CANVAS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'CANVAS_CLIENT_ID and CANVAS_CLIENT_SECRET must be set for Canvas OAuth2.'
    );
  }
  return { clientId, clientSecret };
}

/** Returns true when OAuth developer key credentials are configured. */
export function isOAuthEnabled(): boolean {
  return !!(process.env.CANVAS_CLIENT_ID && process.env.CANVAS_CLIENT_SECRET);
}

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/oauth/callback`;
}

function canvasDomain(canvasApiBase: string): string {
  return canvasApiBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function buildAuthorizationUrl(canvasApiBase: string, state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
    redirect_uri: getRedirectUri(),
  });
  return `${canvasDomain(canvasApiBase)}/login/oauth2/auth?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: { id: number; name: string };
};

async function postToken(
  canvasApiBase: string,
  body: Record<string, string>
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  const res = await fetch(`${canvasDomain(canvasApiBase)}/login/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...body,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Canvas token endpoint returned ${res.status}`);
  }
  return res.json();
}

export async function exchangeCodeForTokens(
  canvasApiBase: string,
  code: string
): Promise<TokenResponse> {
  return postToken(canvasApiBase, {
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri(),
    code,
  });
}

export async function refreshAccessToken(
  canvasApiBase: string,
  refreshToken: string
): Promise<TokenResponse> {
  return postToken(canvasApiBase, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

export async function revokeToken(canvasApiBase: string, token: string): Promise<void> {
  const { clientId, clientSecret } = getClientCredentials();
  try {
    await fetch(`${canvasDomain(canvasApiBase)}/login/oauth2/token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token,
      }).toString(),
    });
  } catch {
    // Best-effort; ignore errors
  }
}

// ---------------------------------------------------------------------------
// State cookie — carries CSRF state + user identity through the OAuth redirect
// ---------------------------------------------------------------------------

/** Pending signup data carried in the state cookie for new users. */
export type PendingSignup = {
  username: string;
  passwordHash: string;
  canvasApiBase: string;
};

/**
 * State cookie payload. Exactly one of `userId` (existing user re-authorizing)
 * or `pendingSignup` (new user, no DB record yet) must be present.
 */
export type OAuthStateCookiePayload = {
  state: string;
  canvasApiBase: string;
  expiresAt: number;
} & ({ userId: string; pendingSignup?: never } | { userId?: never; pendingSignup: PendingSignup });

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function buildOAuthStateCookie(payload: OAuthStateCookiePayload): string {
  return encryptCanvasToken(JSON.stringify(payload));
}

export function parseOAuthStateCookie(value: string): OAuthStateCookiePayload | null {
  try {
    const json = decryptCanvasToken(value);
    return JSON.parse(json) as OAuthStateCookiePayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pending-signup cookie — temporarily holds validated user data between the
// signup form submission and the OAuth authorize redirect, so no DB record is
// written until Canvas confirms the authorization.
// ---------------------------------------------------------------------------

export type PendingSignupCookiePayload = PendingSignup & { expiresAt: number };

export function buildPendingSignupCookie(payload: PendingSignupCookiePayload): string {
  return encryptCanvasToken(JSON.stringify(payload));
}

export function parsePendingSignupCookie(value: string): PendingSignupCookiePayload | null {
  try {
    const json = decryptCanvasToken(value);
    return JSON.parse(json) as PendingSignupCookiePayload;
  } catch {
    return null;
  }
}
