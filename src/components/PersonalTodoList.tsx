'use client';

import { motion, AnimatePresence } from 'framer-motion';
import CustomCheckbox from './CustomCheckbox';

interface PersonalTodo {
  id: string;
  text: string;
  done: boolean;
}

interface PersonalTodoListProps {
  todos: PersonalTodo[];
  newTodoText: string;
  onNewTodoTextChange: (text: string) => void;
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showDone: boolean;
}

function PersonalTodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: PersonalTodo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: todo.done ? 0.4 : 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-1 group"
    >
      <div className="flex-1 min-w-0">
        <CustomCheckbox checked={todo.done} onChange={onToggle}>
          <span className={`truncate ${todo.done ? 'line-through' : ''}`}>{todo.text}</span>
        </CustomCheckbox>
      </div>
      <motion.button
        onClick={onDelete}
        className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
        aria-label="Delete"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>
    </motion.div>
  );
}

export default function PersonalTodoList({
  todos,
  newTodoText,
  onNewTodoTextChange,
  onAdd,
  onToggle,
  onDelete,
  showDone,
}: PersonalTodoListProps) {
  const pendingCount = todos.filter((t) => !t.done).length;
  const visible = todos.filter((t) => showDone || !t.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border p-4 lg:sticky lg:top-6"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Personal</h3>
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            {pendingCount}
          </motion.span>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onAdd(); }} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => onNewTodoTextChange(e.target.value)}
          placeholder="Add a to-do…"
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border min-w-0"
          style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        />
        <motion.button
          type="submit"
          disabled={!newTodoText.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40 flex-shrink-0"
          style={{ background: 'var(--color-accent)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Add
        </motion.button>
      </form>

      {visible.length === 0 && (
        <p className="text-xs py-1" style={{ color: 'var(--color-muted)' }}>
          No personal to-dos yet.
        </p>
      )}

      <AnimatePresence>
        {visible.map((todo) => (
          <PersonalTodoRow
            key={todo.id}
            todo={todo}
            onToggle={() => onToggle(todo.id)}
            onDelete={() => onDelete(todo.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
