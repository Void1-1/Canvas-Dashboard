'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home, ListCollapse, ClipboardList, BarChart2, Users, Megaphone, CheckSquare, MessageSquare, BookOpen, FileText, Folder, HelpCircle } from 'lucide-react';

type NavItem =
  | { section: string; label: string; icon: React.ReactNode; href?: never }
  | { href: string; label: string; icon: React.ReactNode; section?: never };

const navItems: NavItem[] = [
  { section: '', label: 'Home', icon: <Home size={14} /> },
  { section: 'modules', label: 'Modules', icon: <ListCollapse size={14} /> },
  { section: 'assignments', label: 'Assignments', icon: <ClipboardList size={14} /> },
  { section: 'grades', label: 'Grades', icon: <BarChart2 size={14} /> },
  { section: 'people', label: 'People', icon: <Users size={14} /> },
  { section: 'announcements', label: 'Announcements', icon: <Megaphone size={14} /> },
  { section: 'discussions', label: 'Discussions', icon: <MessageSquare size={14} /> },
  { section: 'pages', label: 'Pages', icon: <BookOpen size={14} /> },
  { section: 'syllabus', label: 'Syllabus', icon: <FileText size={14} /> },
  { section: 'files', label: 'Files', icon: <Folder size={14} /> },
  { section: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={14} /> },
  { href: '/todo', label: 'To-do', icon: <CheckSquare size={14} /> },
];

export default function CourseMobileHeader({ courseId }: { courseId: string }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-30 border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
      {/* Back row — pl-14 leaves room for the hamburger button (fixed top-4 left-4) */}
      <div className="flex items-center pl-14 pr-3 py-2">
        <Link
          href="/classes"
          className="flex items-center gap-1 text-sm font-medium text-accent hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={18} />
          Classes
        </Link>
      </div>
      {/* Course section tabs — horizontal scroll */}
      <div className="flex overflow-x-auto gap-1 pl-14 pr-2 pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const href = item.href
            ? item.href
            : `/classes/${courseId}${item.section ? `/${item.section}` : ''}`;
          const isActive = item.href
            ? pathname === item.href
            : pathname === href || (item.section === '' && pathname === `/classes/${courseId}`);
          return (
            <Link
              key={item.href ?? item.section ?? 'home'}
              href={href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive ? 'bg-accent text-white' : 'hover:bg-accent/10'
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
