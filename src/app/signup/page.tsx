'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [oauthEnabled, setOauthEnabled] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [canvasApiBase, setCanvasApiBase] = useState('');
  const [canvasApiToken, setCanvasApiToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetch('/api/oauth/status')
      .then((r) => r.json())
      .then((d) => setOauthEnabled(!!d.oauthEnabled))
      .catch(() => setOauthEnabled(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const body: Record<string, string> = {
        username: username.trim(),
        password,
        canvasApiBase: canvasApiBase.trim(),
      };
      if (!oauthEnabled) {
        body.canvasApiToken = canvasApiToken.trim();
      }

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (oauthEnabled) {
          router.push('/api/oauth/authorize');
        } else {
          router.push('/login?signup=1');
        }
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (oauthEnabled === null) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-8" style={{ background: 'var(--color-bg)' }}>
      <motion.div
        className="w-full max-w-md px-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Create account
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {oauthEnabled
              ? 'Enter your details, then connect your Canvas account'
              : 'Enter your details and Canvas API credentials'}
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[var(--color-border)] p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <label htmlFor="signup-username" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Username
            </label>
            <input
              id="signup-username"
              type="text"
              placeholder="Choose a username"
              autoComplete="username"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-accent"
              style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onInvalid={(e) => { e.preventDefault(); setError(e.currentTarget.validity.valueMissing ? 'Please choose a username.' : 'Username must be at least 2 characters.'); }}
              required
              minLength={2}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 12 characters"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 pr-11 border rounded-lg focus:ring-2 focus:ring-accent"
                style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInvalid={(e) => { e.preventDefault(); setError(e.currentTarget.validity.valueMissing ? 'Please enter a password.' : 'Password must be at least 12 characters.'); }}
                required
                minLength={12}
                disabled={isLoading}
              />
              <motion.button
                type="button"
                className="absolute right-3 inset-y-0 flex items-center justify-center w-8 text-accent hover:text-accent-dark focus:outline-none focus:ring-0 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                tabIndex={-1}
              >
                {showPassword ? (
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

          <div>
            <label htmlFor="canvas-base" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Canvas URL
            </label>
            <input
              id="canvas-base"
              type="url"
              placeholder="https://yourschool.instructure.com"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-accent"
              style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              value={canvasApiBase}
              onChange={(e) => setCanvasApiBase(e.target.value)}
              onInvalid={(e) => { e.preventDefault(); setError(e.currentTarget.validity.valueMissing ? 'Please enter your Canvas URL.' : 'Please enter a valid URL (e.g. https://yourschool.instructure.com).'); }}
              required
              disabled={isLoading}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Your Canvas instance URL (e.g. https://yourschool.instructure.com)
            </p>
          </div>

          {!oauthEnabled && (
            <div>
              <label htmlFor="canvas-token" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Canvas API Token
              </label>
              <div className="relative flex items-center">
                <input
                  id="canvas-token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Paste your token from Canvas"
                  className="w-full px-4 py-2.5 pr-11 border rounded-lg focus:ring-2 focus:ring-accent"
                  style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  value={canvasApiToken}
                  onChange={(e) => setCanvasApiToken(e.target.value)}
                  onInvalid={(e) => { e.preventDefault(); setError('Please paste your Canvas API token.'); }}
                  required
                  disabled={isLoading}
                />
                <motion.button
                  type="button"
                  className="absolute right-3 inset-y-0 flex items-center justify-center w-8 text-accent hover:text-accent-dark focus:outline-none focus:ring-0 transition-colors"
                  onClick={() => setShowToken(!showToken)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  tabIndex={-1}
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
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                From Canvas: Account → Settings → New Access Token
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <motion.button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white bg-accent hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading
              ? (oauthEnabled ? 'Connecting to Canvas...' : 'Creating account...')
              : (oauthEnabled ? 'Create account & connect Canvas' : 'Create account')}
          </motion.button>

          <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            Already have an account? <a href="/login?from=signup" className="text-accent hover:underline">Sign in</a>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
