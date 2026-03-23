import Link from 'next/link';
import SidebarClient from './SidebarClient';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside 
      className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 z-30 border-r border-slate-200 dark:border-slate-700"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <div className="text-2xl font-semibold px-6 py-5">Canvas</div>
      {/* Render nav without highlight on server */}
      <nav className="flex-1">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={"block px-6 py-2 rounded hover:bg-accent/10 transition-colors"}
              data-sidebar-link={item.href}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </nav>
      {/* Client-side highlight and logout */}
      <SidebarClient navItems={navItems} />
    </aside>
  );
} 