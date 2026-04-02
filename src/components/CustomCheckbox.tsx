'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children: React.ReactNode;
}

export default function CustomCheckbox({ checked = false, onChange, children }: CustomCheckboxProps) {
  return (
    <motion.label 
      className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg transition-colors hover:ring-1 hover:ring-[var(--color-border)]"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only"
        />
        <motion.div 
          className={`
            w-5 h-5 border-2 rounded flex items-center justify-center
            ${checked 
              ? 'border-amber-600 bg-amber-600' 
              : 'border-amber-300 hover:border-amber-400'
            }
          `}
          initial={false}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1,
            rotate: checked ? [0, 10, -10, 0] : 0,
          }}
          transition={{
            scale: { duration: 0.3, ease: "easeOut" },
            rotate: { duration: 0.4, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {checked && (
              <motion.svg 
                className="w-3 h-3 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  duration: 0.3
                }}
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <motion.span 
        className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors"
        animate={{ x: checked ? 2 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.label>
  );
} 