'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="relative p-2.5 rounded-lg transition-colors hover:opacity-80 hover:bg-accent/10"
      style={
        isActive
          ? { background: 'var(--color-accent)', color: '#fff' } // todo: Update bg color when clicked to match the click highlight of other navigation bar items.
          : { color: 'var(--color-muted)', background: 'transparent' }
      }
    >
      {children}
    </Link>
  );
}
