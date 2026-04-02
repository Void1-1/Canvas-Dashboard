'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface Assignment {
  id: string;
  name: string;
  due_at: string | null;
  html_url?: string;
  points_possible?: number | null;
  submission_types?: string[];
  course_name?: string | null;
  course_id?: number | string | null;
}

function getAssignmentType(submissionTypes: string[]): string {
  if (!submissionTypes?.length) return 'Assignment';
  if (submissionTypes.includes('online_quiz')) return 'Quiz';
  if (submissionTypes.includes('discussion_topic')) return 'Discussion';
  if (submissionTypes.some((t) => t === 'none' || t === 'not_graded')) return 'No Submission';
  return 'Assignment';
}

function formatDueDate(dueAt: string, now: number): string {
  const diff = new Date(dueAt).getTime() - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `In ${days} days`;
  return new Date(dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CheckboxButton({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0" aria-label={checked ? 'Mark incomplete' : 'Mark complete'}>
      <motion.div
        className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
          checked ? 'border-amber-600 bg-amber-600' : 'border-amber-300 hover:border-amber-400'
        }`}
        animate={{ scale: checked ? [1, 1.2, 1] : 1, rotate: checked ? [0, 10, -10, 0] : 0 }}
        transition={{ scale: { duration: 0.3 }, rotate: { duration: 0.4 } }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {checked && (
            <motion.svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  done: boolean;
  onToggle: () => void;
  onOpen: () => void;
  now: number;
  index: number;
  sectionDelay: number;
  isLoading?: boolean;
}

export default function TodoAssignmentCard({
  assignment,
  done,
  onToggle,
  onOpen,
  now,
  index,
  sectionDelay,
  isLoading = false,
}: AssignmentCardProps) {
  const type = getAssignmentType(assignment.submission_types ?? []);
  const dueDateStr = assignment.due_at ? formatDueDate(assignment.due_at, now) : null;
  const isUrgent =
    !!assignment.due_at &&
    new Date(assignment.due_at).getTime() - now <= 2 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: done ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ duration: 0.4, delay: sectionDelay + index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2 }}
      className="rounded-xl border p-4 cursor-default"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <CheckboxButton checked={done} onToggle={onToggle} />
        </div>

        <div
          className={`flex-1 min-w-0 cursor-pointer ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
          onClick={onOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
        >
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium leading-snug ${done ? 'line-through' : ''}`}
              style={{ color: 'var(--color-text)' }}
            >
              {assignment.name}
            </p>
            {isLoading && (
              <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            {assignment.course_name && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {assignment.course_name}
              </span>
            )}
            {type !== 'Assignment' && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full border"
                style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}
              >
                {type}
              </span>
            )}
            {dueDateStr && (
              <span
                className={`text-xs font-medium ${isUrgent && !done ? 'text-red-500' : ''}`}
                style={isUrgent && !done ? {} : { color: 'var(--color-muted)' }}
              >
                {dueDateStr}
              </span>
            )}
            {assignment.points_possible != null && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {assignment.points_possible} pts
              </span>
            )}
          </div>
        </div>

        {assignment.html_url && (
          <motion.a
            href={assignment.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 rounded-lg opacity-30 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Open in Canvas"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
