import { useState, useEffect, useMemo } from 'react';
import { attendanceAPI, employeeAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah, formatMinutesToHours, formatDateAPI } from '../../utils/formatters';
import {
  Calendar,
  Filter,
  Search,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AttendanceAdminPage() {
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters (Dynamic current date)
  const [selectedDate, setSelectedDate] = useState(() => formatDateAPI());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Correction Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: '',
    checkOut: '',
    note: ''
  });
  const [correctionError, setCorrectionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [selectedDate]);

  const fetchInitialData = async () => {
    if (!selectedDate) {
      setRecords([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceAPI.getDaily(selectedDate),
        employeeAPI.getAll()
      ]);

      if (attRes.success) setRecords(attRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
    } catch (err) {
      toast.error('Gagal memuat data absensi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesEmp = selectedEmployeeId === 'ALL' || rec.employeeId === selectedEmployeeId;
      const matchesStatus = selectedStatus === 'ALL' || rec.status === selectedStatus;
      return matchesEmp && matchesStatus;
    });
  }, [records, selectedEmployeeId, selectedStatus]);

  // Open correction modal
  const handleOpenCorrection = (record) => {
    setEditingRecord(record);
    setCorrectionForm({
      checkIn: record.checkIn || '08:00',
      checkOut: record.checkOut || '17:00',
      note: record.note || ''
    });
    setCorrectionError('');
  };

  // Submit correction
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.note.trim()) {
      setCorrectionError('Catatan / Alasan koreksi wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await attendanceAPI.edit({
        id: editingRecord.id,
        checkIn: correctionForm.checkIn,
        checkOut: correctionForm.checkOut,
        note: correctionForm.note,
        source: 'ADMIN'
      });

      if (res.success) {
        toast.success(`Absensi ${editingRecord.employeeName} berhasil dikoreksi.`);
        setRecords((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  checkIn: correctionForm.checkIn,
                  checkOut: correctionForm.checkOut,
                  status: 'HADIR',
                  source: 'ADMIN',
                  note: correctionForm.note,
                  totalMinutes: 540,
                  totalHours: 9.0,
                  totalPay: 90000
                }
              : item
          )
        );
        setEditingRecord(null);
      } else {
        toast.error(res.message || 'Gagal menyimpan koreksi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  const employeeOptions = [
    { value: 'ALL', label: 'Semua Karyawan' },
    ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Absensi Admin</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pantau riwayat absensi harian karyawan dan lakukan koreksi jam kerja jika diperlukan
        </p>
      </div>

      {/* Main Card with Toolbar & Table */}
      <ContentCard>
        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
          <Input
            label="Pilih Tanggal"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            icon={Calendar}
          />

          <Select
            label="Filter Karyawan"
            options={employeeOptions}
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            icon={Filter}
          />

          <Select
            label="Filter Status"
            options={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'HADIR', label: 'Hadir / Pulang' },
              { value: 'BEKERJA', label: 'Sedang Bekerja' },
              { value: 'BELUM_MASUK', label: 'Belum Masuk' }
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            icon={Filter}
          />
        </div>

        {/* Table / Empty States */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : !selectedDate ? (
          <EmptyState
            title="Silakan pilih tanggal"
            description="Pilih tanggal untuk melihat data absensi karyawan."
          />
        ) : filteredRecords.length === 0 ? (
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
                    <TableHeaderCell>Karyawan</TableHeaderCell>
                    <TableHeaderCell>Jam Masuk</TableHeaderCell>
                    <TableHeaderCell>Jam Pulang</TableHeaderCell>
                    <TableHeaderCell>Durasi Kerja</TableHeaderCell>
                    <TableHeaderCell>Total Upah</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Sumber</TableHeaderCell>
                    <TableHeaderCell align="center">Koreksi</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="text-slate-500 font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {item.employeeName}
                        <span className="block text-[10px] font-normal text-slate-400">
                          ID: {item.employeeId}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{item.checkIn || '-'}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{item.checkOut || '-'}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {item.totalMinutes ? formatMinutesToHours(item.totalMinutes) : '-'}
                      </TableCell>
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
                      <TableCell>
                        {item.source === 'ADMIN' ? (
                          <Badge variant="purple" size="sm">ADMIN (KOREKSI)</Badge>
                        ) : (
                          <Badge variant="blue" size="sm">SISTEM</Badge>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenCorrection(item)}
                          title="Koreksi Jam Kerja"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredRecords.map((item) => (
                <div
                  key={item.id || item.employeeId}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs"
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
                    <div className="flex flex-col items-end gap-1">
                      {item.status === 'HADIR' ? (
                        <Badge variant="green" size="sm" dot>PULANG</Badge>
                      ) : item.status === 'BEKERJA' ? (
                        <Badge variant="orange" size="sm" dot>BEKERJA</Badge>
                      ) : (
                        <Badge variant="red" size="sm" dot>BELUM MASUK</Badge>
                      )}
                      {item.source === 'ADMIN' && (
                        <Badge variant="purple" size="sm">KOREKSI</Badge>
                      )}
                    </div>
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
                      <span className="text-slate-700 font-medium">
                        {item.totalMinutes ? formatMinutesToHours(item.totalMinutes) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Upah:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {item.totalPay ? formatRupiah(item.totalPay) : '-'}
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleOpenCorrection(item)}
                    >
                      Koreksi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ContentCard>

      {/* Modal Koreksi Absensi */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="Koreksi Absensi Karyawan"
        subtitle={`Karyawan: ${editingRecord?.employeeName} (${editingRecord?.employeeId})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRecord(null)} isDisabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmitCorrection} isLoading={isSaving}>
              Simpan Koreksi
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Masuk"
              type="time"
              value={correctionForm.checkIn}
              onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
              isRequired
            />

            <Input
              label="Jam Pulang"
              type="time"
              value={correctionForm.checkOut}
              onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
              isRequired
            />
          </div>

          <Textarea
            label="Catatan / Alasan Koreksi"
            placeholder="Contoh: Karyawan lupa absen masuk karena mati listrik"
            value={correctionForm.note}
            onChange={(e) => setCorrectionForm({ ...correctionForm, note: e.target.value })}
            error={correctionError}
            helperText="Catatan ini akan dicatat dalam audit log aktivitas admin."
            isRequired
          />
        </form>
      </Modal>
    </div>
  );
}
