import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, Lock, User } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-light flex flex-col font-sans text-text-dark">
      {/* Public Header Navbar */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">
                {APP_NAME}
              </h1>
              <p className="text-[11px] text-slate-300 font-medium tracking-wide uppercase">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          {/* Action Buttons: Portal Karyawan & Admin Login */}
          <div className="flex items-center gap-2">
            <Link
              to="/login?tab=karyawan"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-accent-blue hover:bg-blue-600 text-white transition-all duration-200 shadow-sm shadow-blue-500/20 active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Portal Karyawan</span>
            </Link>

            <Link
              to="/login?tab=admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all duration-200 border border-white/20"
            >
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Super Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Public Attendance Portal Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>

      {/* Public Footer */}
      <footer className="py-4 text-center text-xs text-text-muted border-t border-slate-200/60 bg-white">
        <p>© {new Date().getFullYear()} {APP_NAME} • All rights reserved</p>
      </footer>
    </div>
  );
}
