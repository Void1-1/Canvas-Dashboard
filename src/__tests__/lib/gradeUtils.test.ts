import { describe, it, expect } from 'vitest';
import { getLetterGrade, getGradeColor } from '../../lib/gradeUtils';

describe('gradeUtils', () => {
  describe('getLetterGrade', () => {
    it('returns A for scores 93 and above', () => {
      expect(getLetterGrade(100)).toBe('A');
      expect(getLetterGrade(93)).toBe('A');
      expect(getLetterGrade(99.9)).toBe('A');
    });

    it('returns A- for scores 90–92', () => {
      expect(getLetterGrade(90)).toBe('A-');
      expect(getLetterGrade(92)).toBe('A-');
      expect(getLetterGrade(92.9)).toBe('A-');
    });

    it('returns B+ for scores 87–89', () => {
      expect(getLetterGrade(87)).toBe('B+');
      expect(getLetterGrade(89)).toBe('B+');
      expect(getLetterGrade(88.5)).toBe('B+');
    });

    it('returns B for scores 83–86', () => {
      expect(getLetterGrade(83)).toBe('B');
      expect(getLetterGrade(86)).toBe('B');
      expect(getLetterGrade(84.5)).toBe('B');
    });

    it('returns B- for scores 80–82', () => {
      expect(getLetterGrade(80)).toBe('B-');
      expect(getLetterGrade(82)).toBe('B-');
      expect(getLetterGrade(81.1)).toBe('B-');
    });

    it('returns C+ for scores 77–79', () => {
      expect(getLetterGrade(77)).toBe('C+');
      expect(getLetterGrade(79)).toBe('C+');
    });

    it('returns C for scores 73–76', () => {
      expect(getLetterGrade(73)).toBe('C');
      expect(getLetterGrade(76)).toBe('C');
    });

    it('returns C- for scores 70–72', () => {
      expect(getLetterGrade(70)).toBe('C-');
      expect(getLetterGrade(72)).toBe('C-');
    });

    it('returns D+ for scores 67–69', () => {
      expect(getLetterGrade(67)).toBe('D+');
      expect(getLetterGrade(69)).toBe('D+');
    });

    it('returns D for scores 60–66', () => {
      expect(getLetterGrade(60)).toBe('D');
      expect(getLetterGrade(66)).toBe('D');
    });

    it('returns F for scores below 60', () => {
      expect(getLetterGrade(59)).toBe('F');
      expect(getLetterGrade(0)).toBe('F');
      expect(getLetterGrade(-5)).toBe('F');
    });

    it('returns correct grade at every boundary', () => {
      const boundaries: [number, string][] = [
        [93, 'A'],
        [90, 'A-'],
        [87, 'B+'],
        [83, 'B'],
        [80, 'B-'],
        [77, 'C+'],
        [73, 'C'],
        [70, 'C-'],
        [67, 'D+'],
        [60, 'D'],
        [59, 'F'],
      ];
      for (const [score, expected] of boundaries) {
        expect(getLetterGrade(score), `score ${score}`).toBe(expected);
      }
    });
  });

  describe('getGradeColor', () => {
    it('returns green (#22c55e) for scores 90 and above', () => {
      expect(getGradeColor(90)).toBe('#22c55e');
      expect(getGradeColor(100)).toBe('#22c55e');
      expect(getGradeColor(95)).toBe('#22c55e');
    });

    it('returns lime (#84cc16) for scores 80–89', () => {
      expect(getGradeColor(80)).toBe('#84cc16');
      expect(getGradeColor(89)).toBe('#84cc16');
      expect(getGradeColor(85)).toBe('#84cc16');
    });

    it('returns amber (#f59e0b) for scores 70–79', () => {
      expect(getGradeColor(70)).toBe('#f59e0b');
      expect(getGradeColor(79)).toBe('#f59e0b');
      expect(getGradeColor(75)).toBe('#f59e0b');
    });

    it('returns orange (#f97316) for scores 60–69', () => {
      expect(getGradeColor(60)).toBe('#f97316');
      expect(getGradeColor(69)).toBe('#f97316');
      expect(getGradeColor(65)).toBe('#f97316');
    });

    it('returns red (#ef4444) for scores below 60', () => {
      expect(getGradeColor(59)).toBe('#ef4444');
      expect(getGradeColor(0)).toBe('#ef4444');
      expect(getGradeColor(-1)).toBe('#ef4444');
    });

    it('returns correct color at every boundary', () => {
      const boundaries: [number, string][] = [
        [90, '#22c55e'],
        [80, '#84cc16'],
        [70, '#f59e0b'],
        [60, '#f97316'],
        [59, '#ef4444'],
      ];
      for (const [score, expected] of boundaries) {
        expect(getGradeColor(score), `score ${score}`).toBe(expected);
      }
    });
  });
});
