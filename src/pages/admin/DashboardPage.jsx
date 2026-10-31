import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import useRealtimeAttendance from '../../hooks/useRealtimeAttendance';
import PullToRefresh from '../../components/ui/PullToRefresh';
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

  // Fetch data dashboard (mendukung silent update di latar belakang)
  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await dashboardAPI.get();
      if (res && res.success) {
        setData(res.data);
      } else {
        if (!isSilent) toast.error('Gagal mengambil data dashboard.');
      }
    } catch {
      if (!isSilent) toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Hubungkan ke Supabase Realtime & Auto-revalidate saat tab aktif kembali
  useRealtimeAttendance(() => fetchDashboardData(true));

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
    <PullToRefresh onRefresh={() => fetchDashboardData(true)}>
      <div className="flex flex-col gap-6 animate-fade-in" style={{ gap: '24px' }}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Dashboard Utama</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Realtime
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ringkasan operasional absensi dan aktivitas kerja karyawan GIBY MART hari ini
            </p>
          </div>
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

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ gap: '24px' }}>
          {/* Left Column: Absensi Hari Ini (7/12 desktop) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ContentCard
              title="Absensi Hari Ini"
              action={
                <Link to="/admin/absensi">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    Semua
                  </Button>
                </Link>
              }
            >
              {todayAttendance.length === 0 ? (
                <EmptyState
                  title="Belum ada absensi hari ini"
                  description="Karyawan yang absen masuk atau pulang akan tampil secara real-time di sini."
                />
              ) : (
                <Table>
                  <TableHead>
                    <TableRow hover={false}>
                      <TableHeaderCell>Karyawan</TableHeaderCell>
                      <TableHeaderCell>Masuk</TableHeaderCell>
                      <TableHeaderCell>Pulang</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayAttendance.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold text-slate-800">
                          {row.employeeName}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.checkIn || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{row.checkOut || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === 'HADIR'
                                ? 'green'
                                : row.status === 'BEKERJA'
                                ? 'yellow'
                                : 'gray'
                            }
                          >
                            {row.status === 'BEKERJA' ? 'BEKERJA' : row.status || 'HADIR'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ContentCard>
          </div>

          {/* Right Column: Ringkasan Rekap Bulan Ini (5/12 desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6" style={{ gap: '24px' }}>
            <ContentCard
              title="Ringkasan Bulan Ini"
              action={
                <Link to="/admin/rekap">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    Detail
                  </Button>
                </Link>
              }
            >
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">
                      Periode
                    </span>
                    <strong className="text-slate-800 font-bold text-sm">
                      {monthlyRecapSummary.month || '-'} {monthlyRecapSummary.year}
                    </strong>
                  </div>
                  <Badge variant="blue">{monthlyRecapSummary.totalDays || 0} Hari Kerja</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                    <span className="text-slate-400 block text-[11px] font-medium">Total Jam Kerja</span>
                    <strong className="text-slate-800 text-sm font-black font-mono">
                      {monthlyRecapSummary.totalHoursMinutes || '0:00'}
                    </strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[11px] font-medium">Total Upah</span>
                    <strong className="text-emerald-700 text-sm font-black truncate block" title={formatRupiah(monthlyRecapSummary.totalPay)}>
                      {formatRupiah(monthlyRecapSummary.totalPay)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                  <span>Rata-rata Kehadiran / Hari:</span>
                  <strong className="text-slate-800">{monthlyRecapSummary.avgAttendance || '0 / 0'}</strong>
                </div>
              </div>
            </ContentCard>
          </div>
        </div>

        {/* Tren Kehadiran 7 Hari Terakhir */}
        <ContentCard
          title="Tren Kehadiran 7 Hari Terakhir"
          action={
            <Link to="/admin/rekap-harian">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                Rekap Harian
              </Button>
            </Link>
          }
        >
          {!hasAnyChartData && (
            <div className="flex items-center gap-2.5 p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
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
    </PullToRefresh>
  );
}
