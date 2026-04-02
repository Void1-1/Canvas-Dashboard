'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BaseModal from '@/components/BaseModal';

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
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFull(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginHistoryModal({ isOpen, onClose }: LoginHistoryModalProps) {
  const [history, setHistory] = useState<LoginEntry[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setHistory(null);
    fetch('/api/account/login-history')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setHistory(d) : setHistory([]))
      .catch(() => setHistory([]));
  }, [isOpen]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-glass)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Login History</h2>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Your 10 most recent successful logins</p>
        </div>
      </div>

      {/* Content */}
      {history === null ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No login history available.</p>
      ) : (
        <ul className="space-y-1 mb-5">
          {history.map((entry, i) => (
            <motion.li
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{ background: i === 0 ? 'var(--color-glass)' : 'transparent' }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: i === 0 ? 'var(--color-accent)' : 'var(--color-border)' }}
                />
                <span className="text-sm font-mono truncate" style={{ color: 'var(--color-text)' }}>
                  {entry.ip}
                </span>
                {i === 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)', background: 'transparent' }}>
                    Latest
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{formatRelative(entry.timestamp)}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>{formatFull(entry.timestamp)}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <motion.button
        type="button"
        className="w-full py-2.5 rounded-lg font-semibold text-white bg-accent hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]"
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
      >
        Close
      </motion.button>
    </BaseModal>
  );
}
