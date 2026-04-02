import { describe, it, expect } from 'vitest';
import { checkPasswordPolicy } from '../../lib/passwordPolicy';

describe('checkPasswordPolicy', () => {
  describe('minimum length', () => {
    it('rejects passwords shorter than 12 characters', () => {
      const result = checkPasswordPolicy('short');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/12 characters/);
      }
    });

    it('rejects exactly 11 characters', () => {
      expect(checkPasswordPolicy('11charpaswd').ok).toBe(false);
    });

    it('accepts exactly 12 characters', () => {
      expect(checkPasswordPolicy('12charpasswrd').ok).toBe(true);
    });

    it('accepts passwords longer than 12 characters', () => {
      expect(checkPasswordPolicy('a-very-long-unique-password-123').ok).toBe(true);
    });

    it('rejects empty string', () => {
      expect(checkPasswordPolicy('').ok).toBe(false);
    });
  });

  describe('common password rejection', () => {
    it('rejects "password" as common (even when padded to 12+ chars)', () => {
      // 'password123' is in the common list
      const result = checkPasswordPolicy('password123');
      expect(result.ok).toBe(false);
    });

    it('rejects "Password123" (case-insensitive match)', () => {
      const result = checkPasswordPolicy('Password123');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/too common/);
      }
    });

    it('rejects "qwerty123" as common', () => {
      expect(checkPasswordPolicy('qwerty123').ok).toBe(false);
    });

    it('rejects "admin123" as common', () => {
      expect(checkPasswordPolicy('admin123').ok).toBe(false);
    });

    it('rejects "changeme123" as common', () => {
      expect(checkPasswordPolicy('changeme123').ok).toBe(false);
    });
  });

  describe('valid passwords', () => {
    it('accepts a strong unique password', () => {
      expect(checkPasswordPolicy('Xk9#mP2$vLqN').ok).toBe(true);
    });

    it('accepts a long passphrase', () => {
      expect(checkPasswordPolicy('correct horse battery staple').ok).toBe(true);
    });

    it('accepts passwords with special characters', () => {
      expect(checkPasswordPolicy('Tr0ub4dor&3_secure').ok).toBe(true);
    });
  });

  describe('return type', () => {
    it('returns { ok: true } for valid passwords', () => {
      const result = checkPasswordPolicy('uniqueAndLong123!');
      expect(result).toEqual({ ok: true });
    });

    it('returns { ok: false, reason: string } for invalid passwords', () => {
      const result = checkPasswordPolicy('short');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(typeof result.reason).toBe('string');
        expect(result.reason.length).toBeGreaterThan(0);
      }
    });
  });
});
