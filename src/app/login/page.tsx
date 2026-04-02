'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'success' | 'fail'>('idle');

  // Only redirect to signup when there are no users AND user didn't explicitly come from signup (e.g. clicked "Sign in")
  useEffect(() => {
    fetch('/api/first-time')
      .then((r) => r.json())
      .then((data) => {
        const fromSignup = searchParams.get('from') === 'signup';
        if (data?.hasUsers === false && !fromSignup) router.replace('/signup');
      })
      .catch(() => {});
  }, [router, searchParams]);

  useEffect(() => {
    if (loginState === 'success') {
      const timer = setTimeout(() => router.push('/'), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginState, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setLoginState('idle');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        setLoginState('success');
      } else {
        let message = 'Authentication failed';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch (_) {}
        setError(message);
        setLoginState('fail');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoginState('fail');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--color-bg)' }}>
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {loginState === 'success' && (
            <motion.div
              key="success"
              className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: 'var(--color-bg)', opacity: 0.8, borderRadius: '1rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Glowing Pulse */}
              <motion.div
                className="absolute"
                style={{ zIndex: 0 }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0.6, 0.2, 0], scale: [0.7, 1.3, 1.7] }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <div className="w-32 h-32 rounded-full bg-green-400/40 blur-2xl" />
              </motion.div>
              {/* Checkmark with bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1.2, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center justify-center mb-2 relative z-10"
              >
                <svg className="w-20 h-20 text-green-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="text-green-200" />
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M8 12l3 3 5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                  />
                </svg>
                {/* Sparkles */}
                <motion.div
                  className="absolute left-0 top-0"
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5], rotate: [0, 20, 40] }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" />
                  </svg>
                </motion.div>
                <motion.div
                  className="absolute right-0 bottom-0"
                  initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 1.4], rotate: [0, -20, -40] }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" />
                  </svg>
                </motion.div>
              </motion.div>
              <motion.p
                className="text-lg font-semibold text-green-600 relative z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Success!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div
            className="w-16 h-16 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Sign in
          </motion.h1>
          <motion.p 
            className="" style={{ color: 'var(--color-muted)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Enter your username and password to access your dashboard
          </motion.p>
        </motion.div>
        {/* Login Form */}
        <motion.form
          onSubmit={handleSubmit}
          className={`bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[var(--color-border)] p-8 relative transition-opacity duration-300`}
          initial={{ opacity: 0, y: 30 }}
          animate={
            loginState === 'fail'
              ? { x: [0, -16, 16, -12, 12, -8, 8, 0], y: 0, opacity: 1 }
              : loginState === 'success'
                ? { x: 0, y: 0, opacity: 0 }
                : { x: 0, y: 0, opacity: 1 }
          }
          transition={
            loginState === 'fail'
              ? { duration: 0.6, type: 'tween', ease: 'easeInOut' }
              : { duration: 0.6, delay: 0.2 }
          }
          key={loginState}
        >
          <div className="space-y-6">
            {/* Username Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Your username"
                autoComplete="username"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onInvalid={(e) => { e.preventDefault(); setError('Please enter your username.'); }}
                required
                disabled={isLoading}
              />
            </motion.div>
            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={(e) => { e.preventDefault(); setError('Please enter your password.'); }}
                  required
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
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/40 dark:border-red-700"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white bg-accent hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
            <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-accent hover:underline">Sign up</a>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}