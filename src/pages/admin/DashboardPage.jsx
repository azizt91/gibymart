import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import { StatCard, ContentCard } from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { StatCardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Calendar,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardAPI.get();
      if (res && res.success) {
        setData(res.data);
      } else {
        toast.error('Gagal mengambil data dashboard.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" style={{ gap: '24px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" style={{ gap: '20px' }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ gap: '24px' }}>
          <div className="lg:col-span-7 xl:col-span-8">
            <ContentCard title="Absensi Hari Ini">
              <TableSkeleton rows={4} cols={5} />
            </ContentCard>
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <ContentCard title="Rekap Singkat Bulan Ini">
              <TableSkeleton rows={4} cols={2} />
            </ContentCard>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalEmployees = 0,
    activeEmployees = 0,
    inactiveEmployees = 0,
    todayCheckedIn = 0,
    todayWorking = 0,
    todayCheckedOut = 0,
    todayAttendance = [],
    chartData = [],
    monthlyRecapSummary = {}
  } = data || {};

  const hasAnyChartData = chartData.some((c) => (c.hadir > 0 || c.bekerja > 0 || c.tidakHadir > 0));
  const maxChartVal = Math.max(
    0,
    ...chartData.map((c) => Math.max(Number(c.hadir || 0), Number(c.bekerja || 0), Number(c.tidakHadir || 0)))
  );
  const yAxisMax = maxChartVal > 0 ? Math.max(maxChartVal + 1, 4) : 2;
  const yAxisTicks = maxChartVal === 0 ? [0, 1, 2] : undefined;

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard Utama</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ringkasan operasional absensi dan aktivitas kerja karyawan GIBY MART hari ini
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" style={{ gap: '20px' }}>
        <StatCard
          title="Total Karyawan"
          value={totalEmployees}
          subtitle={`${activeEmployees} aktif · ${inactiveEmployees} nonaktif`}
          icon={Users}
          accentColor="blue"
        />

        <StatCard
          title="Sudah Masuk"
          value={todayCheckedIn}
          subtitle={todayCheckedIn > 0 ? 'Tercatat masuk hari ini' : 'Belum ada absensi hari ini'}
          icon={UserCheck}
          accentColor="green"
        />

        <StatCard
          title="Sedang Bekerja"
          value={todayWorking}
          subtitle={todayWorking > 0 ? 'Masih aktif di toko saat ini' : 'Belum ada karyawan bekerja'}
          icon={Clock}
          accentColor="orange"
        />

        <StatCard
          title="Sudah Pulang"
          value={todayCheckedOut}
          subtitle={todayCheckedOut > 0 ? 'Selesai shift hari ini' : 'Belum ada yang selesai bekerja'}
          icon={CheckCircle2}
          accentColor="purple"
        />
      </div>

      {/* Main Grid: Absensi Hari Ini (7-8 Cols) & Rekap Singkat (4-5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" style={{ gap: '24px' }}>
        {/* Left Column: Tabel Absensi Hari Ini */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ContentCard
            title="Absensi Hari Ini"
            subtitle="Daftar kehadiran karyawan hari ini"
            action={
              <Link to="/admin/absensi">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  Lihat Semua
                </Button>
              </Link>
            }
          >
            {todayAttendance.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Absensi Hari Ini</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                  Belum ada karyawan yang melakukan absensi masuk pada hari ini.
                </p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>Nama Karyawan</TableHeaderCell>
                    <TableHeaderCell>Jam Masuk</TableHeaderCell>
                    <TableHeaderCell>Jam Pulang</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAttendance.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="font-semibold text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-800">
                        <div className="leading-tight">
                          <span>{item.employeeName}</span>
                          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                            ID: {item.employeeCode || item.employeeId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-700">{item.checkIn || '-'}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-700">{item.checkOut || '-'}</TableCell>
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
                </TableBody>
              </Table>
            )}
          </ContentCard>
        </div>

        {/* Right Column: Rekap Singkat Bulan Ini */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ContentCard
            title="Rekap Singkat Bulan Ini"
            subtitle={`${monthlyRecapSummary.month || 'Oktober'} ${monthlyRecapSummary.year || 2026}`}
            action={
              <Link to="/admin/rekap">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  Detail
                </Button>
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-4" style={{ gap: '16px' }}>
              <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col justify-between" style={{ padding: '16px 14px' }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Hari Kerja</p>
                <p className="text-2xl font-black text-slate-800 mt-2">
                  {monthlyRecapSummary.totalDays || 0} <span className="text-xs font-semibold text-slate-400">Hari</span>
                </p>
              </div>

              <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col justify-between" style={{ padding: '16px 14px' }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Rata-rata Hadir</p>
                <p className="text-2xl font-black text-emerald-600 mt-2">
                  {monthlyRecapSummary.avgAttendance || '0 / 1'}
                </p>
              </div>

              <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col justify-between" style={{ padding: '16px 14px' }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Jam Kerja</p>
                <p className="text-2xl font-black text-accent-blue mt-2">
                  {monthlyRecapSummary.totalHoursMinutes || '0:00'} <span className="text-xs font-semibold text-slate-400">Jam</span>
                </p>
              </div>

              <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col justify-between" style={{ padding: '16px 14px' }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Upah Bulanan</p>
                <p className="text-lg sm:text-xl font-black text-purple-700 mt-2 truncate" title={formatRupiah(monthlyRecapSummary.totalPay || 0)}>
                  {formatRupiah(monthlyRecapSummary.totalPay || 0)}
                </p>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      {/* Row 3: Grafik Kehadiran 5 Hari Terakhir */}
      <ContentCard
        title="Grafik Kehadiran 5 Hari Terakhir"
        subtitle="Visualisasi tren kehadiran, jam kerja aktif, dan ketidakhadiran"
      >
        {!hasAnyChartData && (
          <div className="flex items-center gap-3 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Belum ada aktivitas absensi</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Grafik akan menampilkan tren kehadiran setelah data absensi tersedia.
              </p>
            </div>
          </div>
        )}

        <div className="h-44 sm:h-48 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
              <YAxis
                allowDecimals={false}
                domain={[0, yAxisMax]}
                ticks={yAxisTicks}
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '6px' }} />
              <Bar dataKey="hadir" name="Hadir" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="bekerja" name="Sedang Bekerja" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="tidakHadir" name="Absen" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContentCard>
    </div>
  );
}
