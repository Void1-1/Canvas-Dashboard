'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider'; // Adjust path as needed

interface DarkModeSwitchProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DarkModeSwitch({ className = '', size = 'md' }: DarkModeSwitchProps) {
  const { darkMode: isDark, toggleDarkMode } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggle = () => {
    toggleDarkMode();
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-13 h-7'
  };

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15
  };

  const thumbSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const thumbPositions = {
    sm: { x: isDark ? 16 : 1 },
    md: { x: isDark ? 20 : 1 },
    lg: { x: isDark ? 24 : 1 }
  };

  return (
    <motion.button
      className={`relative inline-flex items-center rounded-full transition-colors duration-300 ${sizeClasses[size]} ${className}`}
      style={{
        background: isDark ? '#d97706' : '#fef3c7'
      }}
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isTransitioning ? { scale: [1, 1.1, 1] } : {}}
      transition={{ 
        scale: { duration: 0.3, ease: "easeInOut" }
      }}
    >
      {/* Animated thumb */}
      <motion.div
        className={`absolute top-0.5 ${thumbSizes[size]} bg-white rounded-full shadow-md flex items-center justify-center`}
        animate={thumbPositions[size]}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        <motion.div
          animate={{
            rotate: isDark ? 0 : 0,
            scale: 1
          }}
          transition={{
            duration: 0.3
          }}
          className="flex items-center justify-center w-full h-full"
        >
          {isDark ? (
            <Moon size={iconSizes[size]} className="text-amber-600" style={{ transform: 'rotate(45deg)' }} />
          ) : (
            <Sun size={iconSizes[size]} className="text-amber-500" />
          )}
        </motion.div>
      </motion.div>

      {/* Background gradient animation */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-20"
        animate={{
          background: isDark 
            ? 'linear-gradient(45deg, #d97706, #b45309)' 
            : 'linear-gradient(45deg, #fef3c7, #fde68a)'
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}