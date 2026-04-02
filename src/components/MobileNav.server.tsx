import { Suspense } from 'react';
import MobileNavClient from './MobileNavClient';
import UserMenu from './UserMenu.server';
import NotificationBadge from './NotificationBadge.server';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/todo', label: 'To-do' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default function MobileNav({ currentPath }: { currentPath: string }) {
  return (
    <MobileNavClient
      navItems={navItems}
      currentPath={currentPath}
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
  );
}
