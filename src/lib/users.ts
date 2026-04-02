import { getDb } from './db';
import { randomUUID } from 'crypto';
import { decryptCanvasToken, encryptCanvasToken } from './encryption';

export type OAuthStatus = 'manual' | 'pending' | 'active';

export type User = {
  id: string;
  username: string;
  display_name: string | null;
  password_hash: string;
  canvas_api_base: string;
  canvas_api_token: string;
  password_changed_at: number;
  created_at: number;
  oauth_status: OAuthStatus;
  canvas_refresh_token: string | null;
  canvas_token_expires_at: number | null;
  canvas_token_set_at: number | null;
};

export type CreateUserInput = {
  username: string;
  passwordHash: string;
  canvasApiBase: string;
  canvasApiToken: string;
  oauthStatus?: OAuthStatus;
};

export class OAuthPendingError extends Error {
  constructor() {
    super('Canvas OAuth authorization not completed');
    this.name = 'OAuthPendingError';
  }
}

export class OAuthRefreshError extends Error {
  constructor(message?: string) {
    super(message ?? 'Failed to refresh Canvas OAuth token');
    this.name = 'OAuthRefreshError';
  }
}

export function createUser(input: CreateUserInput): User {
  const database = getDb();
  const id = randomUUID();
  const createdAt = Date.now();
  const username = input.username.trim().toLowerCase();
  const canvasApiBase = input.canvasApiBase.replace(/\/$/, '');
  const oauthStatus: OAuthStatus = input.oauthStatus ?? 'manual';
  // Don't encrypt an empty token (pending OAuth users have no token yet)
  const encryptedCanvasToken = input.canvasApiToken
    ? encryptCanvasToken(input.canvasApiToken)
    : '';

  // Only track token age for manual users (OAuth tokens are tracked via canvas_token_expires_at)
  const tokenSetAt = oauthStatus === 'manual' ? createdAt : null;

  database
    .prepare(
      `INSERT INTO users (id, username, password_hash, canvas_api_base, canvas_api_token, oauth_status, password_changed_at, created_at, canvas_token_set_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      username,
      input.passwordHash,
      canvasApiBase,
      encryptedCanvasToken,
      oauthStatus,
      createdAt,
      createdAt,
      tokenSetAt
    );
  return {
    id,
    username,
    display_name: null,
    password_hash: input.passwordHash,
    canvas_api_base: canvasApiBase,
    canvas_api_token: encryptedCanvasToken,
    oauth_status: oauthStatus,
    canvas_refresh_token: null,
    canvas_token_expires_at: null,
    canvas_token_set_at: tokenSetAt,
    password_changed_at: createdAt,
    created_at: createdAt,
  };
}

export function getUserById(id: string): User | null {
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  return row ?? null;
}

export function getUserByUsername(username: string): User | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username.trim().toLowerCase()) as User | undefined;
  return row ?? null;
}

/**
 * @deprecated Use {@link getCredentialsWithRefresh} instead.
 * This sync version does not handle OAuth token refresh and will return
 * an expired token for OAuth users.
 */
export function getCredentials(userId: string): { canvasApiBase: string; canvasApiToken: string } | null {
  const user = getUserById(userId);
  if (!user) return null;
  return {
    canvasApiBase: user.canvas_api_base,
    canvasApiToken: decryptCanvasToken(user.canvas_api_token),
  };
}

/** Async credential fetch with automatic token refresh for OAuth users. */
export async function getCredentialsWithRefresh(
  userId: string
): Promise<{ canvasApiBase: string; canvasApiToken: string } | null> {
  const user = getUserById(userId);
  if (!user) return null;

  // Legacy manual-token path — no refresh needed
  if (!user.oauth_status || user.oauth_status === 'manual') {
    return {
      canvasApiBase: user.canvas_api_base,
      canvasApiToken: decryptCanvasToken(user.canvas_api_token),
    };
  }

  if (user.oauth_status === 'pending') {
    throw new OAuthPendingError();
  }

  // 'active' OAuth path: refresh if token is missing or expires within 5 minutes
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const needsRefresh =
    !user.canvas_api_token ||
    !user.canvas_token_expires_at ||
    Date.now() >= user.canvas_token_expires_at - FIVE_MINUTES_MS;

  if (!needsRefresh) {
    return {
      canvasApiBase: user.canvas_api_base,
      canvasApiToken: decryptCanvasToken(user.canvas_api_token),
    };
  }

  if (!user.canvas_refresh_token) {
    throw new OAuthRefreshError('No refresh token available');
  }

  const refreshToken = decryptCanvasToken(user.canvas_refresh_token);

  let tokenResponse;
  try {
    const { refreshAccessToken } = await import('./oauth');
    tokenResponse = await refreshAccessToken(user.canvas_api_base, refreshToken);
  } catch (e) {
    throw new OAuthRefreshError(e instanceof Error ? e.message : undefined);
  }

  const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
  updateOAuthTokens(userId, {
    accessToken: tokenResponse.access_token,
    // Canvas docs: refresh token is constant; fall back to existing if not returned
    refreshToken: tokenResponse.refresh_token ?? refreshToken,
    expiresAt,
  });

  return {
    canvasApiBase: user.canvas_api_base,
    canvasApiToken: tokenResponse.access_token,
  };
}

export function updateOAuthTokens(
  userId: string,
  {
    accessToken,
    refreshToken,
    expiresAt,
  }: { accessToken: string; refreshToken: string; expiresAt: number }
): void {
  const database = getDb();
  const encryptedAccess = encryptCanvasToken(accessToken);
  const encryptedRefresh = encryptCanvasToken(refreshToken);
  database
    .prepare(
      `UPDATE users SET canvas_api_token = ?, canvas_refresh_token = ?, canvas_token_expires_at = ?, oauth_status = 'active' WHERE id = ?`
    )
    .run(encryptedAccess, encryptedRefresh, expiresAt, userId);
}

export function updateManualCanvasToken(userId: string, newToken: string): void {
  const database = getDb();
  const encrypted = encryptCanvasToken(newToken);
  database
    .prepare('UPDATE users SET canvas_api_token = ?, canvas_token_set_at = ? WHERE id = ?')
    .run(encrypted, Date.now(), userId);
}

export function clearOAuthTokens(userId: string): void {
  const database = getDb();
  database
    .prepare(
      `UPDATE users SET canvas_api_token = '', canvas_refresh_token = NULL, canvas_token_expires_at = NULL, oauth_status = 'pending' WHERE id = ?`
    )
    .run(userId);
}

export function hasAnyUsers(): boolean {
  const database = getDb();
  const row = database.prepare('SELECT 1 FROM users LIMIT 1').get();
  return !!row;
}

/** Returns the 24 most recent password hashes for the user, newest first. */
export function getPasswordHistoryHashes(userId: string): string[] {
  const database = getDb();
  const rows = database
    .prepare(
      'SELECT password_hash FROM user_password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 24'
    )
    .all(userId) as { password_hash: string }[];
  return rows.map((r) => r.password_hash);
}

export function addPasswordToHistory(userId: string, passwordHash: string): void {
  const database = getDb();
  database
    .prepare(
      'INSERT INTO user_password_history (user_id, password_hash, created_at) VALUES (?, ?, ?)'
    )
    .run(userId, passwordHash, Date.now());
}

export function updateUserPassword(userId: string, newPasswordHash: string): void {
  const database = getDb();
  database
    .prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?')
    .run(newPasswordHash, Date.now(), userId);
}

export function addLoginHistory(userId: string, ip: string): void {
  const database = getDb();
  database
    .prepare('INSERT INTO user_login_history (user_id, ip, timestamp) VALUES (?, ?, ?)')
    .run(userId, ip, Date.now());
  // Keep only the last 20 logins per user
  database
    .prepare(
      `DELETE FROM user_login_history WHERE user_id = ? AND id NOT IN (
        SELECT id FROM user_login_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20
      )`
    )
    .run(userId, userId);
}

export function getLoginHistory(userId: string): { ip: string; timestamp: number }[] {
  const database = getDb();
  return database
    .prepare(
      'SELECT ip, timestamp FROM user_login_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10'
    )
    .all(userId) as { ip: string; timestamp: number }[];
}

export function updateDisplayName(userId: string, displayName: string | null): void {
  const database = getDb();
  const trimmed = displayName?.trim() || null;
  database.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(trimmed, userId);
}

export function deleteUser(userId: string): void {
  const database = getDb();
  const del = database.transaction(() => {
    database.prepare('DELETE FROM user_login_history WHERE user_id = ?').run(userId);
    database.prepare('DELETE FROM user_password_history WHERE user_id = ?').run(userId);
    database.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  del();
}
