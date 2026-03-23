'use client';

import { useState } from 'react';
import CustomCheckbox from './CustomCheckbox';
import DarkModeSwitch from './DarkModeSwitch';
import { useLogoutWithFade } from './useLogoutWithFade';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';
import DeleteAccountModal from './DeleteAccountModal';
import LoginHistoryModal from './LoginHistoryModal';

interface SettingsPanelProps {
  user: {
    name: string;
    primary_email: string;
    id: string;
    short_name: string;
    login_id: string;
    sortable_name: string;
    locale?: string;
    avatar_url: string;
  };
  dashboardUsername?: string | null;
}

export default function SettingsPanel({ user, dashboardUsername }: SettingsPanelProps) {
  const { darkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    compactLayout: true,
    dueDateReminders: true,
    newAnnouncements: true,
    gradeUpdates: false,
  });

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAction = async (action: string) => {
    if (action === 'changePassword') {
      setShowPasswordForm((v) => !v);
      setPasswordMessage(null);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      return;
    }
    setIsLoading(action);
    if (action === 'exportData') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Data export functionality would be implemented here');
    }
    setIsLoading(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 12) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 12 characters' });
      return;
    }
    setIsLoading('changePassword');
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Session cookie was cleared server-side — force a full page reload to /login.
        window.location.href = '/login';
        return;
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(null);
    }
  };

  const { isFading, handleLogout } = useLogoutWithFade();

  return (
    <div className={`grid gap-6 grid-cols-1 lg:grid-cols-2 transition-opacity duration-500 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ color: 'var(--color-text)' }}>
      {/* Account Settings */}
      <div className="rounded-lg shadow p-8" style={{ background: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Account Settings</h2>
        
        {dashboardUsername && (
          <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Dashboard login: <span className="font-medium" style={{ color: 'var(--color-text)' }}>{dashboardUsername}</span>
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Appearance</h3>
            <div className="space-y-2">
              <motion.label 
                className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg transition-colors hover:ring-1 hover:ring-[var(--color-border)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DarkModeSwitch size="sm" />
                <motion.span 
                  className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors"
                  animate={{ x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Dark mode
                </motion.span>
              </motion.label>
              <CustomCheckbox 
                checked={settings.compactLayout}
                onChange={() => handleSettingChange('compactLayout')}
              >
                Compact layout
              </CustomCheckbox>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Notifications</h3>
            <div className="space-y-2">
              <CustomCheckbox 
                checked={settings.dueDateReminders}
                onChange={() => handleSettingChange('dueDateReminders')}
              >
                Due date reminders
              </CustomCheckbox>
              <CustomCheckbox 
                checked={settings.newAnnouncements}
                onChange={() => handleSettingChange('newAnnouncements')}
              >
                New announcements
              </CustomCheckbox>
              <CustomCheckbox 
                checked={settings.gradeUpdates}
                onChange={() => handleSettingChange('gradeUpdates')}
              >
                Grade updates
              </CustomCheckbox>
            </div>
          </div>

          {/* Change password */}
          <div className="border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Password</h3>
            {!showPasswordForm ? (
              <motion.button
                type="button"
                onClick={() => handleAction('changePassword')}
                className="group flex items-center space-x-3 w-full text-left p-2 rounded-lg text-sm transition-colors hover:ring-1 hover:ring-[var(--color-border)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <motion.span
                  className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors"
                  animate={{ x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Change password
                </motion.span>
              </motion.button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                    disabled={isLoading === 'changePassword'}
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    minLength={12}
                    disabled={isLoading === 'changePassword'}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ color: 'var(--color-text)', background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    minLength={12}
                    disabled={isLoading === 'changePassword'}
                  />
                </div>
                {passwordMessage && (
                  <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading === 'changePassword'}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {isLoading === 'changePassword' ? 'Updating...' : 'Update password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setPasswordMessage(null); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                    disabled={isLoading === 'changePassword'}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Actions */}
          <div className="pt-2">
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Account Actions</h3>
            <div className="space-y-0.5">
              {/* Export data */}
              <motion.button
                onClick={() => handleAction('exportData')}
                disabled={isLoading === 'exportData'}
                className="group flex items-center space-x-3 w-full text-left p-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:ring-1 hover:ring-[var(--color-border)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <motion.span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors" animate={{ x: 0 }} transition={{ duration: 0.2 }}>
                  {isLoading === 'exportData' ? 'Processing…' : 'Export data'}
                </motion.span>
              </motion.button>

              {/* Login history */}
              <motion.button
                onClick={() => setShowLoginHistory(true)}
                className="group flex items-center space-x-3 w-full text-left p-2 rounded-lg text-sm transition-colors hover:ring-1 hover:ring-[var(--color-border)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <motion.span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors" animate={{ x: 0 }} transition={{ duration: 0.2 }}>
                  View login history
                </motion.span>
              </motion.button>

              <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />

              {/* Sign out */}
              <motion.button
                onClick={handleLogout}
                disabled={isFading}
                className="group flex items-center space-x-3 w-full text-left p-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <motion.span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors" animate={{ x: 0 }} transition={{ duration: 0.2 }}>
                  Sign out
                </motion.span>
              </motion.button>

              <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />

              {/* Delete — destructive */}
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                className="group flex items-center space-x-3 w-full text-left p-2 rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-danger)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <motion.span className="text-sm transition-colors" style={{ color: 'var(--color-danger)' }} animate={{ x: 0 }} transition={{ duration: 0.2 }}>
                  Delete account
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        dashboardUsername={dashboardUsername ?? null}
      />
      <LoginHistoryModal
        isOpen={showLoginHistory}
        onClose={() => setShowLoginHistory(false)}
      />

      {/* System Status */}
      <div className="rounded-lg shadow p-8" style={{ background: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>System Status</h2>
        
        <div className="space-y-6">
          {/* Canvas Connection */}
          <div className="border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Canvas Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>Authentication</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>Session</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Valid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Security</h3>
            <div className="space-y-2 text-sm rounded-lg" style={{ color: 'var(--color-muted)', background: 'var(--color-glass)', padding: '0.75rem' }}>
              <p>• All Canvas API calls are made server-side</p>
              <p>• Your API token is never exposed to the browser</p>
              <p>• Session cookies are http-only and secure</p>
              <p>• No data is stored except to Canvas</p>
            </div>
          </div>

          {/* About */}
          <div className="pt-2">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>About</h3>
            <div className="space-y-2 text-sm rounded-lg" style={{ color: 'var(--color-muted)', background: 'var(--color-glass)', padding: '0.75rem' }}>
              <p>Canvas Dashboard v0.1.0</p>
              <p>A private, secure dashboard for your Canvas LMS account.</p>
              <p>Built with Next.js, Tailwind CSS, and Canvas REST API.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 