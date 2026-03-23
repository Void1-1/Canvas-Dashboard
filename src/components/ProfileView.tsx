'use client';
import { motion } from 'framer-motion';
import SettingsPanel from './SettingsPanel';

export default function ProfileView({
  user,
  dashboardUsername = null,
}: {
  user: any;
  dashboardUsername?: string | null;
}) {
  return (
    <motion.div
      className="max-w-6xl mx-auto mt-10 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ color: 'var(--color-text)' }}
    >
      {/* Profile Section */}
      <motion.div
        className="rounded-lg shadow p-8 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{ background: 'var(--color-surface)' }}
      >
        <motion.img
          src={user.avatar_url}
          alt="Avatar"
          className="w-24 h-24 rounded-full border mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
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
          <motion.p
            className="text-sm mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            style={{ color: 'var(--color-muted)' }}
          >
            Dashboard login: <span style={{ color: 'var(--color-text)' }}>{dashboardUsername}</span>
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
              className={`flex justify-between py-2${idx < 4 ? ' border-b' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.45 + idx * 0.05 }}
              style={idx < 4 ? { borderColor: 'var(--color-border)' } : {}}
            >
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
              <span style={{ color: 'var(--color-muted)' }}>{item.value}</span>
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

    </motion.div>
  );
} 