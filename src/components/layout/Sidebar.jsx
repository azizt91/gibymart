import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileText,
  CalendarDays,
  Settings,
  History,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/absensi', label: 'Absensi', icon: CalendarCheck },
  { path: '/admin/karyawan', label: 'Data Karyawan', icon: Users },
  { path: '/admin/rekap', label: 'Rekap Bulanan', icon: FileText },
  { path: '/admin/rekap-harian', label: 'Rekap Harian', icon: CalendarDays },
  { path: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
  { path: '/admin/log-aktivitas', label: 'Log Aktivitas', icon: History },
];

export default function Sidebar({ onItemClick }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    if (onItemClick) onItemClick();
  };

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-full shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-primary-light/40 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-accent-blue flex items-center justify-center text-white shadow-md shrink-0">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-lg tracking-tight text-white leading-tight truncate">
            {APP_NAME}
          </h1>
          <p className="text-[11px] text-blue-200/90 font-semibold tracking-wider uppercase">
            Sistem Absensi
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3.5 py-5 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Menu Utama
        </p>

        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) => `
                  flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-accent-blue text-white shadow-md shadow-blue-900/40 ring-1 ring-white/20'
                    : 'text-slate-300 hover:bg-primary-light/70 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Admin User Info & Logout Footer */}
      <div className="p-4 border-t border-primary-light/40 bg-primary-light/20">
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-primary-light/40 border border-primary-light/40">
          <div className="w-10 h-10 rounded-full bg-accent-blue text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm ring-2 ring-white/20">
            {admin?.username ? admin.username.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {admin?.username || 'Administrator'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{admin?.role || 'SUPERADMIN'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-colors duration-200 border border-rose-500/30 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
