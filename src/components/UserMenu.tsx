'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface UserProfile {
  name: string;
  primary_email: string;
  avatar_url: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <motion.div 
        className="flex items-center space-x-2 animate-pulse backdrop-blur rounded-full px-3 py-2 shadow-lg"
        style={{ background: 'rgba(36,36,54,0.85)', border: '1px solid var(--color-border)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-muted)' }} />
        <div className="h-4 w-20 rounded" style={{ background: 'var(--color-muted)' }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href="/profile"
        className="flex items-center space-x-3 cursor-pointer group rounded-full px-3 py-2 border shadow-lg transition-all duration-200 hover:shadow-xl"
        style={{
          background: 'rgba(30,30,40,0.92)', // fallback for dark mode
          backgroundColor: 'var(--color-surface, #fff)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <motion.img
          src={user.avatar_url}
          alt="Avatar"
          className="w-8 h-8 rounded-full border"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
        <div className="flex flex-col">
          <span
            className="font-medium group-hover:text-[var(--color-accent)]"
            style={{ color: 'var(--color-text)' }}
          >
            {user.name}
          </span>
          <span
            className="text-xs group-hover:text-[var(--color-accent)]"
            style={{ color: 'var(--color-muted)' }}
          >
            {user.primary_email}
          </span>
        </div>
      </Link>
    </motion.div>
  );
} 