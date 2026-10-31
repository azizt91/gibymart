import { useState, useEffect } from 'react';
import { useClock } from '../../hooks/useClock';
import { employeeAPI, attendanceAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import useRealtimeAttendance from '../../hooks/useRealtimeAttendance';
import PullToRefresh from '../../components/ui/PullToRefresh';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { formatDateIndonesian, formatRupiah } from '../../utils/formatters';
import {
  LogIn,
  LogOut,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Smartphone,
  Share2,
  PlusSquare
} from 'lucide-react';

export default function AttendancePage() {
  const { date, timeString } = useClock();
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastActionSuccess, setLastActionSuccess] = useState(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        toast.success('Aplikasi GIBY Absensi berhasil dipasang!');
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const fetchActiveEmployees = async (isSilent = false) => {
    if (!isSilent) setIsLoadingEmployees(true);
    try {
      const res = await employeeAPI.getActive();
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch {
      if (!isSilent) toast.error('Gagal memuat list karyawan.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchEmployeeStatus = async (employeeId) => {
    setIsLoadingStatus(true);
    try {
      const res = await attendanceAPI.getStatus(employeeId);
      if (res.success) {
        setAttendanceStatus(res.data);
      }
    } catch {
      toast.error('Gagal mengecek status absensi.');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Fetch active employees dropdown on mount
  useEffect(() => {
    fetchActiveEmployees();
  }, []);

  // Realtime listener untuk karyawan dan absensi
  useRealtimeAttendance(() => {
    fetchActiveEmployees(true);
    if (selectedEmployeeId) {
      fetchEmployeeStatus(selectedEmployeeId);
    }
  }, ['employees', 'attendance']);

  // Fetch status whenever selected employee changes
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeStatus(selectedEmployeeId);
    } else {
      setAttendanceStatus(null);
      setLastActionSuccess(null);
    }
  }, [selectedEmployeeId]);

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      toast.warning('Silakan pilih nama karyawan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await attendanceAPI.checkIn(selectedEmployeeId);
      if (res.success) {
        toast.success(res.message || 'Absen masuk berhasil!');
        setLastActionSuccess({
          type: 'checkIn',
          message: `Absen masuk berhasil pada jam ${res.data.time}`,
          time: res.data.time,
        });
        await fetchEmployeeStatus(selectedEmployeeId);
      } else {
        toast.error(res.message || 'Gagal melakukan absen masuk.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployeeId) {
      toast.warning('Silakan pilih nama karyawan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await attendanceAPI.checkOut(selectedEmployeeId);
      if (res.success) {
        toast.success(res.message || 'Absen pulang berhasil!');
        setLastActionSuccess({
          type: 'checkOut',
          message: `Absen pulang berhasil. Total durasi kerja: ${res.data.totalHours} jam. Upah hari ini: ${formatRupiah(res.data.totalPay)}`,
          time: res.data.time,
          totalPay: res.data.totalPay,
          totalHours: res.data.totalHours,
        });
        await fetchEmployeeStatus(selectedEmployeeId);
      } else {
        toast.error(res.message || 'Gagal melakukan absen pulang.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name} (${emp.employeeCode || 'Karyawan'})`,
  }));


  return (
    <PullToRefresh
      onRefresh={async () => {
        await fetchActiveEmployees(true);
        if (selectedEmployeeId) {
          await fetchEmployeeStatus(selectedEmployeeId);
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-fade-in">
        {/* Card Banner Header */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white text-center">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-1">
            Portal Absensi Karyawan
          </p>
          <h2 className="text-2xl font-black tracking-tight">{formatDateIndonesian(date)}</h2>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* PWA Install Banner (Visible if not in standalone PWA mode) */}
          {!isStandalone && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-accent-blue text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    Pasang Aplikasi di HP
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Akses cepat 1-klik langsung dari layar utama tanpa buka browser
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={PlusSquare}
                onClick={handleInstallClick}
                className="shrink-0 text-xs shadow-sm shadow-blue-500/20"
              >
                Pasang
              </Button>
            </div>
          )}

          {/* Clock Display Card */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-blue" />
              Waktu Real-Time (WIB)
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-slate-800 tracking-tight">
              {timeString}
            </div>
          </div>

          {/* Employee Selection Dropdown */}
          <div className="space-y-1.5">
            <Select
              label="Pilih Nama Anda"
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              placeholder="-- Pilih nama karyawan untuk absensi --"
              isDisabled={isLoadingEmployees || isSubmitting}
              icon={UserCheck}
            />
            {isLoadingEmployees && (
              <p className="text-xs text-slate-400 animate-pulse">Memuat daftar karyawan...</p>
            )}
          </div>

          {/* Status Details for Selected Employee */}
          {selectedEmployeeId && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Status Absensi Hari Ini:</span>
                {isLoadingStatus ? (
                  <span className="text-xs text-slate-400">Memeriksa status...</span>
                ) : attendanceStatus?.status === 'HADIR' ? (
                  <Badge variant="green" size="md">SUDAH PULANG</Badge>
                ) : attendanceStatus?.status === 'BEKERJA' ? (
                  <Badge variant="orange" size="md" dot>SEDANG BEKERJA</Badge>
                ) : (
                  <Badge variant="gray" size="md">BELUM ABSEN</Badge>
                )}
              </div>

              {attendanceStatus && !isLoadingStatus && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jam Masuk:</span>
                    <strong className="text-slate-700 font-mono text-sm">
                      {attendanceStatus.checkIn || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jam Pulang:</span>
                    <strong className="text-slate-700 font-mono text-sm">
                      {attendanceStatus.checkOut || '-'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Success Alert Message */}
          {lastActionSuccess && (
            <Alert
              variant="success"
              title="Aksi Berhasil"
              icon={CheckCircle2}
              className="animate-slide-down"
            >
              {lastActionSuccess.message}
            </Alert>
          )}

          {/* Action Buttons: Absen Masuk & Absen Pulang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <Button
              variant="success"
              size="lg"
              icon={LogIn}
              onClick={handleCheckIn}
              isLoading={isSubmitting}
              isDisabled={
                !selectedEmployeeId ||
                isLoadingStatus ||
                attendanceStatus?.status === 'BEKERJA' ||
                attendanceStatus?.status === 'HADIR'
              }
              fullWidth
            >
              Absen Masuk
            </Button>

            <Button
              variant="danger"
              size="lg"
              icon={LogOut}
              onClick={handleCheckOut}
              isLoading={isSubmitting}
              isDisabled={
                !selectedEmployeeId ||
                isLoadingStatus ||
                attendanceStatus?.status !== 'BEKERJA'
              }
              fullWidth
            >
              Absen Pulang
            </Button>
          </div>

          {/* Informative Guidance Footer */}
          <div className="pt-2">
            <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Pastikan memilih nama yang benar sebelum menekan tombol absen.</span>
            </p>
          </div>
        </div>

        {/* Modal Panduan Pasang PWA Manual */}
        <Modal
          isOpen={showInstallGuide}
          onClose={() => setShowInstallGuide(false)}
          title="Panduan Pasang Aplikasi di HP"
          subtitle="GIBY MART — Sistem Absensi Cepat Tanpa Buka Browser"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Pengguna Android (Google Chrome)</p>
                <ol className="list-decimal list-inside text-xs mt-1 space-y-1 text-slate-600">
                  <li>Tekan ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas browser Chrome.</li>
                  <li>Pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Konfirmasi pemasangan, ikon GIBY Absensi akan langsung muncul di beranda HP Anda.</li>
                </ol>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <Share2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Pengguna iPhone / iPad (Safari)</p>
                <ol className="list-decimal list-inside text-xs mt-1 space-y-1 text-slate-600">
                  <li>Buka halaman ini menggunakan browser <strong>Safari</strong>.</li>
                  <li>Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas di bawah).</li>
                  <li>Gulir ke bawah dan pilih <strong>"Add to Home Screen" (Tambah ke Layar Utama)</strong>.</li>
                  <li>Tekan tombol <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
                </ol>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <Download className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Pengguna Komputer / Laptop (Chrome / Edge)</p>
                <p className="text-xs mt-1 text-slate-600">
                  Klik ikon <strong>Install / Pasang</strong> di sebelah kanan kolom alamat (address bar) browser Anda.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowInstallGuide(false)}
              >
                Mengerti & Tutup
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PullToRefresh>
  );
}
