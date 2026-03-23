'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type LoginEntry = { ip: string; timestamp: number };

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function LoginHistoryPanel() {
  const [history, setHistory] = useState<LoginEntry[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/account/login-history')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setHistory(d) : setHistory([]))
      .catch(() => setHistory([]));
  }, []);

  if (!history || history.length === 0) return null;

  const visible = expanded ? history : history.slice(0, 3);

  return (
    <motion.div
      className="rounded-lg shadow p-6"
      style={{ background: 'var(--color-surface)' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Recent Logins</h2>
        {history.length > 3 && (
          <button
            className="text-xs"
            style={{ color: 'var(--color-accent)' }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : `Show all ${history.length}`}
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {visible.map((entry, i) => (
          <motion.li
            key={i}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
            style={{ borderColor: 'var(--color-border)' }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-glass)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>{entry.ip}</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {formatRelative(entry.timestamp)}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
