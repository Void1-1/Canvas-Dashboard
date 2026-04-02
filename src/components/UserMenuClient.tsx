'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface UserProfile {
  name: string;
  primary_email: string;
  avatar_url: string;
}

export default function UserMenuClient({ user }: { user: UserProfile | null }) {
  const pathname = usePathname();
  const isActive = pathname === '/profile';

  if (!user) {
    return (
      <div className="px-6 py-2 animate-pulse flex items-center gap-3">
        <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'var(--color-border)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded" style={{ background: 'var(--color-border)' }} />
          <div className="h-2.5 w-28 rounded" style={{ background: 'var(--color-border)' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/profile"
        className={`flex items-center gap-3 px-6 py-2 rounded transition-colors group ${
          isActive ? 'bg-accent/15' : 'hover:bg-accent/10'
        }`}
        style={{ color: 'var(--color-text)' }}
      >
        <img
          src={user.avatar_url}
          alt="Avatar"
          className="w-6 h-6 rounded-full border flex-shrink-0"
          style={{ borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)' }}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate leading-tight transition-colors ${isActive ? 'text-[var(--color-accent)]' : 'group-hover:text-[var(--color-accent)]'}`}
            style={isActive ? {} : { color: 'var(--color-text)' }}
          >
            {user.name}
          </p>
          <p
            className={`text-xs truncate leading-tight transition-colors ${isActive ? 'text-[var(--color-accent)]' : 'group-hover:text-[var(--color-accent)]'}`}
            style={isActive ? {} : { color: 'var(--color-muted)' }}
          >
            {user.primary_email}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
