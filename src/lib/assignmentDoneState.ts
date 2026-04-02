/**
 * Shared localStorage helpers for assignment completion state.
 * Used by both AssignmentsView and TodoView so that marking an item
 * done on one page is immediately reflected on the other.
 */

export const ASSIGNMENT_DONE_KEY = 'done_assignment_ids';

export function loadDoneIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ASSIGNMENT_DONE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDoneIds(ids: Set<string>): void {
  try {
    localStorage.setItem(ASSIGNMENT_DONE_KEY, JSON.stringify([...ids]));
  } catch {}
}
