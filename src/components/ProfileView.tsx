'use client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SettingsPanel from './SettingsPanel';
import DisplayNameModal from './DisplayNameModal';

export default function ProfileView({
  user,
  dashboardUsername = null,
  displayName: initialDisplayName = null,
}: {
  user: any;
  dashboardUsername?: string | null;
  displayName?: string | null;
}) {
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar_url ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarMessage(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/account/update-avatar', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        setAvatarMessage({ type: 'success', text: 'Avatar updated successfully.' });
      } else {
        setAvatarMessage({ type: 'error', text: data.error ?? 'Failed to update avatar.' });
      }
    } catch {
      setAvatarMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto mt-4 md:mt-10 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ color: 'var(--color-text)' }}
    >
      {/* Profile Section */}
      <motion.div
        className="rounded-lg shadow p-4 md:p-8 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="flex flex-col items-center mb-4">
          <motion.img
            src={avatarUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label="Upload avatar image"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-3 text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              background: 'transparent',
            }}
            whileHover={{ scale: avatarUploading ? 1 : 1.04 }}
            whileTap={{ scale: avatarUploading ? 1 : 0.97 }}
          >
            {avatarUploading ? 'Uploading...' : 'Change Avatar'}
          </motion.button>
          {avatarMessage && (
            <motion.p
              className="mt-2 text-xs"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: avatarMessage.type === 'success' ? 'var(--color-accent)' : '#ef4444' }}
            >
              {avatarMessage.text}
            </motion.p>
          )}
        </div>
        <motion.h1
          className="text-2xl font-bold mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ color: 'var(--color-text)' }}
        >
          {user.name}
        </motion.h1>
        <motion.p
          className="mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ color: 'var(--color-muted)' }}
        >
          {user.primary_email}
        </motion.p>
        {dashboardUsername && (
          <motion.div
            className="flex items-center gap-2 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
          >
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Dashboard login: <span style={{ color: 'var(--color-text)' }}>{dashboardUsername}</span>
            </p>
            <motion.button
              onClick={() => setShowDisplayNameModal(true)}
              className="text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                background: 'transparent',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {displayName ? 'Edit display name' : 'Set display name'}
            </motion.button>
          </motion.div>
        )}
        {displayName && (
          <motion.p
            className="text-sm mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'var(--color-muted)' }}
          >
            Display name: <span style={{ color: 'var(--color-text)' }}>{displayName}</span>
          </motion.p>
        )}
        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[
            { label: 'ID', value: user.id },
            { label: 'Short Name', value: user.short_name },
            { label: 'Login ID', value: user.login_id },
            { label: 'Sortable Name', value: user.sortable_name },
            { label: 'Locale', value: user.locale || 'N/A' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              className={`flex items-baseline gap-3 justify-between py-2${idx < 4 ? ' border-b' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.45 + idx * 0.05 }}
              style={idx < 4 ? { borderColor: 'var(--color-border)' } : {}}
            >
              <span className="font-medium flex-shrink-0" style={{ color: 'var(--color-text)' }}>{item.label}</span>
              <span className="text-right break-all min-w-0" style={{ color: 'var(--color-muted)' }}>{item.value}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Settings Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <SettingsPanel user={user} dashboardUsername={dashboardUsername} />
      </motion.div>

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onClose={() => setShowDisplayNameModal(false)}
        initialDisplayName={displayName}
        onSaved={(name) => setDisplayName(name)}
      />
    </motion.div>
  );
}
