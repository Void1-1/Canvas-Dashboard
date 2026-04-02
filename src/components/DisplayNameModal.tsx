'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BaseModal from '@/components/BaseModal';

interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDisplayName: string | null;
  onSaved?: (displayName: string | null) => void;
}

export default function DisplayNameModal({ isOpen, onClose, initialDisplayName, onSaved }: DisplayNameModalProps) {
  const [value, setValue] = useState(initialDisplayName ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(initialDisplayName ?? '');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen, initialDisplayName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: value.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Failed to update display name.');
        return;
      }
      setStatus('success');
      onSaved?.(data.displayName ?? null);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-glass)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Display Name</h2>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Shown in the dashboard instead of your username</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your display name (optional)"
          maxLength={64}
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        />

        <AnimatePresence>
          {status === 'error' && (
            <motion.p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {errorMsg}
            </motion.p>
          )}
          {status === 'success' && (
            <motion.p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Saved!
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pt-1">
          <motion.button
            type="button"
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ background: 'var(--color-glass)', color: 'var(--color-muted)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={status === 'saving'}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--color-accent)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {status === 'saving' ? 'Saving…' : 'Save'}
          </motion.button>
        </div>
      </form>
    </BaseModal>
  );
}
