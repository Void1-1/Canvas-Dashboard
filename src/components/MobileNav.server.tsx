import MobileNavClient from './MobileNavClient';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/grades', label: 'Grades' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/announcements', label: 'Announcements' },
];

export default function MobileNav({ currentPath }: { currentPath: string }) {
  return <MobileNavClient navItems={navItems} currentPath={currentPath} />;
} 