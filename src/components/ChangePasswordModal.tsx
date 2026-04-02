'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BaseModal from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (form.newPassword.length < 12) {
      setMessage({ type: 'error', text: 'New password must be at least 12 characters' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = '/login';
        return;
      }
      setMessage({ type: 'error', text: data.message || 'Failed to update password' });
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="sm" backdropClose={!isLoading}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Change password</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="cp-current" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Current password
            </label>
            <input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="cp-new" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              New password
            </label>
            <input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              minLength={12}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="cp-confirm" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Confirm new password
            </label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
              minLength={12}
              disabled={isLoading}
            />
          </div>

          {message && (
            <div
              className={`flex items-start gap-2 rounded-lg p-2.5 text-sm border ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600'
              }`}
            >
              {message.type === 'error' ? (
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <motion.button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? 'Updating...' : 'Update password'}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
