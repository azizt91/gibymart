import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  ExternalLink
} from 'lucide-react';
import useClock from '../../hooks/useClock';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndonesian } from '../../utils/formatters';

const pageTitles = {
  '/admin/dashboard': 'Dashboard Utama',
  '/admin/absensi': 'Absensi Admin',
  '/admin/karyawan': 'Data Karyawan',
  '/admin/rekap': 'Rekap Bulanan',
  '/admin/rekap-harian': 'Rekap Harian',
  '/admin/pengaturan': 'Pengaturan Sistem',
  '/admin/log-aktivitas': 'Log Aktivitas',
};

export default function Header({ onToggleMobileNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const { date, timeString } = useClock();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const dropdownRef = useRef(null);

  const currentTitle = pageTitles[location.pathname] || 'Dashboard Utama';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Toggle & Clean Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none border border-slate-200/60"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400">
            <span className="hover:text-slate-600 transition-colors">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800">{currentTitle}</span>
          </div>
        </div>

        {/* Right Side: Portal Link, Real-time Clock, Bell & Admin Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Public Portal Quick Link */}
          <Link
            to="/absensi"
            target="_blank"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-accent-blue bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 transition-colors"
            title="Buka Portal Absensi Publik di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Portal Absensi</span>
          </Link>

          {/* Real-time Clock Pill Widget */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-accent-blue" />
            <span className="font-mono text-sm font-bold text-slate-800">{timeString}</span>
            <span className="text-slate-300">|</span>
            <span className="hidden xl:inline text-slate-500">{formatDateIndonesian(date)}</span>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setHasUnreadNotification(false)}
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotification && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-xs">
                {admin?.username ? admin.username.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {admin?.username || 'Admin GIBY'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {admin?.role || 'SUPERADMIN'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-scale-up">
                <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                  <p className="text-xs font-bold text-slate-800">{admin?.username}</p>
                  <p className="text-[10px] text-slate-500">{admin?.role}</p>
                </div>

                <Link
                  to="/admin/pengaturan"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Pengaturan Akun</span>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-accent-red hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
