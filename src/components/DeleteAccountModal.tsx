'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BaseModal from '@/components/BaseModal';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardUsername: string | null;
}

export default function DeleteAccountModal({ isOpen, onClose, dashboardUsername }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedConfirm = 'delete my account';
  const canSubmit = password.length > 0 && confirmText === expectedConfirm;

  const handleClose = () => {
    if (isDeleting) return;
    setPassword('');
    setConfirmText('');
    setError('');
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = '/login';
      } else {
        setError(data.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-danger)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Delete Account</h2>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>This action cannot be undone</p>
        </div>
      </div>

      <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
        Deleting your account will permanently remove all your data from this dashboard,
        including your credentials and login history.
        {dashboardUsername && (
          <> Your Canvas account (<span className="font-medium" style={{ color: 'var(--color-text)' }}>{dashboardUsername}</span>) will not be affected.</>
        )}
      </p>

      <form onSubmit={handleDelete} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-accent"
            style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isDeleting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Type <span className="font-mono" style={{ color: 'var(--color-danger)' }}>delete my account</span> to confirm
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-accent"
            style={{ color: 'var(--color-text)', background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            disabled={isDeleting}
            autoComplete="off"
          />
        </div>

        {error && (
          <motion.div
            className="rounded-lg p-2.5 text-sm"
            style={{ color: 'var(--color-danger)', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}

        <div className="flex gap-3 pt-1">
          <motion.button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:opacity-50"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={!canSubmit || isDeleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-danger)', color: 'var(--color-bg)', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
            whileHover={{ scale: canSubmit && !isDeleting ? 1.02 : 1 }}
            whileTap={{ scale: canSubmit && !isDeleting ? 0.98 : 1 }}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </motion.button>
        </div>
      </form>
    </BaseModal>
  );
}
