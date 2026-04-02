'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLogoutWithFade } from './useLogoutWithFade';

interface NavItem {
  href: string;
  label: string;
}

export default function SidebarClient({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const { isFading, handleLogout } = useLogoutWithFade();

  useEffect(() => {
    // Remove highlight from all nav links
    document.querySelectorAll('[data-sidebar-link]')?.forEach((el) => {
      el.classList.remove('bg-accent/15', 'font-medium', 'text-accent');
    });
    // Add highlight to the active nav link
    const active = document.querySelector(`[data-sidebar-link="${pathname}"]`);
    if (active) {
      active.classList.add('bg-accent/15', 'font-medium', 'text-accent');
    }
  }, [pathname]);

  return (
    <div className="px-6 pb-2">
      <motion.button
        className="w-full py-2 bg-accent hover:opacity-90 text-white rounded transition-opacity"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        disabled={isFading}
        animate={{ opacity: isFading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        Logout
      </motion.button>
    </div>
  );
} 