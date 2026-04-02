'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BaseModal from '@/components/BaseModal';

type TokenStatus =
  | { needsRenewal: false }
  | { needsRenewal: true; daysOld: number; daysUntilExpiry: number };

export default function CanvasTokenRenewalModal() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/account/token-status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ needsRenewal: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/account/update-canvas-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasApiToken: token }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ needsRenewal: false });
      } else {
        setError(data.message || 'Failed to update token. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShow = status?.needsRenewal === true;
  const renewalStatus = status as { needsRenewal: true; daysOld: number; daysUntilExpiry: number } | null;

  return (
    <BaseModal isOpen={shouldShow} onClose={() => {}} backdropClose={false}>
      {/* Warning icon + title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Canvas Token Expiring Soon
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {renewalStatus && renewalStatus.daysUntilExpiry > 0
              ? `Expires in approximately ${renewalStatus.daysUntilExpiry} day${renewalStatus.daysUntilExpiry === 1 ? '' : 's'}`
              : 'Token may have expired'}
          </p>
        </div>
      </div>

      <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
        Your Canvas API token was set{' '}
        <span style={{ color: 'var(--color-text)' }}>
          {renewalStatus?.daysOld} days ago
        </span>{' '}
        and will stop working soon. Generate a new token in Canvas and paste it below to keep
        your account working.
      </p>

      <p className="text-xs mb-4 p-2.5 rounded-lg bg-[var(--color-border)]/30 font-mono" style={{ color: 'var(--color-muted)' }}>
        Canvas → Account → Settings → New Access Token
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="renewal-token" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            New Canvas API Token
          </label>
          <div className="relative flex items-center">
            <input
              id="renewal-token"
              type={showToken ? 'text' : 'password'}
              placeholder="Paste your new token"
              className="w-full px-4 py-2.5 pr-11 border rounded-lg focus:ring-2 focus:ring-accent"
              style={{
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
              }}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onInvalid={(e) => { e.preventDefault(); setError('Please paste your new Canvas API token.'); }}
              required
              disabled={isSubmitting}
              autoComplete="off"
            />
            <motion.button
              type="button"
              className="absolute right-3 inset-y-0 flex items-center justify-center w-8 text-accent hover:text-accent-dark focus:outline-none focus:ring-0 transition-colors"
              onClick={() => setShowToken(!showToken)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              tabIndex={-1}
              aria-label={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
            {error}
          </div>
        )}

        <motion.button
          type="submit"
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-accent hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || !token.trim()}
        >
          {isSubmitting ? 'Verifying & saving...' : 'Update Canvas Token'}
        </motion.button>
      </form>
    </BaseModal>
  );
}
