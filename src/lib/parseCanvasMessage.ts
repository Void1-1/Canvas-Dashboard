/**
 * Parses a Canvas email-style HTML notification message into structured data.
 *
 * Canvas Message-type activity stream items carry HTML that mirrors the notification
 * email body. This parser strips the HTML, identifies the action type from the plain
 * text, and extracts assignment/course IDs from embedded Canvas URLs.
 *
 * Returns null for unrecognized message formats (caller falls back to raw HTML display).
 */

export type ParsedMessage = {
  action: string;
  title?: string;
  dueText?: string;
  changedToText?: string;
  internalUrl?: string;
  courseId?: number;
  assignmentId?: number;
};

export function parseCanvasMessage(
  htmlMessage: string,
  activityCourseId?: number,
): ParsedMessage | null {
  // Strip HTML tags to plain text
  const text = htmlMessage.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Drop email footer boilerplate after the separator line
  const mainText = text.split(/_{8,}|You received this email because/i)[0].trim();

  let action = '';
  if (/new assignment has been created/i.test(mainText))
    action = 'New Assignment';
  else if (/due date.*changed|assignment due date changed/i.test(mainText))
    action = 'Due Date Changed';
  else if (/assignment.*graded|grade.*posted|score.*updated/i.test(mainText))
    action = 'Grade Posted';
  else if (/submission.*comment|new comment/i.test(mainText))
    action = 'New Comment';
  else if (/assignment.*due|upcoming.*due/i.test(mainText))
    action = 'Assignment Due Reminder';
  else if (/quiz.*submitted|submission.*received/i.test(mainText))
    action = 'Submission Received';
  else
    return null; // unrecognized — caller falls back to default rendering

  // Extract Canvas URL and parse IDs from it
  const urlMatch = mainText.match(/https?:\/\/[^\s]+\/courses\/(\d+)\/assignments\/(\d+)/);
  let courseId: number | undefined = activityCourseId;
  let assignmentId: number | undefined;
  if (urlMatch) {
    courseId = parseInt(urlMatch[1], 10);
    assignmentId = parseInt(urlMatch[2], 10);
  }

  // Extract assignment title — text after "course, CourseName: TITLE" and before "due:" or end
  const titleMatch = mainText.match(
    /[^,]+,\s+[^:]+:\s+(.+?)(?=\s+due:|\s+has changed|\s+Click|\s+https?:|$)/i,
  );
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Extract due date text (for "New Assignment" / "Assignment Due Reminder")
  const dueMatch = mainText.match(/due:\s+([^C\n]+?)(?=\s+Click|\s+https?:|$)/i);
  const dueText = dueMatch ? dueMatch[1].trim() : undefined;

  // Extract new due date (for "Due Date Changed")
  const changedMatch = mainText.match(/has changed to:\s+([^C\n]+?)(?=\s+Click|\s+https?:|$)/i);
  const changedToText = changedMatch ? changedMatch[1].trim() : undefined;

  const internalUrl = courseId ? `/classes/${courseId}` : undefined;

  return { action, title, dueText, changedToText, internalUrl, courseId, assignmentId };
}
