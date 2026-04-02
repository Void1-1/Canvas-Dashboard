import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'Canvas Dashboard',
  description: 'Personal Canvas dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 