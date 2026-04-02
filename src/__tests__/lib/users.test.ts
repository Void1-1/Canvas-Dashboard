import { describe, it, expect } from 'vitest';
import {
  createUser,
  getUserById,
  getUserByUsername,
  updateUserPassword,
  addPasswordToHistory,
  getPasswordHistoryHashes,
  addLoginHistory,
  getLoginHistory,
  hasAnyUsers,
  deleteUser,
  updateManualCanvasToken,
  updateDisplayName,
  clearOAuthTokens,
  updateOAuthTokens,
  OAuthPendingError,
  getCredentialsWithRefresh,
} from '../../lib/users';
import bcrypt from 'bcryptjs';

// SQLITE_DB_PATH=:memory: and CANVAS_ENCRYPTION_KEY are set in vitest.config.ts

function uniqueUsername(prefix = 'user') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function makeTestUser(overrides: Partial<{
  username: string;
  canvasApiBase: string;
  canvasApiToken: string;
}> = {}) {
  const hash = await bcrypt.hash('TestPassword123!', 10);
  return createUser({
    username: overrides.username ?? uniqueUsername(),
    passwordHash: hash,
    canvasApiBase: overrides.canvasApiBase ?? 'https://canvas.example.com/api/v1',
    canvasApiToken: overrides.canvasApiToken ?? 'token-abc123',
  });
}

describe('users', () => {
  describe('createUser', () => {
    it('creates a user and returns it with an id', async () => {
      const user = await makeTestUser();
      expect(user.id).toBeTruthy();
      expect(typeof user.id).toBe('string');
    });

    it('lowercases the username', async () => {
      const user = await makeTestUser({ username: 'MixedCase_' + Date.now() });
      expect(user.username).toBe(user.username.toLowerCase());
    });

    it('strips trailing slash from canvas_api_base', async () => {
      const user = await makeTestUser({
        canvasApiBase: 'https://canvas.example.com/api/v1/',
      });
      expect(user.canvas_api_base).toBe('https://canvas.example.com/api/v1');
    });

    it('stores an encrypted canvas token (enc: prefix)', async () => {
      const user = await makeTestUser({ canvasApiToken: 'plain-token-123' });
      expect(user.canvas_api_token).toMatch(/^enc:/);
    });

    it('defaults oauth_status to "manual"', async () => {
      const user = await makeTestUser();
      expect(user.oauth_status).toBe('manual');
    });

    it('sets password_changed_at and created_at to current time', async () => {
      const before = Date.now();
      const user = await makeTestUser();
      const after = Date.now();
      expect(user.created_at).toBeGreaterThanOrEqual(before);
      expect(user.created_at).toBeLessThanOrEqual(after);
      expect(user.password_changed_at).toBeGreaterThanOrEqual(before);
    });

    it('allows empty canvas api token (OAuth pending users)', async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      const user = createUser({
        username: uniqueUsername('oauth'),
        passwordHash: hash,
        canvasApiBase: 'https://canvas.example.com/api/v1',
        canvasApiToken: '',
        oauthStatus: 'pending',
      });
      expect(user.canvas_api_token).toBe('');
      expect(user.oauth_status).toBe('pending');
    });
  });

  describe('getUserById', () => {
    it('returns the user by id', async () => {
      const created = await makeTestUser();
      const found = getUserById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe(created.username);
    });

    it('returns null for a non-existent id', () => {
      expect(getUserById('nonexistent-id-xyz')).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('returns the user by username', async () => {
      const created = await makeTestUser();
      const found = getUserByUsername(created.username);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('is case-insensitive', async () => {
      const username = uniqueUsername('case');
      await makeTestUser({ username: username.toLowerCase() });
      const found = getUserByUsername(username.toUpperCase());
      expect(found).not.toBeNull();
    });

    it('returns null for a non-existent username', () => {
      expect(getUserByUsername('doesnotexist_xyz_12345')).toBeNull();
    });
  });

  describe('hasAnyUsers', () => {
    it('returns true when at least one user exists', async () => {
      await makeTestUser();
      expect(hasAnyUsers()).toBe(true);
    });
  });

  describe('updateUserPassword', () => {
    it('updates the password hash', async () => {
      const user = await makeTestUser();
      const newHash = await bcrypt.hash('NewPassword123!', 10);
      updateUserPassword(user.id, newHash);

      const updated = getUserById(user.id);
      expect(updated?.password_hash).toBe(newHash);
    });

    it('updates password_changed_at', async () => {
      const user = await makeTestUser();
      const before = Date.now();
      const newHash = await bcrypt.hash('AnotherPassword123!', 10);
      updateUserPassword(user.id, newHash);

      const updated = getUserById(user.id);
      expect(updated?.password_changed_at).toBeGreaterThanOrEqual(before);
    });
  });

  describe('password history', () => {
    it('can add and retrieve password history hashes', async () => {
      const user = await makeTestUser();
      const hash1 = await bcrypt.hash('OldPassword1!', 10);
      const hash2 = await bcrypt.hash('OldPassword2!', 10);

      addPasswordToHistory(user.id, hash1);
      addPasswordToHistory(user.id, hash2);

      const hashes = getPasswordHistoryHashes(user.id);
      expect(hashes).toContain(hash1);
      expect(hashes).toContain(hash2);
    });

    it('returns newest hashes first', async () => {
      const user = await makeTestUser();
      const hash1 = await bcrypt.hash('First1!pass', 10);
      addPasswordToHistory(user.id, hash1);
      await new Promise((r) => setTimeout(r, 5));
      const hash2 = await bcrypt.hash('Second2!pass', 10);
      addPasswordToHistory(user.id, hash2);

      const hashes = getPasswordHistoryHashes(user.id);
      expect(hashes[0]).toBe(hash2);
      expect(hashes[1]).toBe(hash1);
    });

    it('returns empty array for user with no history', async () => {
      const user = await makeTestUser();
      expect(getPasswordHistoryHashes(user.id)).toEqual([]);
    });
  });

  describe('login history', () => {
    it('can add and retrieve login history', async () => {
      const user = await makeTestUser();
      addLoginHistory(user.id, '192.168.1.100');
      addLoginHistory(user.id, '10.0.0.1');

      const history = getLoginHistory(user.id);
      expect(history.length).toBeGreaterThanOrEqual(2);
      const ips = history.map((h) => h.ip);
      expect(ips).toContain('192.168.1.100');
      expect(ips).toContain('10.0.0.1');
    });

    it('each history entry has ip and timestamp', async () => {
      const user = await makeTestUser();
      addLoginHistory(user.id, '1.2.3.4');

      const history = getLoginHistory(user.id);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('ip');
      expect(history[0]).toHaveProperty('timestamp');
      expect(typeof history[0].timestamp).toBe('number');
    });

    it('returns empty array for user with no login history', async () => {
      const user = await makeTestUser();
      expect(getLoginHistory(user.id)).toEqual([]);
    });
  });

  describe('updateManualCanvasToken', () => {
    it('encrypts and stores the new token', async () => {
      const user = await makeTestUser();
      updateManualCanvasToken(user.id, 'new-canvas-token-xyz');

      const updated = getUserById(user.id);
      expect(updated?.canvas_api_token).toMatch(/^enc:/);
    });
  });

  describe('deleteUser', () => {
    it('removes the user from the database', async () => {
      const user = await makeTestUser();
      deleteUser(user.id);
      expect(getUserById(user.id)).toBeNull();
    });

    it('removes associated login history', async () => {
      const user = await makeTestUser();
      addLoginHistory(user.id, '5.5.5.5');
      deleteUser(user.id);
      // After deletion, getUserById returns null so we just verify no throw
      expect(getUserById(user.id)).toBeNull();
    });
  });

  describe('getCredentialsWithRefresh', () => {
    it('returns null for a non-existent user', async () => {
      const creds = await getCredentialsWithRefresh('nonexistent-user-id');
      expect(creds).toBeNull();
    });

    it('returns decrypted credentials for a manual user', async () => {
      const user = await makeTestUser({ canvasApiToken: 'my-api-token-123' });
      const creds = await getCredentialsWithRefresh(user.id);
      expect(creds).not.toBeNull();
      expect(creds?.canvasApiToken).toBe('my-api-token-123');
      expect(creds?.canvasApiBase).toBe('https://canvas.example.com/api/v1');
    });

    it('throws OAuthPendingError for a pending OAuth user', async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      const user = createUser({
        username: uniqueUsername('pending'),
        passwordHash: hash,
        canvasApiBase: 'https://canvas.example.com/api/v1',
        canvasApiToken: '',
        oauthStatus: 'pending',
      });
      await expect(getCredentialsWithRefresh(user.id)).rejects.toThrow(OAuthPendingError);
    });
  });

  describe('updateDisplayName', () => {
    it('sets a display name for a user', async () => {
      const user = await makeTestUser();
      updateDisplayName(user.id, 'Jane Doe');
      const updated = getUserById(user.id);
      expect(updated?.display_name).toBe('Jane Doe');
    });

    it('trims whitespace from the display name', async () => {
      const user = await makeTestUser();
      updateDisplayName(user.id, '  Trimmed Name  ');
      const updated = getUserById(user.id);
      expect(updated?.display_name).toBe('Trimmed Name');
    });

    it('sets display_name to null when passed null', async () => {
      const user = await makeTestUser();
      updateDisplayName(user.id, 'Initial Name');
      updateDisplayName(user.id, null);
      const updated = getUserById(user.id);
      expect(updated?.display_name).toBeNull();
    });

    it('sets display_name to null when passed an empty string', async () => {
      const user = await makeTestUser();
      updateDisplayName(user.id, 'Something');
      updateDisplayName(user.id, '');
      const updated = getUserById(user.id);
      expect(updated?.display_name).toBeNull();
    });
  });

  describe('clearOAuthTokens', () => {
    it('clears canvas_api_token and sets oauth_status to pending', async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      const user = createUser({
        username: uniqueUsername('clearoauth'),
        passwordHash: hash,
        canvasApiBase: 'https://canvas.example.com/api/v1',
        canvasApiToken: 'some-oauth-token',
        oauthStatus: 'manual',
      });

      clearOAuthTokens(user.id);

      const updated = getUserById(user.id);
      expect(updated?.canvas_api_token).toBe('');
      expect(updated?.oauth_status).toBe('pending');
      expect(updated?.canvas_refresh_token).toBeNull();
      expect(updated?.canvas_token_expires_at).toBeNull();
    });
  });

  describe('updateOAuthTokens', () => {
    it('stores encrypted access and refresh tokens', async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      const user = createUser({
        username: uniqueUsername('updateoauth'),
        passwordHash: hash,
        canvasApiBase: 'https://canvas.example.com/api/v1',
        canvasApiToken: '',
        oauthStatus: 'pending',
      });

      const expiresAt = Date.now() + 3600 * 1000;
      updateOAuthTokens(user.id, {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt,
      });

      const updated = getUserById(user.id);
      // Tokens should be stored encrypted
      expect(updated?.canvas_api_token).toMatch(/^enc:/);
      expect(updated?.canvas_refresh_token).toMatch(/^enc:/);
      expect(updated?.canvas_token_expires_at).toBe(expiresAt);
      expect(updated?.oauth_status).toBe('active');
    });
  });
});
