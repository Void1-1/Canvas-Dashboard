import CollapsedSidebar from '@/components/CollapsedSidebar';
import CourseNavSidebar from '@/components/CourseNavSidebar';
import CourseMobileHeader from '@/components/CourseMobileHeader';
import MobileNavClient from '@/components/MobileNavClient';
import UserMenu from '@/components/UserMenu.server';
import NotificationBadge from '@/components/NotificationBadge.server';
import { Suspense } from 'react';
import React from 'react';

const mainNavItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/todo', label: 'To-do' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="hidden md:block relative z-40">
        <CollapsedSidebar />
      </div>
      <div className="hidden md:block relative z-30">
        <CourseNavSidebar courseId={id} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <MobileNavClient
          navItems={mainNavItems}
          notificationBadge={
            <Suspense fallback={null}>
              <NotificationBadge />
            </Suspense>
          }
        >
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </MobileNavClient>
        <CourseMobileHeader courseId={id} />
        <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
