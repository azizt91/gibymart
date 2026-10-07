import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

export default function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-light overflow-hidden font-sans text-text-dark">
      {/* Sidebar Desktop (Fixed width 64 = 16rem) */}
      <div className="hidden lg:block h-full shrink-0 z-20">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <Header onToggleMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Scrollable Page Content Outlet */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
          <div className="max-w-7xl w-full mx-auto flex flex-col gap-6" style={{ gap: '24px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
