'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home, ListCollapse, ClipboardList, BarChart2, Users, Megaphone } from 'lucide-react';

const navItems = [
  { section: '', label: 'Home', icon: <Home size={16} /> },
  { section: 'modules', label: 'Modules', icon: <ListCollapse size={16} /> },
  { section: 'assignments', label: 'Assignments', icon: <ClipboardList size={16} /> },
  { section: 'grades', label: 'Grades', icon: <BarChart2 size={16} /> },
  { section: 'people', label: 'People', icon: <Users size={16} /> },
  { section: 'announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
];

export default function CourseMobileHeader({ courseId }: { courseId: string }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-30 border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
      {/* Back row */}
      <div className="flex items-center px-3 py-2">
        <Link
          href="/classes"
          className="flex items-center gap-1 text-sm font-medium text-accent hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={18} />
          Classes
        </Link>
      </div>
      {/* Course section tabs — horizontal scroll */}
      <div className="flex overflow-x-auto gap-1 px-2 pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const href = `/classes/${courseId}${item.section ? `/${item.section}` : ''}`;
          const isActive =
            pathname === href ||
            (item.section === '' && pathname === `/classes/${courseId}`);
          return (
            <Link
              key={item.section || 'home'}
              href={href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'hover:bg-accent/10'
              }`}
              style={isActive ? {} : { color: 'var(--color-muted)' }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
