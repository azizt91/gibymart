import { useState, useEffect } from 'react';
import { useClock } from '../../hooks/useClock';
import { employeeAPI, attendanceAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
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

  // Fetch active employees dropdown on mount
  useEffect(() => {
    fetchActiveEmployees();
  }, []);

  // Fetch status whenever selected employee changes
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeStatus(selectedEmployeeId);
    } else {
      setAttendanceStatus(null);
      setLastActionSuccess(null);
    }
  }, [selectedEmployeeId]);

  const fetchActiveEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const res = await employeeAPI.getActive();
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      toast.error('Gagal memuat list karyawan.');
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
    } catch (err) {
      toast.error('Gagal mengecek status absensi.');
    } finally {
      setIsLoadingStatus(false);
    }
  };

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
          time: res.data.time
        });
        await fetchEmployeeStatus(selectedEmployeeId);
      } else {
        toast.error(res.message || 'Gagal absen masuk.');
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
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
        const payFormatted = res.data.estimatedPay ? formatRupiah(res.data.estimatedPay) : '-';
        toast.success(`Absen pulang berhasil! Estimasi upah: ${payFormatted}`);
        setLastActionSuccess({
          type: 'checkOut',
          message: `Absen pulang berhasil pada jam ${res.data.time}. Durasi kerja: ${res.data.totalMinutes} menit (${payFormatted})`,
          time: res.data.time
        });
        await fetchEmployeeStatus(selectedEmployeeId);
      } else {
        toast.error(res.message || 'Gagal absen pulang.');
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name} (${emp.employeeCode || 'Karyawan'})`,
  }));

  const selectedEmployeeName = employees.find((e) => e.id === selectedEmployeeId)?.name;

  return (
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
                  Akses absensi cepat seperti aplikasi asli (PWA)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-accent-blue hover:bg-blue-600 active:scale-95 text-white text-xs font-bold shadow-sm shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          </div>
        )}

        {/* Real-time Clock Display */}
        <div className="text-center py-5 px-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-accent-blue rounded-full text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>WAKTU REAL-TIME (WIB)</span>
          </div>
          <div className="text-5xl sm:text-6xl font-black text-primary tracking-tight font-mono my-1">
            {timeString}
          </div>
          <p className="text-xs text-text-muted font-medium">Zona Waktu: Asia/Jakarta</p>
        </div>

        {/* Employee Dropdown Selection */}
        <div>
          <Select
            label="Pilih Nama Anda"
            placeholder={isLoadingEmployees ? 'Memuat data karyawan...' : '-- Pilih Nama Karyawan --'}
            options={employeeOptions}
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            isDisabled={isLoadingEmployees || isSubmitting}
            icon={UserCheck}
            isRequired
          />
        </div>

        {/* Selected Employee Status Badge & Alert Info */}
        {selectedEmployeeId && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center animate-fade-in space-y-2">
            <p className="text-xs text-text-muted font-medium">
              Status Hari Ini untuk <strong className="text-text-dark">{selectedEmployeeName}</strong>:
            </p>
            {isLoadingStatus ? (
              <p className="text-xs text-slate-400 font-semibold animate-pulse">Memuat status...</p>
            ) : attendanceStatus?.status === 'BEKERJA' ? (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="orange" size="lg" dot>
                  SEDANG BEKERJA
                </Badge>
                <span className="text-xs text-text-muted font-mono font-medium">
                  (Masuk jam {attendanceStatus.checkIn || attendanceStatus.checkInTime || '-'})
                </span>
              </div>
            ) : attendanceStatus?.status === 'HADIR' ? (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="green" size="lg" dot>
                  SUDAH PULANG (SELESAI)
                </Badge>
                <span className="text-xs text-text-muted font-mono font-medium">
                  ({attendanceStatus.checkIn || attendanceStatus.checkInTime || '-'} - {attendanceStatus.checkOut || attendanceStatus.checkOutTime || '-'})
                </span>
              </div>
            ) : (
              <div>
                <Badge variant="red" size="lg" dot>
                  BELUM ABSEN MASUK
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Success Feedback Alert */}
        {lastActionSuccess && (
          <Alert
            type="success"
            title="Absensi Berhasil Dicatat"
            message={lastActionSuccess.message}
            onClose={() => setLastActionSuccess(null)}
          />
        )}

        {/* 2 Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Button
            variant="success"
            size="lg"
            onClick={handleCheckIn}
            isLoading={isSubmitting}
            isDisabled={!selectedEmployeeId || attendanceStatus?.status === 'BEKERJA' || attendanceStatus?.status === 'HADIR'}
            icon={LogIn}
            fullWidth
            className="py-4 text-base font-bold shadow-md hover:shadow-lg"
          >
            ABSEN MASUK
          </Button>

          <Button
            variant="danger"
            size="lg"
            onClick={handleCheckOut}
            isLoading={isSubmitting}
            isDisabled={!selectedEmployeeId || attendanceStatus?.status !== 'BEKERJA'}
            icon={LogOut}
            fullWidth
            className="py-4 text-base font-bold shadow-md hover:shadow-lg"
          >
            ABSEN PULANG
          </Button>
        </div>

        {/* Helper Instructions */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-text-muted leading-relaxed">
            ℹ️ Silakan pilih nama Anda pada dropdown di atas, kemudian tekan tombol <strong>ABSEN MASUK</strong> saat mulai bekerja, atau <strong>ABSEN PULANG</strong> saat selesai bekerja.
          </p>
        </div>
      </div>

      {/* PWA Install Guide Modal */}
      <Modal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        title="Pasang Aplikasi GIBY Absensi"
        subtitle="Jadikan aplikasi ini seperti aplikasi native di HP Anda tanpa instal dari Play Store"
        size="md"
      >
        <div className="space-y-4 text-sm text-text-secondary">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Pengguna Android (Google Chrome)</p>
              <ol className="list-decimal list-inside text-xs mt-1 space-y-1 text-slate-600">
                <li>Buka menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.</li>
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
  );
}
