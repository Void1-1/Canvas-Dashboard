import Link from 'next/link';
import { Suspense } from 'react';
import { Bell, Mail } from 'lucide-react';
import SidebarClient from './SidebarClient';
import SidebarIconLink from './SidebarIconLink';
import UserMenu from './UserMenu.server';
import NotificationBadge from './NotificationBadge.server';
import SearchModal from './SearchModal';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/todo', label: 'To-do' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default function Sidebar({ currentPath: _currentPath }: { currentPath: string }) {
  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 z-30 border-r"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
    >
      <div className="text-2xl font-semibold px-6 py-5">Canvas</div>

      {/* Main nav links */}
      <nav className="flex-1 space-y-1 pt-1">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between px-6 py-2 rounded hover:bg-accent/10 transition-colors"
              data-sidebar-link={item.href}
            >
              <span>{item.label}</span>
            </Link>
          </div>
        ))}
      </nav>

      {/* Secondary icon nav (search, inbox, notifications) */}
      <div
        className="px-4 py-2 flex items-center justify-center gap-1 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <SearchModal />
        <SidebarIconLink href="/inbox" label="Inbox">
          <Mail className="w-6 h-6" />
        </SidebarIconLink>
        <SidebarIconLink href="/notifications" label="Notifications">
          <Bell className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 z-10 pointer-events-none">
            <Suspense fallback={null}>
              <NotificationBadge />
            </Suspense>
          </div>
        </SidebarIconLink>
      </div>

      {/* Bottom: profile + logout */}
      <div className="pb-4 space-y-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
        <Suspense
          fallback={
            <div className="mx-3 px-3 py-2.5 rounded-lg animate-pulse flex items-center gap-3" style={{ background: 'var(--color-glass)' }}>
              <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--color-border)' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded" style={{ background: 'var(--color-border)' }} />
                <div className="h-2.5 w-32 rounded" style={{ background: 'var(--color-border)' }} />
              </div>
            </div>
          }
        >
          <UserMenu />
        </Suspense>
        <SidebarClient navItems={navItems} />
      </div>
    </aside>
  );
}
