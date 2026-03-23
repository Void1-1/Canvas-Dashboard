import '../../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Sign in - Canvas Dashboard',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {children}
    </div>
  );
} 