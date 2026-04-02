import { describe, it, expect } from 'vitest';
import { verifySessionEdge, signSessionEdge } from '../../lib/auth-edge';

// JWT_SECRET is set in vitest.config.ts

describe('auth-edge', () => {
  describe('signSessionEdge', () => {
    it('returns a JWT string with three dot-separated parts', async () => {
      const token = await signSessionEdge('user-123');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('encodes the userId as the sub claim', async () => {
      const token = await signSessionEdge('user-abc');
      const payload = await verifySessionEdge(token);
      expect(payload?.sub).toBe('user-abc');
    });

    it('sets origIat to current time when not provided', async () => {
      const before = Math.floor(Date.now() / 1000);
      const token = await signSessionEdge('user-time-test');
      const after = Math.floor(Date.now() / 1000);
      const payload = await verifySessionEdge(token);
      expect(payload?.origIat).toBeGreaterThanOrEqual(before);
      expect(payload?.origIat).toBeLessThanOrEqual(after);
    });

    it('uses provided origIat when passed', async () => {
      const origIat = 1700000000;
      const token = await signSessionEdge('user-origiat', origIat);
      const payload = await verifySessionEdge(token);
      expect(payload?.origIat).toBe(origIat);
    });

    it('includes a unique jti per token', async () => {
      const token1 = await signSessionEdge('user-jti');
      const token2 = await signSessionEdge('user-jti');
      const p1 = await verifySessionEdge(token1);
      const p2 = await verifySessionEdge(token2);
      expect(p1?.jti).toBeTruthy();
      expect(p2?.jti).toBeTruthy();
      expect(p1?.jti).not.toBe(p2?.jti);
    });

    it('sets iat to approximately now', async () => {
      const before = Math.floor(Date.now() / 1000);
      const token = await signSessionEdge('user-iat');
      const after = Math.floor(Date.now() / 1000);
      const payload = await verifySessionEdge(token);
      expect(payload?.iat).toBeGreaterThanOrEqual(before);
      expect(payload?.iat).toBeLessThanOrEqual(after);
    });
  });

  describe('verifySessionEdge', () => {
    it('returns payload for a valid token', async () => {
      const token = await signSessionEdge('user-verify');
      const payload = await verifySessionEdge(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-verify');
    });

    it('returns null for a completely invalid string', async () => {
      const result = await verifySessionEdge('not.a.valid.token');
      expect(result).toBeNull();
    });

    it('returns null for an empty string', async () => {
      const result = await verifySessionEdge('');
      expect(result).toBeNull();
    });

    it('returns null for a tampered token', async () => {
      const token = await signSessionEdge('user-tamper');
      const parts = token.split('.');
      parts[1] = Buffer.from('{"sub":"hacker","iat":0}').toString('base64url');
      const result = await verifySessionEdge(parts.join('.'));
      expect(result).toBeNull();
    });

    it('returns payload with sub and iat fields', async () => {
      const token = await signSessionEdge('user-fields');
      const payload = await verifySessionEdge(token);
      expect(typeof payload?.sub).toBe('string');
      expect(typeof payload?.iat).toBe('number');
    });
  });
});
