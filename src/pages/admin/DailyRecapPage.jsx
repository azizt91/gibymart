import { useState, useEffect, useMemo } from 'react';
import { recapAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import useRealtimeAttendance from '../../hooks/useRealtimeAttendance';
import PullToRefresh from '../../components/ui/PullToRefresh';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah, formatDateAPI } from '../../utils/formatters';
import { Calendar, Clock, DollarSign, UserCheck } from 'lucide-react';

export default function DailyRecapPage() {
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState(() => formatDateAPI());
  const [dailyData, setDailyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDailyRecap = async (isSilent = false) => {
    if (!selectedDate) {
      setDailyData([]);
      setIsLoading(false);
      return;
    }
    if (!isSilent) setIsLoading(true);
    try {
      const res = await recapAPI.getDaily(selectedDate);
      if (res.success) {
        setDailyData(res.data || []);
      } else {
        if (!isSilent) toast.error('Gagal memuat rekap harian.');
      }
    } catch {
      if (!isSilent) toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyRecap();
  }, [selectedDate]);

  // Hubungkan ke Supabase Realtime
  useRealtimeAttendance(() => fetchDailyRecap(true));

  const totals = useMemo(() => {
    return dailyData.reduce(
      (acc, item) => {
        if (item.status === 'HADIR' || item.status === 'BEKERJA') {
          acc.presentCount += 1;
        }
        acc.totalMinutes += item.totalMinutes || 0;
        acc.totalHours = Number(((acc.totalHours || 0) + (item.totalHours || 0)).toFixed(1));
        acc.totalMealAllowance += item.mealAllowance || 0;
        acc.totalPay += item.totalPay || 0;
        return acc;
      },
      { presentCount: 0, totalMinutes: 0, totalHours: 0, totalMealAllowance: 0, totalPay: 0 }
    );
  }, [dailyData]);

  return (
    <PullToRefresh onRefresh={() => fetchDailyRecap(true)}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Rekap Absensi Harian</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Realtime
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Laporan detail absensi dan pengeluaran upah harian operasional GIBY MART
            </p>
          </div>
        </div>

        <ContentCard>
          {/* Date Filter Toolbar */}
          <div className="w-full sm:w-72 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            <Input
              label="Pilih Tanggal Absensi"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              icon={Calendar}
            />
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent-blue text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Karyawan Hadir</p>
                <p className="text-lg sm:text-xl font-black text-slate-800">
                  {totals.presentCount} <span className="text-xs font-semibold text-slate-500">Orang</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jam Kerja Dibayar</p>
                <p className="text-lg sm:text-xl font-black text-slate-800">
                  {totals.totalHours || 0} Jam <span className="text-xs font-semibold text-slate-400">({Math.floor(totals.totalMinutes / 60)}j {totals.totalMinutes % 60}m)</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran Upah</p>
                <p className="text-lg sm:text-xl font-black text-emerald-700 truncate" title={formatRupiah(totals.totalPay)}>
                  {formatRupiah(totals.totalPay)}
                </p>
              </div>
            </div>
          </div>

          {/* Table / Empty State */}
          {isLoading ? (
            <TableSkeleton rows={5} cols={9} />
          ) : !selectedDate ? (
            <EmptyState
              title="Silakan pilih tanggal"
              description="Pilih tanggal di atas untuk melihat detail rekap harian."
            />
          ) : dailyData.length === 0 ? (
            <EmptyState
              title="Tidak Ada Rekap Hari Ini"
              description="Belum ada data absensi atau kehadiran pada tanggal yang dipilih."
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
                      <TableHeaderCell>Masuk</TableHeaderCell>
                      <TableHeaderCell>Pulang</TableHeaderCell>
                      <TableHeaderCell>Jam Kerja</TableHeaderCell>
                      <TableHeaderCell>Tarif / Jam</TableHeaderCell>
                      <TableHeaderCell>Uang Makan</TableHeaderCell>
                      <TableHeaderCell>Upah Jam</TableHeaderCell>
                      <TableHeaderCell>Total Upah</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyData.map((item, idx) => (
                      <TableRow key={item.id || item.employeeId || idx}>
                        <TableCell className="text-slate-500 font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-800">
                          <div>{item.employeeName}</div>
                          <div className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                            ID: {item.employeeCode || item.employeeId}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.checkIn || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{item.checkOut || '-'}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-700">
                          {item.totalHours ? `${item.totalHours} jam` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {formatRupiah(item.hourlyRate)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-amber-700">
                          {formatRupiah(item.mealAllowance || 0)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {formatRupiah(Math.max(0, (item.totalPay || 0) - (item.mealAllowance || 0)))}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-700">
                          {formatRupiah(item.totalPay)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Total Row */}
                    <TableRow hover={false} className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <TableCell colSpan={2} className="text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                        TOTAL HARIAN:
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="font-mono text-xs text-slate-800 font-bold">
                        {Math.floor(totals.totalMinutes / 60)}j {totals.totalMinutes % 60}m
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="font-bold text-amber-700 text-sm">
                        {formatRupiah(totals.totalMealAllowance)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 text-sm">
                        {formatRupiah(Math.max(0, totals.totalPay - totals.totalMealAllowance))}
                      </TableCell>
                      <TableCell className="text-emerald-700 text-base font-black">
                        {formatRupiah(totals.totalPay)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {dailyData.map((item) => (
                  <div
                    key={item.id || item.employeeId}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {item.employeeName}
                        </h4>
                        <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
                          ID: {item.employeeCode || item.employeeId}
                        </p>
                      </div>
                      <Badge variant={item.status === 'HADIR' ? 'green' : item.status === 'BEKERJA' ? 'yellow' : 'gray'} size="sm">
                        {item.status || 'HADIR'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Masuk - Pulang:</span>
                        <strong className="text-slate-700 font-mono">
                          {item.checkIn || '-'} — {item.checkOut || '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Durasi:</span>
                        <span className="text-slate-700 font-semibold">{item.totalHours ? `${item.totalHours} jam` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Tarif/Jam:</span>
                        <span className="text-slate-700">{formatRupiah(item.hourlyRate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Uang Makan:</span>
                        <span className="text-amber-700 font-semibold">{formatRupiah(item.mealAllowance || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Upah Jam:</span>
                        <span className="text-slate-700 font-medium">{formatRupiah(Math.max(0, (item.totalPay || 0) - (item.mealAllowance || 0)))}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Upah Harian:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {item.totalPay ? formatRupiah(item.totalPay) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ContentCard>
      </div>
    </PullToRefresh>
  );
}
