'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('canvas-redo-theme');
    
    let shouldUseDark: boolean;
    
    if (stored === 'dark') {
      shouldUseDark = true;
    } else if (stored === 'light') {
      shouldUseDark = false;
    } else {
      // Only use system preference if no saved preference exists
      shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setDarkModeState(shouldUseDark);
    setMounted(true);
  }, []);

  // Update DOM and localStorage when dark mode changes
  useEffect(() => {
    if (!mounted) return; // Don't run on initial render
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('canvas-redo-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('canvas-redo-theme', 'light');
    }
  }, [darkMode, mounted]);

  // Memoize callbacks to prevent unnecessary re-renders
  const setDarkMode = React.useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  const toggleDarkMode = React.useCallback(() => {
    setDarkModeState((d) => !d);
  }, []);

  // Memoize context value to prevent re-renders
  const contextValue = React.useMemo(
    () => ({ darkMode, setDarkMode, toggleDarkMode }),
    [darkMode, setDarkMode, toggleDarkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}