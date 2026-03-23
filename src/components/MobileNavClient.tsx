'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogoutWithFade } from './useLogoutWithFade';

interface NavItem {
  href: string;
  label: string;
}

export default function MobileNavClient({ navItems, onMenuOpenChange }: {
  navItems: NavItem[];
  currentPath?: string;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isFading, handleLogout } = useLogoutWithFade();
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (onMenuOpenChange) onMenuOpenChange(isOpen);
  }, [isOpen, onMenuOpenChange]);

  return (
    <>
      {/* Mobile menu button */}
      <motion.div 
        className="md:hidden fixed top-4 left-4 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isOpen ? 0 : 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg shadow-lg"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Mobile navigation overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" 
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFading ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="fixed left-0 top-0 h-full w-64 shadow-lg"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="p-4">
                <motion.div 
                  className="text-xl font-semibold mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  Dashboard
                </motion.div>
                <nav className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-2 rounded transition-colors ${
                          pathname === item.href ? 'bg-accent/20 text-accent font-medium' : 'hover:bg-accent/10'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>
                <div className="mt-6">
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 