'use client';

import { motion, AnimatePresence } from 'framer-motion';
import TodoAssignmentCard, { type Assignment } from './TodoAssignmentCard';

const URGENCY_DOT: Record<string, string> = {
  'Next 2 Days': 'bg-red-500',
  'This Week': 'bg-amber-500',
};

interface SectionGroupProps {
  title: string;
  items: Assignment[];
  doneIds: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (assignment: Assignment) => void;
  showDone: boolean;
  now: number;
  sectionIndex: number;
  loadingAssignmentId?: string | null;
}

export default function TodoSectionGroup({
  title,
  items,
  doneIds,
  onToggle,
  onOpen,
  showDone,
  now,
  sectionIndex,
  loadingAssignmentId,
}: SectionGroupProps) {
  const visible = items.filter((a) => showDone || !doneIds.has(a.id));
  if (visible.length === 0) return null;
  const pendingCount = items.filter((a) => !doneIds.has(a.id)).length;
  const dotClass = URGENCY_DOT[title] ?? 'bg-[var(--color-muted)] opacity-50';
  const sectionDelay = 0.15 + sectionIndex * 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: sectionDelay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: sectionDelay + 0.1 }}
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            {pendingCount}
          </motion.span>
        )}
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {visible.map((a, i) => (
            <TodoAssignmentCard
              key={a.id}
              assignment={a}
              done={doneIds.has(a.id)}
              onToggle={() => onToggle(a.id)}
              onOpen={() => onOpen(a)}
              now={now}
              index={i}
              sectionDelay={sectionDelay}
              isLoading={loadingAssignmentId === String(a.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
