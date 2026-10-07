import { useState, useEffect, useMemo } from 'react';
import { logAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Search, Filter, History, ShieldAlert } from 'lucide-react';

export default function ActivityLogPage() {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await logAPI.get();
      if (res.success) {
        setLogs(res.data || []);
      } else {
        toast.error('Gagal memuat log aktivitas.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchesSearch =
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.target.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = actionFilter === 'ALL' || item.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return <Badge variant="blue" size="sm">LOGIN</Badge>;
      case 'EDIT_ABSENSI':
        return <Badge variant="orange" size="sm">EDIT ABSENSI</Badge>;
      case 'TAMBAH_KARYAWAN':
        return <Badge variant="green" size="sm">TAMBAH KARYAWAN</Badge>;
      case 'EDIT_KARYAWAN':
        return <Badge variant="purple" size="sm">EDIT KARYAWAN</Badge>;
      default:
        return <Badge variant="gray" size="sm">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Log Aktivitas Admin</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Audit trail pencatatan aktivitas, riwayat login, dan perubahan data oleh administrator GIBY MART
        </p>
      </div>

      <ContentCard>
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari admin, target, atau detail..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: 'ALL', label: 'Semua Tipe Aksi' },
                { value: 'LOGIN', label: 'Login Admin' },
                { value: 'EDIT_ABSENSI', label: 'Koreksi Absensi' },
                { value: 'TAMBAH_KARYAWAN', label: 'Tambah Karyawan' },
                { value: 'EDIT_KARYAWAN', label: 'Edit Karyawan' },
              ]}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              icon={Filter}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Tidak Ada Log Aktivitas"
            description={
              searchQuery
                ? `Tidak ada log yang sesuai dengan pencarian "${searchQuery}".`
                : 'Belum ada log aktivitas tercatat.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>Waktu / Timestamp</TableHeaderCell>
                    <TableHeaderCell>Admin</TableHeaderCell>
                    <TableHeaderCell>Tipe Aksi</TableHeaderCell>
                    <TableHeaderCell>Target ID</TableHeaderCell>
                    <TableHeaderCell>Detail Aktivitas</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {log.username}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {log.target || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{log.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{log.username}</span>
                    </div>
                    {getActionBadge(log.action)}
                  </div>

                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {log.detail}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Target: <strong className="text-slate-600 font-mono">{log.target || '-'}</strong></span>
                    <span className="font-mono">{log.timestamp}</span>
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
