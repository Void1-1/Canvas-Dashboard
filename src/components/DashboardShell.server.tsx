import Sidebar from './Sidebar.server';
import MobileNav from './MobileNav.server';
import CanvasTokenRenewalModal from './CanvasTokenRenewalModal';
import type { ReactNode } from 'react';

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
        <div className="md:hidden">
          <MobileNav currentPath={currentPath} />
        </div>
        <div className="flex-1 pt-16 px-4 pb-4 sm:px-6 sm:pb-6 md:p-8 overflow-y-auto">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
