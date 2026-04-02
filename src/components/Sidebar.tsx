'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLogoutWithFade } from './useLogoutWithFade';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/todo', label: 'To-do' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isFading, handleLogout } = useLogoutWithFade();

  return (
    <motion.aside
      className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 z-30 border-r border-slate-200 dark:border-slate-700"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      animate={{ opacity: isFading ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-2xl font-semibold px-6 py-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Canvas
      </motion.div>
      <nav className="flex-1">
        {navItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              href={item.href}
              className={`block px-6 py-2 rounded hover:bg-accent/10 transition-colors ${
                pathname === item.href ? 'bg-accent/20 font-medium' : ''
              }`}
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
      </nav>
      <div className="px-6 pb-6">
        <motion.button 
          className="w-full py-2 bg-accent hover:opacity-90 text-white rounded transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          disabled={isFading}
        >
          Logout
        </motion.button>
      </div>
    </motion.aside>
  );
} 