import { describe, it, expect } from 'vitest';
import { loadDoneIds, saveDoneIds, ASSIGNMENT_DONE_KEY } from '../../lib/assignmentDoneState';

// Tests run in Node environment where `window` is undefined.
// The functions are designed to handle this gracefully.

describe('assignmentDoneState', () => {
  describe('ASSIGNMENT_DONE_KEY', () => {
    it('is a non-empty string constant', () => {
      expect(typeof ASSIGNMENT_DONE_KEY).toBe('string');
      expect(ASSIGNMENT_DONE_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('loadDoneIds (server/SSR — window undefined)', () => {
    it('returns an empty Set when window is undefined', () => {
      // In the test environment, typeof window === 'undefined'
      const result = loadDoneIds();
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('returns a Set (not null or undefined)', () => {
      const result = loadDoneIds();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });
  });

  describe('saveDoneIds (server/SSR — window undefined)', () => {
    it('does not throw when called in a non-browser environment', () => {
      expect(() => saveDoneIds(new Set(['id-1', 'id-2']))).not.toThrow();
    });

    it('does not throw for an empty Set', () => {
      expect(() => saveDoneIds(new Set())).not.toThrow();
    });

    it('does not throw for a large Set', () => {
      const largeSet = new Set(Array.from({ length: 1000 }, (_, i) => `assignment-${i}`));
      expect(() => saveDoneIds(largeSet)).not.toThrow();
    });
  });
});
