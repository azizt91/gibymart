import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employeeAuthAPI, attendanceAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import {
  Clock,
  DollarSign,
  CalendarCheck,
  Calendar,
  LogOut,
  KeyRound,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [employee, setEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [summary, setSummary] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Change PIN Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    const session = employeeAuthAPI.getCurrentSession();
    if (!session || !session.id) {
      navigate('/login?tab=karyawan', { replace: true });
      return;
    }
    setEmployee(session);
    loadData(session.id, selectedMonth, selectedYear);
  }, [navigate, selectedMonth, selectedYear]);

  const loadData = async (empId, m, y) => {
    setIsLoading(true);
    try {
      const [sumRes, statusRes] = await Promise.all([
        employeeAuthAPI.getSummary(empId, m, y),
        attendanceAPI.getStatus(empId),
      ]);

      if (sumRes.success) {
        setSummary(sumRes.data);
      }
      if (statusRes.success) {
        setTodayStatus(statusRes.data);
      }
    } catch (err) {
      toast.error('Gagal memuat rekap kehadiran.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    employeeAuthAPI.logout();
    navigate('/login?tab=karyawan', { replace: true });
  };

  const handleQuickCheckIn = async () => {
    if (!employee?.id) return;
    setIsSubmittingAttendance(true);
    try {
      const res = await attendanceAPI.checkIn(employee.id);
      if (res.success) {
        toast.success(res.message || 'Absen masuk berhasil!');
        await loadData(employee.id, selectedMonth, selectedYear);
      } else {
        toast.error(res.message || 'Gagal absen masuk.');
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleQuickCheckOut = async () => {
    if (!employee?.id) return;
    setIsSubmittingAttendance(true);
    try {
      const res = await attendanceAPI.checkOut(employee.id);
      if (res.success) {
        toast.success(res.message || 'Absen pulang berhasil!');
        await loadData(employee.id, selectedMonth, selectedYear);
      } else {
        toast.error(res.message || 'Gagal absen pulang.');
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error('Konfirmasi PIN baru tidak cocok.');
      return;
    }
    if (newPin.length < 4) {
      toast.error('PIN baru minimal harus 4 karakter/angka.');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await employeeAuthAPI.changePin(employee.id, oldPin, newPin);
      if (res.success) {
        toast.success('PIN Anda berhasil diubah!');
        setIsPinModalOpen(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        toast.error(res.message || 'Gagal mengubah PIN.');
      }
    } catch {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsChangingPin(false);
    }
  };

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 pb-12">
      {/* Top Navbar */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white shadow-sm ring-2 ring-white/10 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight truncate">
                  Portal Karyawan
                </h1>
                <span className="text-[9px] sm:text-[10px] bg-accent-blue/30 text-blue-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-400/20">
                  GIBY MART
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate hidden sm:block">
                Sistem Absensi & Pantau Upah Mandiri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/20 cursor-pointer"
              title="Ganti PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Ganti PIN</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-200 hover:text-white transition-all border border-rose-400/30 cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Welcome Banner Card */}
        <div className="bg-gradient-to-r from-primary via-slate-800 to-primary-light rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-accent-blue text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ring-4 ring-white/15 shrink-0">
                {employee.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">
                    {employee.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                    Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-xs text-slate-200 font-medium">
                    Tarif: <strong className="text-emerald-300 font-bold">{formatRupiah(employee.hourlyRate)} / jam</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-xs text-amber-200 font-medium">
                    Uang Makan: <strong className="text-amber-300 font-bold">{formatRupiah(summary?.mealAllowance ?? employee.mealAllowance ?? 0)} / hari</strong>
                  </span>
                  {employee.employeeCode && (
                    <span className="text-[11px] font-mono text-blue-200 bg-accent-blue/25 px-2 py-0.5 rounded border border-blue-400/20">
                      Kode: {employee.employeeCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Attendance Action Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/20 md:w-80 shrink-0 shadow-inner">
              <div className="flex items-center justify-between text-xs font-semibold mb-2.5 text-slate-200">
                <span>Status Absensi Hari Ini:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  {todayStatus?.status === 'BEKERJA' ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                      Sedang Bekerja
                    </span>
                  ) : todayStatus?.status === 'HADIR' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      Selesai Bekerja
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      Belum Masuk
                    </span>
                  )}
                </span>
              </div>

              {todayStatus?.status === 'BEKERJA' ? (
                <button
                  type="button"
                  onClick={handleQuickCheckOut}
                  disabled={isSubmittingAttendance}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isSubmittingAttendance ? 'Memproses...' : 'Klik untuk Absen Pulang'}</span>
                </button>
              ) : todayStatus?.status === 'HADIR' ? (
                <div className="text-center py-2 px-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                  ✓ Anda sudah menyelesaikan absensi hari ini ({todayStatus.checkInTime} - {todayStatus.checkOutTime})
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickCheckIn}
                  disabled={isSubmittingAttendance}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent-blue hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmittingAttendance ? 'Memproses...' : 'Klik untuk Absen Masuk'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Toolbar & Month Selector */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Ringkasan Jam & Pendapatan
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Lihat akumulasi jam kerja dan estimasi total upah per bulan
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-blue cursor-pointer w-full"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-blue cursor-pointer w-full"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Total Jam Kerja */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Jam Kerja
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-accent-blue flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {isLoading ? '...' : summary?.durationFormatted || '0 Jam 0 Menit'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          {/* Total Pendapatan */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Total Pendapatan
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-emerald-700 tracking-tight font-mono">
              {isLoading ? '...' : formatRupiah(summary?.totalPay || 0)}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">
              {summary?.totalMealAllowance > 0
                ? `Termasuk uang makan ${formatRupiah(summary.totalMealAllowance)} (${summary.daysPresent} hari)`
                : 'Estimasi upah bersih bulan ini'}
            </p>
          </div>

          {/* Hari Kerja */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kehadiran
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {isLoading ? '...' : `${summary?.daysPresent || 0} Hari`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Jumlah hari masuk kerja tercatat
            </p>
          </div>
        </div>

        {/* Detailed Records Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-blue" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Rincian Absensi Harian — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </h4>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {summary?.records?.length || 0} Riwayat
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              Memuat rincian absensi...
            </div>
          ) : !summary?.records || summary.records.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs px-4">
              Belum ada data absensi pada bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Jam Masuk</th>
                      <th className="py-3 px-4">Jam Pulang</th>
                      <th className="py-3 px-4">Durasi Kerja</th>
                      <th className="py-3 px-4">Uang Makan</th>
                      <th className="py-3 px-4">Total Upah Harian</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {summary.records.map((row) => {
                      const hours = Math.floor((row.totalMinutes || 0) / 60);
                      const mins = (row.totalMinutes || 0) % 60;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {formatDateIndonesian(row.date)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {row.checkIn || '-'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {row.checkOut || '-'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {hours > 0 ? `${hours} jam ` : ''}{mins} menit
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-amber-600">
                            {row.mealAllowance ? formatRupiah(row.mealAllowance) : '-'}
                          </td>
                          <td className="py-3.5 px-4 font-bold font-mono text-emerald-600">
                            {formatRupiah(row.totalPay || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {row.status === 'BEKERJA' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-accent-blue border border-blue-200">
                                Bekerja
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hadir
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Sangat nyaman dilihat di layar HP) */}
              <div className="md:hidden p-3.5 space-y-2.5">
                {summary.records.map((row) => {
                  const hours = Math.floor((row.totalMinutes || 0) / 60);
                  const mins = (row.totalMinutes || 0) % 60;
                  return (
                    <div
                      key={row.id}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {formatDateIndonesian(row.date)}
                        </span>
                        {row.status === 'BEKERJA' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-accent-blue border border-blue-200">
                            Bekerja
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hadir
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Jam Masuk</span>
                          <span className="font-mono font-bold text-slate-800">{row.checkIn || '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Jam Pulang</span>
                          <span className="font-mono font-bold text-slate-800">{row.checkOut || '-'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Durasi</span>
                          <span className="font-semibold text-slate-700">
                            {hours > 0 ? `${hours}j ` : ''}{mins}m
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Uang Makan</span>
                          <span className="font-semibold text-amber-600">
                            {row.mealAllowance ? formatRupiah(row.mealAllowance) : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Upah Jam Kerja</span>
                          <span className="font-semibold text-slate-700">
                            {formatRupiah(row.workPay || 0)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Total Upah Harian</span>
                          <span className="font-mono font-bold text-emerald-600 text-sm">
                            {formatRupiah(row.totalPay || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Change PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ubah PIN Karyawan</h3>
                <p className="text-xs text-slate-500 font-medium">Buat PIN baru yang mudah Anda ingat</p>
              </div>
            </div>

            <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PIN Lama
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="PIN saat ini (default: 1234)"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:border-accent-blue focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PIN Baru
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Minimal 4 digit angka"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:border-accent-blue focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Konfirmasi PIN Baru
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Ulangi PIN baru"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:border-accent-blue focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  disabled={isChangingPin}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-accent-blue hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {isChangingPin ? 'Menyimpan...' : 'Simpan PIN Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
