import { useState, useEffect, useMemo } from 'react';
import { recapAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah, formatDateIndonesian, formatDateAPI } from '../../utils/formatters';
import { Calendar, Clock, DollarSign, UserCheck } from 'lucide-react';

export default function DailyRecapPage() {
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState(() => formatDateAPI());
  const [dailyData, setDailyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDailyRecap();
  }, [selectedDate]);

  const fetchDailyRecap = async () => {
    if (!selectedDate) {
      setDailyData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await recapAPI.getDaily(selectedDate);
      if (res.success) {
        setDailyData(res.data || []);
      } else {
        toast.error('Gagal memuat rekap harian.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    return dailyData.reduce(
      (acc, item) => {
        if (item.status === 'HADIR' || item.status === 'BEKERJA') {
          acc.presentCount += 1;
        }
        acc.totalMinutes += item.totalMinutes || 0;
        acc.totalPay += item.totalPay || 0;
        return acc;
      },
      { presentCount: 0, totalMinutes: 0, totalPay: 0 }
    );
  }, [dailyData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Rekap Absensi Harian</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Laporan detail absensi dan pengeluaran upah harian operasional GIBY MART
        </p>
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
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Durasi Kerja</p>
              <p className="text-lg sm:text-xl font-black text-slate-800">
                {(totals.totalMinutes / 60).toFixed(1)} <span className="text-xs font-semibold text-slate-500">Jam ({totals.totalMinutes} m)</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Upah Harian</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700 truncate" title={formatRupiah(totals.totalPay)}>
                {formatRupiah(totals.totalPay)}
              </p>
            </div>
          </div>
        </div>

        {/* Table & Mobile Responsive View */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : !selectedDate ? (
          <EmptyState
            title="Silakan pilih tanggal"
            description="Pilih tanggal untuk melihat data absensi karyawan."
          />
        ) : dailyData.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Absensi"
            description="Belum ada karyawan yang melakukan absensi pada tanggal ini."
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
                    <TableHeaderCell>Jam Masuk</TableHeaderCell>
                    <TableHeaderCell>Jam Pulang</TableHeaderCell>
                    <TableHeaderCell>Total Menit</TableHeaderCell>
                    <TableHeaderCell>Total Jam</TableHeaderCell>
                    <TableHeaderCell>Tarif / Jam</TableHeaderCell>
                    <TableHeaderCell>Total Upah Harian</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyData.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="text-slate-500 font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {item.employeeName}
                        <span className="block text-[10px] font-normal text-slate-400">
                          ID: {item.employeeId}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.checkIn || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.checkOut || '-'}</TableCell>
                      <TableCell className="text-xs">{item.totalMinutes ? `${item.totalMinutes} m` : '-'}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{item.totalHours ? `${item.totalHours} j` : '-'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{formatRupiah(item.hourlyRate)}</TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        {item.totalPay ? formatRupiah(item.totalPay) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.status === 'HADIR' ? (
                          <Badge variant="green" size="sm" dot>PULANG</Badge>
                        ) : item.status === 'BEKERJA' ? (
                          <Badge variant="orange" size="sm" dot>BEKERJA</Badge>
                        ) : (
                          <Badge variant="red" size="sm" dot>BELUM MASUK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow hover={false} className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <TableCell colSpan={4} className="text-right uppercase tracking-wider text-xs">
                      TOTAL HARIAN:
                    </TableCell>
                    <TableCell className="font-mono text-xs">{totals.totalMinutes} m</TableCell>
                    <TableCell className="font-mono text-xs">{ (totals.totalMinutes / 60).toFixed(2) } j</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-emerald-700 text-base">
                      {formatRupiah(totals.totalPay)}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {dailyData.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {item.employeeName}
                      </h4>
                      <p className="text-xs font-mono font-bold text-accent-blue mt-0.5">
                        ID: {item.employeeId}
                      </p>
                    </div>
                    {item.status === 'HADIR' ? (
                      <Badge variant="green" size="sm" dot>PULANG</Badge>
                    ) : item.status === 'BEKERJA' ? (
                      <Badge variant="orange" size="sm" dot>BEKERJA</Badge>
                    ) : (
                      <Badge variant="red" size="sm" dot>BELUM MASUK</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jam Masuk:</span>
                      <strong className="text-slate-700 font-mono">{item.checkIn || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jam Pulang:</span>
                      <strong className="text-slate-700 font-mono">{item.checkOut || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Durasi:</span>
                      <span className="text-slate-700 font-semibold">{item.totalHours ? `${item.totalHours} jam` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tarif/Jam:</span>
                      <span className="text-slate-700">{formatRupiah(item.hourlyRate)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Upah Harian:</span>
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
  );
}
