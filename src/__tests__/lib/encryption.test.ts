import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptCanvasToken,
  decryptCanvasToken,
  isEncryptedCanvasToken,
} from '../../lib/encryption';

describe('encryption', () => {
  describe('isEncryptedCanvasToken', () => {
    it('returns true for tokens with enc: prefix', () => {
      expect(isEncryptedCanvasToken('enc:abc:def:ghi')).toBe(true);
    });

    it('returns false for plain tokens', () => {
      expect(isEncryptedCanvasToken('plaintoken123')).toBe(false);
      expect(isEncryptedCanvasToken('')).toBe(false);
      expect(isEncryptedCanvasToken('Bearer token')).toBe(false);
    });
  });

  describe('encryptCanvasToken', () => {
    it('returns a string starting with enc:', () => {
      const encrypted = encryptCanvasToken('my-canvas-token');
      expect(encrypted).toMatch(/^enc:/);
    });

    it('produces 4 colon-separated parts', () => {
      const encrypted = encryptCanvasToken('test-token');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('enc');
    });

    it('produces different ciphertext on each call (random IV)', () => {
      const token = 'same-token-value';
      const enc1 = encryptCanvasToken(token);
      const enc2 = encryptCanvasToken(token);
      expect(enc1).not.toBe(enc2);
    });

    it('can encrypt empty string', () => {
      const encrypted = encryptCanvasToken('');
      expect(encrypted).toMatch(/^enc:/);
    });

    it('can encrypt a long token', () => {
      const longToken = 'a'.repeat(500);
      const encrypted = encryptCanvasToken(longToken);
      expect(encrypted).toMatch(/^enc:/);
    });
  });

  describe('decryptCanvasToken', () => {
    it('correctly round-trips a token', () => {
      const original = 'canvas-api-token-xyz123';
      const encrypted = encryptCanvasToken(original);
      const decrypted = decryptCanvasToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it('round-trips an empty string', () => {
      const encrypted = encryptCanvasToken('');
      expect(decryptCanvasToken(encrypted)).toBe('');
    });

    it('round-trips special characters', () => {
      const token = 'token~!@#$%^&*()_+-=[]{}|;\':",./<>?';
      const encrypted = encryptCanvasToken(token);
      expect(decryptCanvasToken(encrypted)).toBe(token);
    });

    it('round-trips a long token', () => {
      const longToken = 'x'.repeat(1000);
      const encrypted = encryptCanvasToken(longToken);
      expect(decryptCanvasToken(encrypted)).toBe(longToken);
    });

    it('throws when token is not encrypted (no enc: prefix)', () => {
      expect(() => decryptCanvasToken('plaintoken')).toThrow(
        'Canvas token is not encrypted'
      );
    });

    it('throws on malformed encrypted token (wrong number of parts)', () => {
      expect(() => decryptCanvasToken('enc:only-three-parts')).toThrow(
        'Invalid encrypted Canvas token format'
      );
    });

    it('throws on tampered ciphertext (authentication failure)', () => {
      const encrypted = encryptCanvasToken('original-token');
      const parts = encrypted.split(':');
      // Corrupt the ciphertext (3rd part)
      parts[2] = Buffer.from('tampered-data').toString('base64');
      const tampered = parts.join(':');
      expect(() => decryptCanvasToken(tampered)).toThrow();
    });
  });
});
