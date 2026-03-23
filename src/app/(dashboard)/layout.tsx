import DashboardShell from '@/components/DashboardShell.server';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <DashboardShell currentPath={pathname}>{children}</DashboardShell>
    </div>
  );
} 