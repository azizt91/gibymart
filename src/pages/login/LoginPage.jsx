import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeAuthAPI } from '../../services/api';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';
import {
  ShoppingBag,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  User,
  Lock,
  ShieldCheck,
  KeyRound,
  Users
} from 'lucide-react';

/**
 * Unified Login Page — Superadmin & Karyawan Authentication
 */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'karyawan' ? 'karyawan' : 'admin';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Admin form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Employee form state
  const [empIdentifier, setEmpIdentifier] = useState('');
  const [empPin, setEmpPin] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated as Superadmin
  useEffect(() => {
    if (isAuthenticated && activeTab === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, activeTab, navigate]);

  // Check if employee session already exists
  useEffect(() => {
    if (activeTab === 'karyawan') {
      const empSession = employeeAuthAPI.getCurrentSession();
      if (empSession?.id) {
        navigate('/karyawan/dashboard', { replace: true });
      }
    }
  }, [activeTab, navigate]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setError('');
    setSearchParams(newTab === 'karyawan' ? { tab: 'karyawan' } : {});
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Email/username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanUser, cleanPass);
      if (result.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(result.message || 'Login gagal. Periksa kembali akun Anda.');
      }
    } catch {
      setError('Terjadi gangguan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = empIdentifier.trim();
    const cleanPin = empPin.trim();

    if (!cleanId || !cleanPin) {
      setError('Nama/ID Karyawan dan PIN wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await employeeAuthAPI.login(cleanId, cleanPin);
      if (result.success) {
        navigate('/karyawan/dashboard', { replace: true });
      } else {
        setError(result.message || 'Login gagal. Periksa kembali nama/PIN Anda.');
      }
    } catch {
      setError('Terjadi gangguan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200/35 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 relative z-10 animate-fade-in"
        style={{ padding: '36px 32px' }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 mb-3 ring-4 ring-blue-50/80">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {APP_TAGLINE}
          </p>
        </div>

        {/* Tab Switcher: Super Admin vs Karyawan */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-5 border border-slate-200/60">
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('karyawan')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'karyawan'
                ? 'bg-white text-accent-blue shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Portal Karyawan</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-4 animate-slide-down font-medium">
            {error}
          </div>
        )}

        {/* FORM SUPER ADMIN */}
        {activeTab === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-user" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email / Username Admin
              </label>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan email admin atau username"
                  className="w-full h-11 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-accent-blue rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all block"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  disabled={isLoading}
                  autoComplete="username email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full h-11 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-accent-blue rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all block"
                  style={{ paddingLeft: '42px', paddingRight: '44px' }}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 z-10 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary-light active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-5 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk sebagai Superadmin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM KARYAWAN */
          <form onSubmit={handleEmployeeSubmit} className="space-y-4">
            <div>
              <label htmlFor="emp-user" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama atau ID Karyawan
              </label>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="emp-user"
                  type="text"
                  value={empIdentifier}
                  onChange={(e) => setEmpIdentifier(e.target.value)}
                  placeholder="Ketik nama Anda (misal: Budi / K001)"
                  className="w-full h-11 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-accent-blue rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all block"
                  style={{ paddingLeft: '42px', paddingRight: '16px' }}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="emp-pin" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  PIN Karyawan
                </label>
                <span className="text-[11px] text-accent-blue font-semibold">
                  Default PIN: 1234
                </span>
              </div>
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="emp-pin"
                  type={showPassword ? 'text' : 'password'}
                  maxLength={6}
                  value={empPin}
                  onChange={(e) => setEmpPin(e.target.value)}
                  placeholder="Masukkan 4-6 digit PIN"
                  className="w-full h-11 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-accent-blue rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all block font-mono"
                  style={{ paddingLeft: '42px', paddingRight: '44px' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 z-10 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-accent-blue hover:bg-blue-600 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-5 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa PIN...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard Karyawan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Public Portal Link */}
        <div className="mt-5 text-center pt-4 border-t border-slate-100">
          <Link
            to="/absensi"
            className="text-xs font-semibold text-slate-500 hover:text-accent-blue transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Portal Absensi Toko</span>
          </Link>
        </div>

        {/* Security Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Akses Terenkripsi & Aman • {APP_NAME}</span>
        </div>
      </div>
    </div>
  );
}
