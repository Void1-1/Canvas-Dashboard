'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CustomCheckbox from './CustomCheckbox';
import PageTransition from './PageTransition';
import AssignmentModal from './AssignmentModal';
import TodoAssignmentCard, { type Assignment } from './TodoAssignmentCard';
import TodoSectionGroup from './TodoSectionGroup';
import PersonalTodoList from './PersonalTodoList';
import { ASSIGNMENT_DONE_KEY, loadDoneIds, saveDoneIds } from '@/lib/assignmentDoneState';

export type { Assignment };

// ─── Types ───────────────────────────────────────────────────────────────────

interface PersonalTodo {
  id: string;
  text: string;
  done: boolean;
}

type GroupBy = 'time' | 'class' | 'type';
type TimeWindow = '2days' | 'week' | '2weeks' | 'month' | 'all';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '2days', label: '2 Days' },
  { value: 'week', label: 'Week' },
  { value: '2weeks', label: '2 Weeks' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

const WINDOW_MS: Record<TimeWindow, number> = {
  '2days': 2 * 24 * 60 * 60 * 1000,
  'week': 7 * 24 * 60 * 60 * 1000,
  '2weeks': 14 * 24 * 60 * 60 * 1000,
  'month': 30 * 24 * 60 * 60 * 1000,
  'all': Infinity,
};

function filterByWindow(assignments: Assignment[], window: TimeWindow, now: number): Assignment[] {
  const limit = WINDOW_MS[window];
  return assignments.filter((a) => {
    if (!a.due_at) return false;
    const ms = new Date(a.due_at).getTime() - now;
    return ms >= 0 && ms <= limit;
  });
}

function groupByTime(assignments: Assignment[], now: number): Record<string, Assignment[]> {
  const groups: Record<string, Assignment[]> = {
    'Next 2 Days': [],
    'This Week': [],
    'This Month': [],
    'Later': [],
  };
  for (const a of assignments) {
    if (!a.due_at) continue;
    const days = (new Date(a.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
    if (days <= 2) groups['Next 2 Days'].push(a);
    else if (days <= 7) groups['This Week'].push(a);
    else if (days <= 30) groups['This Month'].push(a);
    else groups['Later'].push(a);
  }
  return groups;
}

function groupByClass(assignments: Assignment[]): Record<string, Assignment[]> {
  const groups: Record<string, Assignment[]> = {};
  for (const a of assignments) {
    const key = a.course_name || 'Unknown Course';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function getAssignmentType(submissionTypes: string[]): string {
  if (!submissionTypes?.length) return 'Assignment';
  if (submissionTypes.includes('online_quiz')) return 'Quiz';
  if (submissionTypes.includes('discussion_topic')) return 'Discussion';
  if (submissionTypes.some((t) => t === 'none' || t === 'not_graded')) return 'No Submission';
  return 'Assignment';
}

function groupByType(assignments: Assignment[]): Record<string, Assignment[]> {
  const groups: Record<string, Assignment[]> = {
    'Quiz': [],
    'Discussion': [],
    'Assignment': [],
    'No Submission': [],
  };
  for (const a of assignments) {
    const type = getAssignmentType(a.submission_types ?? []);
    groups[type].push(a);
  }
  return groups;
}

function sortByDue(list: Assignment[]): Assignment[] {
  return [...list].sort(
    (a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()
  );
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
      }`}
      style={active ? {} : { color: 'var(--color-muted)' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TodoView({ assignments }: { assignments: Assignment[] }) {
  const [now] = useState(() => Date.now());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('time');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('month');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAssignmentId, setLoadingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    setDoneIds(loadDoneIds());

    const onStorage = (e: StorageEvent) => {
      if (e.key === ASSIGNMENT_DONE_KEY) setDoneIds(loadDoneIds());
    };
    window.addEventListener('storage', onStorage);

    try {
      const savedPersonal = localStorage.getItem('todo-personal');
      if (savedPersonal) setPersonalTodos(JSON.parse(savedPersonal));
    } catch {}

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleDone = useCallback((id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveDoneIds(next);
      return next;
    });
  }, []);

  const handleOpenAssignment = useCallback(async (assignment: Assignment) => {
    setLoadingAssignmentId(String(assignment.id));
    if (assignment.id && assignment.course_id) {
      try {
        const response = await fetch(`/api/assignments/${assignment.id}?course_id=${assignment.course_id}`);
        if (response.ok) {
          const data = await response.json();
          setLoadingAssignmentId(null);
          setSelectedAssignment(data);
          setIsModalOpen(true);
          return;
        }
      } catch {}
    }
    setLoadingAssignmentId(null);
    setSelectedAssignment({
      id: assignment.id,
      name: assignment.name,
      due_at: assignment.due_at,
      description: '',
      course_id: assignment.course_id ?? undefined,
      course: assignment.course_name ? { name: assignment.course_name } : undefined,
      html_url: assignment.html_url,
      points_possible: assignment.points_possible,
      submission_types: assignment.submission_types ?? [],
    });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  }, []);

  const addPersonalTodo = () => {
    const text = newTodoText.trim();
    if (!text) return;
    const todo: PersonalTodo = { id: Date.now().toString(), text, done: false };
    setPersonalTodos((prev) => {
      const next = [...prev, todo];
      localStorage.setItem('todo-personal', JSON.stringify(next));
      return next;
    });
    setNewTodoText('');
  };

  const togglePersonalTodo = (id: string) => {
    setPersonalTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      localStorage.setItem('todo-personal', JSON.stringify(next));
      return next;
    });
  };

  const deletePersonalTodo = (id: string) => {
    setPersonalTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      localStorage.setItem('todo-personal', JSON.stringify(next));
      return next;
    });
  };

  const filtered = filterByWindow(assignments, timeWindow, now);

  let groupedEntries: [string, Assignment[]][] = [];
  if (groupBy === 'time') {
    const g = groupByTime(filtered, now);
    groupedEntries = Object.entries(g)
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => [k, sortByDue(v)]);
  } else if (groupBy === 'class') {
    const g = groupByClass(filtered);
    groupedEntries = Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => [k, sortByDue(v)]);
  } else {
    const g = groupByType(filtered);
    groupedEntries = Object.entries(g)
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => [k, sortByDue(v)]);
  }

  const pendingAssignments = filtered.filter((a) => !doneIds.has(a.id)).length;
  const pendingPersonal = personalTodos.filter((t) => !t.done).length;
  const totalPending = pendingAssignments + pendingPersonal;

  return (
    <PageTransition>
      <div className="space-y-5 pb-6">
        {/* ── Page header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            To-do
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {totalPending > 0
              ? `${totalPending} item${totalPending === 1 ? '' : 's'} remaining`
              : 'All caught up'}
          </p>
        </motion.div>

        {/* ── Filter bar ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-xl border p-3 flex flex-wrap gap-y-3 gap-x-5 items-center"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Group</span>
            <div className="flex gap-1">
              {(['time', 'class', 'type'] as GroupBy[]).map((g) => (
                <FilterPill key={g} active={groupBy === g} onClick={() => setGroupBy(g)}>
                  {g === 'time' ? 'Time' : g === 'class' ? 'Class' : 'Type'}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px h-4 self-center" style={{ background: 'var(--color-border)' }} />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Show</span>
            <div className="flex gap-1 flex-wrap">
              {TIME_WINDOWS.map(({ value, label }) => (
                <FilterPill key={value} active={timeWindow === value} onClick={() => setTimeWindow(value)}>
                  {label}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px h-4 self-center" style={{ background: 'var(--color-border)' }} />

          <CustomCheckbox checked={showDone} onChange={setShowDone}>
            Show completed
          </CustomCheckbox>
        </motion.div>

        {/* ── Two-column layout ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

          {/* ── Left: Personal todos ────────────────────────────── */}
          <PersonalTodoList
            todos={personalTodos}
            newTodoText={newTodoText}
            onNewTodoTextChange={setNewTodoText}
            onAdd={addPersonalTodo}
            onToggle={togglePersonalTodo}
            onDelete={deletePersonalTodo}
            showDone={showDone}
          />

          {/* ── Right: Assignment groups ────────────────────────── */}
          <div className="space-y-7">
            {groupedEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="rounded-xl border p-10 text-center"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {assignments.length === 0 ? (
                  <>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>No upcoming assignments</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Nothing due in the selected time window.</p>
                  </>
                ) : (
                  <>
                    <motion.svg
                      className="w-10 h-10 mx-auto mb-3"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: 'var(--color-accent)' }}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.25 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>All caught up!</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>All items in this window are completed.</p>
                  </>
                )}
              </motion.div>
            ) : (
              groupedEntries.map(([title, items], sectionIndex) => (
                <TodoSectionGroup
                  key={title}
                  title={title}
                  items={items}
                  doneIds={doneIds}
                  onToggle={toggleDone}
                  onOpen={handleOpenAssignment}
                  showDone={showDone}
                  now={now}
                  sectionIndex={sectionIndex}
                  loadingAssignmentId={loadingAssignmentId}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
