import { cache } from 'react';
import { getCredentialsWithRefresh } from './users';

const FETCH_TIMEOUT_MS = 20000;

type Credentials = { canvasApiBase: string; canvasApiToken: string };
type FetchOptions = RequestInit & { next?: { revalidate: number } };

/**
 * Validates that a full URL (used when endpoint starts with 'http') has the
 * same hostname as the user's registered Canvas API base, preventing SSRF via
 * API-response URLs (pagination Link headers, upload confirm URLs, etc.).
 */
function validateEndpointUrl(endpoint: string, canvasApiBase: string): void {
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new Error('Invalid endpoint URL');
  }
  if (endpointUrl.protocol !== 'https:') {
    throw new Error('Canvas endpoint URL must use HTTPS');
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(canvasApiBase);
  } catch {
    throw new Error('Invalid Canvas API base URL');
  }
  if (endpointUrl.hostname !== baseUrl.hostname) {
    throw new Error(`Canvas endpoint host mismatch: expected ${baseUrl.hostname}`);
  }
}

async function fetchCanvasWithCreds<T>(
  creds: Credentials,
  endpoint: string,
  init: FetchOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const base = creds.canvasApiBase.replace(/\/$/, '');
  if (endpoint.startsWith('http')) {
    validateEndpointUrl(endpoint, creds.canvasApiBase);
  }
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
  const { headers: extraHeaders, ...restInit } = init;
  const res = await fetch(url, {
    next: { revalidate: 60 },
    ...restInit,
    headers: {
      Authorization: `Bearer ${creds.canvasApiToken}`,
      ...(extraHeaders as Record<string, string> | undefined),
    },
    signal: init.signal ?? controller.signal,
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    if (res.status === 404 || res.status === 403 || res.status === 400) {
      // @ts-ignore
      return [];
    }
    throw new Error(`Canvas API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]*)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function fetchAllPages<T>(
  creds: Credentials,
  endpoint: string,
  init: FetchOptions = {}
): Promise<T[]> {
  const base = creds.canvasApiBase.replace(/\/$/, '');
  const results: T[] = [];
  if (endpoint.startsWith('http')) {
    validateEndpointUrl(endpoint, creds.canvasApiBase);
  }
  let url: string | null = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  while (url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const { headers: extraHeaders, ...restInit } = init;
    const res = await fetch(url, {
      next: { revalidate: 60 },
      ...restInit,
      headers: {
        Authorization: `Bearer ${creds.canvasApiToken}`,
        ...(extraHeaders as Record<string, string> | undefined),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404 || res.status === 403 || res.status === 400) break;
      throw new Error(`Canvas API error: ${res.status} ${res.statusText}`);
    }

    const page: T[] = await res.json();
    results.push(...page);

    const nextUrl = parseLinkNext(res.headers.get('Link'));
    if (nextUrl) {
      try {
        validateEndpointUrl(nextUrl, creds.canvasApiBase);
        url = nextUrl;
      } catch {
        // Discard pagination URL if it doesn't match the expected Canvas host
        url = null;
      }
    } else {
      url = null;
    }
  }

  return results;
}

async function withCredsRefreshed(userId: string): Promise<Credentials> {
  const creds = await getCredentialsWithRefresh(userId);
  if (!creds) throw new Error('User credentials not found');
  return creds;
}

export const getCourses = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, '/courses?enrollment_state=active&per_page=100');
});
export const getUpcoming = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, '/users/self/upcoming_events');
});
export const getTodos = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, '/users/self/todo');
});
export const getAnnouncements = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/announcements?context_codes[]=course_${courseId}&per_page=100`);
});
export const getAssignments = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(
    creds,
    `/courses/${courseId}/assignments?include[]=all_dates&include[]=overrides&include[]=submission&order_by=due_at&per_page=100`
  );
});
export const getAssignment = cache(async (userId: string, courseId: number, assignmentId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/assignments/${assignmentId}?include[]=submission`);
});
export const getEnrollments = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/enrollments?include[]=user&include[]=grades&per_page=100`);
});
export const getUserProfile = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, '/users/self/profile');
});
export const getModules = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/modules?include[]=items&per_page=100`);
});
export const getCourse = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}`);
});
export const getUserGrades = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(
    creds,
    `/courses/${courseId}/students/submissions?student_ids[]=self&include[]=assignment&include[]=user&include[]=rubric_assessment&per_page=100`
  );
});
export const getGradingPeriods = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  const data = await fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/grading_periods`);
  return Array.isArray(data?.grading_periods) ? data.grading_periods : [];
});
export const getStudentGrades = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(
    creds,
    `/courses/${courseId}/enrollments?user_id=self&include[]=current_grading_period_scores&include[]=grades`
  );
});
export const getFrontPage = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/front_page`);
});
export const getActivityStream = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, '/users/self/activity_stream?per_page=50');
});
export const getActivityStreamSummary = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, '/users/self/activity_stream/summary');
});

// --- Mutation helpers (not cached) ---

export async function getSubmission(userId: string, courseId: number, assignmentId: number) {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/assignments/${assignmentId}/submissions/self?include[]=submission_comments`
  );
}

export async function initiateFileUpload(
  userId: string,
  name: string,
  size: number,
  contentType: string
): Promise<{ upload_url: string; upload_params: Record<string, string>; id: number }> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, '/users/self/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, size, content_type: contentType, parent_folder_path: 'submissions' }),
  });
}

export async function confirmFileUpload(userId: string, confirmUrl: string): Promise<{ id: number }> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, confirmUrl, {
    method: 'POST',
    headers: { 'Content-Length': '0' },
  });
}

export async function submitAssignment(
  userId: string,
  courseId: number,
  assignmentId: number,
  submissionData: Record<string, unknown>
): Promise<any> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/assignments/${assignmentId}/submissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    }
  );
}

export async function postSubmissionComment(
  userId: string,
  courseId: number,
  assignmentId: number,
  text: string
): Promise<any> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/assignments/${assignmentId}/submissions/self?include[]=submission_comments`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: { text_comment: text } }),
    }
  );
}

// --- Discussions ---

export const getDiscussions = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/discussion_topics?per_page=100&order_by=recent_activity`);
});

export const getDiscussion = cache(async (userId: string, courseId: number, topicId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/discussion_topics/${topicId}`);
});

export const getDiscussionEntries = cache(async (userId: string, courseId: number, topicId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/discussion_topics/${topicId}/entries?per_page=100`);
});

export const getDiscussionEntryReplies = cache(async (userId: string, courseId: number, topicId: number, entryId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/replies?per_page=100`);
});

export async function postDiscussionEntry(
  userId: string,
  courseId: number,
  topicId: number,
  message: string
): Promise<any> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/discussion_topics/${topicId}/entries`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );
}

export async function postDiscussionReply(
  userId: string,
  courseId: number,
  topicId: number,
  entryId: number,
  message: string
): Promise<any> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );
}

// --- Pages / Wiki ---

export const getPages = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/pages?per_page=100&sort=title`);
});

export const getPage = cache(async (userId: string, courseId: number, pageUrl: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`);
});

// --- Syllabus ---

export const getSyllabus = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}?include[]=syllabus_body`);
});

// --- Files ---

export const getCourseFiles = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/files?per_page=100&sort=name`);
});

export const getCourseFolder = cache(async (userId: string, courseId: number, folderId: number) => {
  const creds = await withCredsRefreshed(userId);
  const [folder, files, subfolders] = await Promise.all([
    fetchCanvasWithCreds<any>(creds, `/folders/${folderId}`),
    fetchAllPages<any>(creds, `/folders/${folderId}/files?per_page=100&sort=name`),
    fetchAllPages<any>(creds, `/folders/${folderId}/folders?per_page=100&sort=name`),
  ]);
  return { folder, files, subfolders };
});

export const getCourseFolders = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/folders?per_page=100&sort=name`);
});

// --- Inbox / Conversations ---

export const getConversations = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/conversations?per_page=50&scope=inbox`);
});

export const getConversation = cache(async (userId: string, conversationId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/conversations/${conversationId}`);
});

// --- Submission History ---

export const getSubmissionWithHistory = cache(async (userId: string, courseId: number, assignmentId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(
    creds,
    `/courses/${courseId}/assignments/${assignmentId}/submissions/self?include[]=submission_comments&include[]=submission_history&include[]=rubric_assessment`
  );
});

// --- Quizzes ---

export const getQuizzes = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchAllPages<any>(creds, `/courses/${courseId}/quizzes?per_page=100`);
});

export const getQuiz = cache(async (userId: string, courseId: number, quizId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/quizzes/${quizId}`);
});

export const getQuizSubmissions = cache(async (userId: string, courseId: number, quizId: number) => {
  const creds = await withCredsRefreshed(userId);
  const data = await fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/quizzes/${quizId}/submissions?include[]=quiz&include[]=user`);
  return Array.isArray(data?.quiz_submissions) ? data.quiz_submissions : (Array.isArray(data) ? data : []);
});

// --- Avatar Upload ---

export async function initiateAvatarUpload(
  userId: string,
  name: string,
  size: number,
  contentType: string
): Promise<{ upload_url: string; upload_params: Record<string, string> }> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, '/users/self/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, size, content_type: contentType, parent_folder_path: 'profile pictures' }),
  });
}

export async function confirmAvatarUpload(userId: string, confirmUrl: string): Promise<{ id: number; url: string }> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, confirmUrl, {
    method: 'POST',
    headers: { 'Content-Length': '0' },
  });
}

export async function setAvatar(userId: string, token: string): Promise<any> {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, '/users/self', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { avatar: { token } } }),
  });
}

export const getAvatarOptions = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, '/users/self/avatars');
});
