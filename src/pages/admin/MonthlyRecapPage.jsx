import { useState, useEffect, useMemo } from 'react';
import { recapAPI, attendanceAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah } from '../../utils/formatters';
import { Download, Calendar, FileText, Eye, CalendarCheck, Clock, DollarSign, User } from 'lucide-react';

const MONTH_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const currentYearNum = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: String(currentYearNum - 2), label: String(currentYearNum - 2) },
  { value: String(currentYearNum - 1), label: String(currentYearNum - 1) },
  { value: String(currentYearNum), label: String(currentYearNum) },
  { value: String(currentYearNum + 1), label: String(currentYearNum + 1) },
  { value: String(currentYearNum + 2), label: String(currentYearNum + 2) },
];

export default function MonthlyRecapPage() {
  const toast = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [recapData, setRecapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailRecords, setDetailRecords] = useState([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchMonthlyRecap();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyRecap = async () => {
    setIsLoading(true);
    try {
      const res = await recapAPI.getMonthly(selectedMonth, selectedYear);
      if (res.success) {
        setRecapData(res.data || []);
      } else {
        toast.error('Gagal memuat rekap bulanan.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate Totals
  const totals = useMemo(() => {
    return recapData.reduce(
      (acc, item) => {
        acc.daysPresent += item.daysPresent || 0;
        acc.totalMinutes += item.totalMinutes || 0;
        acc.totalMealAllowance += item.totalMealAllowance || 0;
        acc.totalPay += item.totalPay || 0;
        return acc;
      },
      { daysPresent: 0, totalMinutes: 0, totalMealAllowance: 0, totalPay: 0 }
    );
  }, [recapData]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (recapData.length === 0) {
      toast.warning('Tidak ada data untuk diexport.');
      return;
    }

    const monthName = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const filename = `Rekap_Absensi_GIBY_MART_${monthName}_${selectedYear}.csv`;

    const headers = [
      'No',
      'Kode Karyawan',
      'Nama Karyawan',
      'Hari Hadir',
      'Total Jam Kerja',
      'Tarif / Jam (Rp)',
      'Uang Makan / Hari (Rp)',
      'Total Uang Makan (Rp)',
      'Total Upah (Rp)'
    ];

    const rows = recapData.map((item, idx) => [
      idx + 1,
      `"${item.employeeCode || item.employeeId}"`,
      `"${item.employeeName}"`,
      item.daysPresent,
      `"${item.totalHours} Jam"`,
      item.hourlyRate,
      item.mealAllowance || 0,
      item.totalMealAllowance || 0,
      item.totalPay
    ]);

    // Add Total Row
    rows.push([
      '',
      '',
      '"TOTAL KESELURUHAN"',
      totals.daysPresent,
      `"${Math.floor(totals.totalMinutes / 60)}j ${totals.totalMinutes % 60}m"`,
      '',
      '',
      totals.totalMealAllowance,
      totals.totalPay
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`File CSV "${filename}" berhasil didownload!`);
  };

  // View Employee Daily Breakdown Modal
  const handleOpenDetail = async (emp) => {
    setDetailEmployee(emp);
    setIsLoadingDetail(true);
    try {
      const res = await attendanceAPI.getMonthly(selectedMonth, selectedYear);
      if (res.success) {
        setDetailRecords(
          (res.data || []).filter(
            (r) =>
              r.employeeId === emp.employeeId ||
              r.employeeCode === emp.employeeCode ||
              r.rawEmployeeId === emp.rawId ||
              r.employeeName === emp.employeeName
          )
        );
      }
    } catch {
      toast.error('Gagal memuat detail harian.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Rekap Absensi Bulanan</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Laporan total kehadiran, durasi jam kerja, uang makan, dan perhitungan upah karyawan per bulan
          </p>
        </div>

        <Button
          variant="success"
          icon={Download}
          onClick={handleExportCSV}
          isDisabled={isLoading || recapData.length === 0}
          className="shadow-sm"
        >
          Export CSV
        </Button>
      </div>

      {/* Main Content Card */}
      <ContentCard>
        {/* Filters Bar */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
          <div className="w-40 sm:w-48">
            <Select
              label="Pilih Bulan"
              options={MONTH_OPTIONS}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              icon={Calendar}
            />
          </div>

          <div className="w-32 sm:w-36">
            <Select
              label="Pilih Tahun"
              options={YEAR_OPTIONS}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              icon={Calendar}
            />
          </div>

          <div>
            <Button variant="secondary" onClick={fetchMonthlyRecap} isLoading={isLoading}>
              Tampilkan
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-blue text-white flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Hari Hadir</p>
              <p className="text-lg sm:text-xl font-black text-slate-800">
                {totals.daysPresent} <span className="text-xs font-semibold text-slate-500">Hari</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jam Kerja</p>
              <p className="text-lg sm:text-xl font-black text-slate-800">
                {Math.floor(totals.totalMinutes / 60)}j {totals.totalMinutes % 60}m
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Upah Bulanan</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700 truncate" title={formatRupiah(totals.totalPay)}>
                {formatRupiah(totals.totalPay)}
              </p>
            </div>
          </div>
        </div>

        {/* Table & Mobile Responsive View */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={9} />
        ) : recapData.length === 0 ? (
          <EmptyState
            title="Data Tidak Ditemukan"
            description={`Belum ada rekap absensi untuk periode ${monthLabel} ${selectedYear}.`}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>Nama Karyawan</TableHeaderCell>
                    <TableHeaderCell align="center">Hari Hadir</TableHeaderCell>
                    <TableHeaderCell>Total Jam Kerja</TableHeaderCell>
                    <TableHeaderCell>Tarif / Jam</TableHeaderCell>
                    <TableHeaderCell>Uang Makan / Hari</TableHeaderCell>
                    <TableHeaderCell>Total Uang Makan</TableHeaderCell>
                    <TableHeaderCell>Total Upah</TableHeaderCell>
                    <TableHeaderCell align="center">Detail</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recapData.map((item, idx) => (
                    <TableRow key={item.rawId || item.employeeId || idx}>
                      <TableCell className="text-slate-500 font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-800">
                        <div>{item.employeeName}</div>
                        <div className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                          Kode: {item.employeeCode || item.employeeId}
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <Badge variant="blue" size="md">{item.daysPresent} Hari</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {item.totalHours} Jam
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">
                        {formatRupiah(item.hourlyRate)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-amber-700">
                        {formatRupiah(item.mealAllowance || 0)}
                      </TableCell>
                      <TableCell className="font-bold text-amber-700">
                        {formatRupiah(item.totalMealAllowance || 0)}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        {formatRupiah(item.totalPay)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetail(item)}
                          title="Lihat Detail Harian"
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow hover={false} className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <TableCell colSpan={2} className="text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                      TOTAL KESELURUHAN:
                    </TableCell>
                    <TableCell align="center" className="text-accent-blue font-bold">
                      {totals.daysPresent} Hari
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-800 font-bold">
                      {Math.floor(totals.totalMinutes / 60)}j {totals.totalMinutes % 60}m
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold text-amber-700 text-sm">
                      {formatRupiah(totals.totalMealAllowance)}
                    </TableCell>
                    <TableCell className="text-emerald-700 text-base font-black">
                      {formatRupiah(totals.totalPay)}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Layout (Responsive) */}
            <div className="md:hidden space-y-3">
              {recapData.map((item) => (
                <div
                  key={item.rawId || item.employeeId}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                        {item.employeeName}
                      </h4>
                      <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
                        Kode: {item.employeeCode || item.employeeId}
                      </p>
                    </div>
                    <Badge variant="blue" size="sm">
                      {item.daysPresent} Hari Hadir
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Jam Kerja:</span>
                      <strong className="text-slate-700 font-mono">{item.totalHours} Jam</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tarif / Jam:</span>
                      <span className="text-slate-700 font-medium">{formatRupiah(item.hourlyRate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Uang Makan/Hari:</span>
                      <span className="text-amber-700 font-semibold">{formatRupiah(item.mealAllowance || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Uang Makan:</span>
                      <strong className="text-amber-700 font-bold">{formatRupiah(item.totalMealAllowance || 0)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Upah:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {formatRupiah(item.totalPay)}
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleOpenDetail(item)}
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ContentCard>

      {/* Modal Detail Breakdown Harian Karyawan */}
      <Modal
        isOpen={!!detailEmployee}
        onClose={() => setDetailEmployee(null)}
        title={`Detail Rincian ${detailEmployee?.employeeName}`}
        subtitle={`Periode: ${monthLabel} ${selectedYear}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Kehadiran:</span>
              <strong className="text-slate-800">{detailEmployee?.daysPresent} Hari</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Uang Makan:</span>
              <strong className="text-amber-700">{formatRupiah(detailEmployee?.totalMealAllowance || 0)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Upah:</span>
              <strong className="text-emerald-700 font-bold">
                {detailEmployee?.totalPay ? formatRupiah(detailEmployee.totalPay) : '-'}
              </strong>
            </div>
          </div>

          {isLoadingDetail ? (
            <TableSkeleton rows={4} cols={6} />
          ) : detailRecords.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Tidak ada rincian absensi harian.</p>
          ) : (
            <Table>
              <TableHead>
                <TableRow hover={false}>
                  <TableHeaderCell>Tanggal</TableHeaderCell>
                  <TableHeaderCell>Masuk</TableHeaderCell>
                  <TableHeaderCell>Pulang</TableHeaderCell>
                  <TableHeaderCell>Durasi</TableHeaderCell>
                  <TableHeaderCell>Uang Makan</TableHeaderCell>
                  <TableHeaderCell>Upah Harian</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailRecords.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.checkIn || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{r.checkOut || '-'}</TableCell>
                    <TableCell className="text-xs">{r.totalHours ? `${r.totalHours} jam` : '-'}</TableCell>
                    <TableCell className="text-xs font-semibold text-amber-700">
                      {r.mealAllowance ? formatRupiah(r.mealAllowance) : '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700 text-xs">
                      {r.totalPay ? formatRupiah(r.totalPay) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Modal>
    </div>
  );
}
