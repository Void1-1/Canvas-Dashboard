import Sidebar from './Sidebar.server';
import MobileNav from './MobileNav.server';
import UserMenu from './UserMenu.server';
import CanvasTokenRenewalModal from './CanvasTokenRenewalModal';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

// Only wrap UserMenu in Suspense since it's the only async server component
// Sidebar and MobileNav are synchronous and don't need Suspense
function UserMenuWrapper() {
  return (
    <Suspense fallback={null}>
      <UserMenu />
    </Suspense>
  );
}

export default function DashboardShell({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <CanvasTokenRenewalModal />
      {/* Sidebar: fixed width, sticky, full height */}
      <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 left-0 z-30">
        <Sidebar currentPath={currentPath} />
      </div>
      {/* Main content: fills remaining space, scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed top-4 right-4 z-50">
          <UserMenuWrapper />
        </div>
        <div className="md:hidden">
          <MobileNav currentPath={currentPath} />
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
} 