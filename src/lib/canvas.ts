import { cache } from 'react';
import { getCredentialsWithRefresh } from './users';

const FETCH_TIMEOUT_MS = 20000;

type Credentials = { canvasApiBase: string; canvasApiToken: string };
type FetchOptions = RequestInit & { next?: { revalidate: number } };

async function fetchCanvasWithCreds<T>(
  creds: Credentials,
  endpoint: string,
  init: FetchOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const base = creds.canvasApiBase.replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${creds.canvasApiToken}`,
    },
    next: { revalidate: 60 },
    ...init,
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

async function withCredsRefreshed(userId: string): Promise<Credentials> {
  const creds = await getCredentialsWithRefresh(userId);
  if (!creds) throw new Error('User credentials not found');
  return creds;
}

export const getCourses = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, '/courses?enrollment_state=active');
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
  return fetchCanvasWithCreds<any[]>(creds, `/announcements?context_codes[]=course_${courseId}`);
});
export const getAssignments = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(
    creds,
    `/courses/${courseId}/assignments?include[]=all_dates&include[]=overrides&order_by=due_at&per_page=100`
  );
});
export const getAssignment = cache(async (userId: string, courseId: number, assignmentId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}/assignments/${assignmentId}`);
});
export const getEnrollments = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, `/courses/${courseId}/enrollments?include[]=user&include[]=grades`);
});
export const getUserProfile = cache(async (userId: string) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, '/users/self/profile');
});
export const getModules = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(creds, `/courses/${courseId}/modules?include[]=items`);
});
export const getCourse = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any>(creds, `/courses/${courseId}`);
});
export const getUserGrades = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(
    creds,
    `/courses/${courseId}/students/submissions?student_ids[]=self&include[]=assignment&include[]=user`
  );
});
export const getStudentGrades = cache(async (userId: string, courseId: number) => {
  const creds = await withCredsRefreshed(userId);
  return fetchCanvasWithCreds<any[]>(
    creds,
    `/courses/${courseId}/enrollments?user_id=self&include[]=current_grading_period_scores&include[]=grades`
  );
});
