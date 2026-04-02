import { describe, it, expect } from 'vitest';
import { parseCanvasMessage } from '../../lib/parseCanvasMessage';

// Helpers to build realistic Canvas email-style message bodies

function newAssignmentMsg(
  courseName = 'Intro to CS',
  title = 'Lab 3: Sorting',
  due = 'Jan 15 at 11:59pm',
  courseId = 100,
  assignmentId = 999,
) {
  return `<p>A new assignment has been created: ${courseName}, ${courseName}: ${title} due: ${due} Click here to view the assignment: https://school.instructure.com/courses/${courseId}/assignments/${assignmentId}</p>`;
}

function dueDateChangedMsg(
  courseName = 'Calc II',
  title = 'Homework 5',
  newDue = 'Feb 2 at 11:59pm',
  courseId = 200,
  assignmentId = 888,
) {
  return `<p>The due date for ${courseName}, ${courseName}: ${title} has changed to: ${newDue} Click here: https://school.instructure.com/courses/${courseId}/assignments/${assignmentId}</p>`;
}

describe('parseCanvasMessage', () => {
  describe('action detection', () => {
    it('detects New Assignment', () => {
      const result = parseCanvasMessage(newAssignmentMsg());
      expect(result?.action).toBe('New Assignment');
    });

    it('detects Due Date Changed', () => {
      const result = parseCanvasMessage(dueDateChangedMsg());
      expect(result?.action).toBe('Due Date Changed');
    });

    it('detects Grade Posted', () => {
      const html = '<p>Your assignment has been graded. Score: 95/100.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('Grade Posted');
    });

    it('detects Grade Posted via "grade posted" phrase', () => {
      const html = '<p>A grade has been posted for your submission.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('Grade Posted');
    });

    it('detects New Comment', () => {
      const html = '<p>A new comment has been posted on your submission for Lab 2.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('New Comment');
    });

    it('detects Assignment Due Reminder', () => {
      const html = '<p>Reminder: your assignment is due tomorrow. Click to view.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('Assignment Due Reminder');
    });

    it('detects Submission Received', () => {
      const html = '<p>Your submission has been received for Quiz 1.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('Submission Received');
    });

    it('returns null for unrecognized message', () => {
      const html = '<p>Welcome to the course! Please review the syllabus.</p>';
      expect(parseCanvasMessage(html)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseCanvasMessage('')).toBeNull();
    });
  });

  describe('ID extraction from URL', () => {
    it('extracts courseId and assignmentId from embedded Canvas URL', () => {
      const result = parseCanvasMessage(newAssignmentMsg('CS101', 'HW1', 'Mar 1', 123, 456));
      expect(result?.courseId).toBe(123);
      expect(result?.assignmentId).toBe(456);
    });

    it('URL courseId takes precedence over activityCourseId', () => {
      const html = `<p>A new assignment has been created. https://school.instructure.com/courses/500/assignments/600</p>`;
      const result = parseCanvasMessage(html, 999);
      expect(result?.courseId).toBe(500);
      expect(result?.assignmentId).toBe(600);
    });

    it('falls back to activityCourseId when no URL is present', () => {
      const html = '<p>A new assignment has been created in your course.</p>';
      const result = parseCanvasMessage(html, 42);
      expect(result?.courseId).toBe(42);
      expect(result?.assignmentId).toBeUndefined();
    });

    it('leaves courseId undefined when no URL and no activityCourseId', () => {
      const html = '<p>A new assignment has been created in your course.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.courseId).toBeUndefined();
      expect(result?.assignmentId).toBeUndefined();
    });
  });

  describe('internalUrl', () => {
    it('builds internalUrl from courseId', () => {
      const result = parseCanvasMessage(newAssignmentMsg('CS', 'HW', 'Mar 1', 77, 88));
      expect(result?.internalUrl).toBe('/classes/77');
    });

    it('internalUrl is undefined when courseId is unknown', () => {
      const html = '<p>A new assignment has been created in your course.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.internalUrl).toBeUndefined();
    });
  });

  describe('due date extraction', () => {
    it('extracts dueText from New Assignment message', () => {
      const result = parseCanvasMessage(
        newAssignmentMsg('CS', 'Lab', 'Apr 10 at 11:59pm', 1, 2),
      );
      expect(result?.dueText).toBe('Apr 10 at 11:59pm');
    });

    it('extracts changedToText from Due Date Changed message', () => {
      const result = parseCanvasMessage(
        dueDateChangedMsg('CS', 'HW', 'May 5 at 9:00am', 1, 2),
      );
      expect(result?.changedToText).toBe('May 5 at 9:00am');
    });

    it('dueText is undefined when not present in message', () => {
      const html = '<p>Your assignment has been graded. Score: 90.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.dueText).toBeUndefined();
    });
  });

  describe('HTML stripping', () => {
    it('strips HTML tags before parsing', () => {
      const html = '<p><strong>A new assignment has been created</strong> in <em>CS101</em>.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('New Assignment');
    });

    it('drops email footer boilerplate after underscore separator', () => {
      const html =
        '<p>A new assignment has been created.</p>________<p>You received this email because you are enrolled.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('New Assignment');
    });

    it('drops content after "You received this email because"', () => {
      const html =
        '<p>A new assignment has been created.</p><p>You received this email because you are enrolled.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('New Assignment');
    });
  });

  describe('case insensitivity', () => {
    it('matches action keywords case-insensitively', () => {
      const html = '<p>NEW ASSIGNMENT HAS BEEN CREATED in your course.</p>';
      const result = parseCanvasMessage(html);
      expect(result?.action).toBe('New Assignment');
    });
  });
});
