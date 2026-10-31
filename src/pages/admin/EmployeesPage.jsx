import { useState, useEffect, useMemo } from 'react';
import { employeeAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import useRealtimeAttendance from '../../hooks/useRealtimeAttendance';
import PullToRefresh from '../../components/ui/PullToRefresh';
import ContentCard from '../../components/ui/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatRupiah } from '../../utils/formatters';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power
} from 'lucide-react';

export default function EmployeesPage() {
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null); // null = Add mode, object = Edit mode
  const [formData, setFormData] = useState({ employeeCode: '', name: '', hourlyRate: 10000, mealAllowance: 0, status: 'AKTIF', pin: '1234' });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Status Toggle Dialog State
  const [confirmToggleData, setConfirmToggleData] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchEmployees = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await employeeAPI.getAll();
      if (res.success) {
        setEmployees(Array.isArray(res.data) ? res.data : []);
      } else {
        if (!isSilent) toast.error(res.message || 'Gagal mengambil data karyawan.');
      }
    } catch {
      if (!isSilent) toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Hubungkan ke Supabase Realtime
  useRealtimeAttendance(() => fetchEmployees(true), ['employees']);

  // Filtered employees memo
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Open Modal Add
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeCode: '',
      name: '',
      hourlyRate: 10000,
      mealAllowance: 0,
      status: 'AKTIF',
      pin: '1234',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode || '',
      name: emp.name || '',
      hourlyRate: emp.hourlyRate || 10000,
      mealAllowance: emp.mealAllowance || 0,
      status: emp.status || 'AKTIF',
      pin: emp.pin || '1234',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError('Nama lengkap karyawan wajib diisi.');
      return;
    }
    if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
      setFormError('Tarif per jam harus lebih dari 0.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEmployee) {
        // Edit Mode
        const res = await employeeAPI.update({
          id: editingEmployee.id,
          ...formData,
        });
        if (res.success) {
          toast.success(`Data ${formData.name} berhasil diperbarui.`);
          await fetchEmployees(true);
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Gagal mengupdate data.');
        }
      } else {
        // Add Mode
        const res = await employeeAPI.add(formData);
        if (res.success) {
          toast.success(`Karyawan ${formData.name} berhasil ditambahkan.`);
          await fetchEmployees(true);
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Gagal menambahkan karyawan.');
        }
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Toggle Status Click
  const handleToggleStatusClick = (emp) => {
    setConfirmToggleData(emp);
  };

  // Confirm Toggle Status Execution
  const handleConfirmStatusToggle = async () => {
    if (!confirmToggleData) return;
    setIsToggling(true);
    const newStatus = confirmToggleData.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    try {
      const res = await employeeAPI.update({
        id: confirmToggleData.id,
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Status ${confirmToggleData.name} diubah menjadi ${newStatus}.`);
        await fetchEmployees(true);
        setConfirmToggleData(null);
      } else {
        toast.error(res.message || 'Gagal mengubah status.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <PullToRefresh onRefresh={() => fetchEmployees(true)}>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Data Karyawan</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Realtime
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Kelola daftar karyawan dan tarif upah per jam operasional GIBY MART
            </p>
          </div>
          <Button variant="primary" icon={UserPlus} onClick={handleOpenAddModal} className="shadow-sm">
            + Tambah Karyawan
          </Button>
        </div>

        {/* Content Card with Filters & Table */}
        <ContentCard>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Cari nama atau kode karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'ALL', label: 'Semua Status' },
                  { value: 'AKTIF', label: 'Hanya Aktif' },
                  { value: 'NONAKTIF', label: 'Hanya Nonaktif' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                icon={Filter}
              />
            </div>
          </div>

          {/* Table View / States */}
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              title="Tidak ada karyawan ditemukan"
              description={
                searchQuery || statusFilter !== 'ALL'
                  ? 'Tidak ada data yang sesuai dengan filter pencarian.'
                  : 'Belum ada data karyawan terdaftar di sistem.'
              }
              action={
                searchQuery || statusFilter !== 'ALL' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Reset Filter
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenAddModal}>
                    Tambah Karyawan Pertama
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <TableRow hover={false}>
                      <TableHeaderCell>No</TableHeaderCell>
                      <TableHeaderCell>Kode</TableHeaderCell>
                      <TableHeaderCell>Nama Lengkap</TableHeaderCell>
                      <TableHeaderCell>Tarif / Jam</TableHeaderCell>
                      <TableHeaderCell>Uang Makan / Hari</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell align="center">Aksi</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.map((emp, idx) => (
                      <TableRow key={emp.id || idx}>
                        <TableCell className="text-slate-500 font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-accent-blue">
                          {emp.employeeCode || `K${String(emp.id).substring(0, 3)}`}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">{emp.name}</TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          {formatRupiah(emp.hourlyRate)}
                        </TableCell>
                        <TableCell className="font-semibold text-amber-700">
                          {formatRupiah(emp.mealAllowance || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.status === 'AKTIF' ? 'green' : 'gray'} dot size="sm">
                            {emp.status || 'AKTIF'}
                          </Badge>
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit2}
                              onClick={() => handleOpenEditModal(emp)}
                              title="Edit Data Karyawan"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Power}
                              className={
                                emp.status === 'AKTIF'
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }
                              onClick={() => handleToggleStatusClick(emp)}
                              title={emp.status === 'AKTIF' ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{emp.name}</h4>
                        <p className="text-xs font-mono font-bold text-accent-blue mt-0.5">
                          {emp.employeeCode || `K${String(emp.id).substring(0, 3)}`}
                        </p>
                      </div>
                      <Badge variant={emp.status === 'AKTIF' ? 'green' : 'gray'} dot size="sm">
                        {emp.status || 'AKTIF'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Tarif / Jam:</span>
                        <strong className="text-slate-700">{formatRupiah(emp.hourlyRate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Uang Makan / Hari:</span>
                        <strong className="text-amber-700">{formatRupiah(emp.mealAllowance || 0)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEditModal(emp)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={emp.status === 'AKTIF' ? 'secondary' : 'primary'}
                        size="sm"
                        icon={Power}
                        onClick={() => handleToggleStatusClick(emp)}
                      >
                        {emp.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ContentCard>

        {/* Modal Tambah / Edit Karyawan */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? `Edit Karyawan: ${editingEmployee.name}` : 'Tambah Karyawan Baru'}
          subtitle={
            editingEmployee
              ? 'Perbarui detail data tarif upah dan informasi karyawan'
              : 'Daftarkan karyawan baru ke sistem absensi toko GIBY MART'
          }
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} isDisabled={isSaving}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleSubmitForm} isLoading={isSaving}>
                {editingEmployee ? 'Simpan Perubahan' : 'Tambahkan Karyawan'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kode Karyawan"
                placeholder="Contoh: K001"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                helperText="Opsional: Otomatis dibuat jika dikosongkan"
              />

              <Input
                label="Nama Lengkap"
                placeholder="Contoh: Budi Santoso"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tarif Upah per Jam (Rp)"
                type="number"
                placeholder="10000"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                isRequired
              />

              <Input
                label="Uang Makan Harian (Rp)"
                type="number"
                placeholder="5000"
                value={formData.mealAllowance}
                onChange={(e) => setFormData({ ...formData, mealAllowance: Number(e.target.value) })}
                helperText="Otomatis dibayarkan saat hadir"
              />
            </div>

            <Select
              label="Status Karyawan"
              options={[
                { value: 'AKTIF', label: 'Aktif (Dapat Melakukan Absensi)' },
                { value: 'NONAKTIF', label: 'Non-Aktif (Diarsipkan)' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              isRequired
            />
          </form>
        </Modal>

        {/* Confirmation Dialog Toggle Status */}
        <ConfirmDialog
          isOpen={!!confirmToggleData}
          onClose={() => setConfirmToggleData(null)}
          onConfirm={handleConfirmStatusToggle}
          title={confirmToggleData?.status === 'AKTIF' ? 'Nonaktifkan Karyawan?' : 'Aktifkan Karyawan?'}
          message={`Apakah Anda yakin ingin mengubah status ${confirmToggleData?.name} menjadi ${confirmToggleData?.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF'}?`}
          confirmLabel={confirmToggleData?.status === 'AKTIF' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          variant={confirmToggleData?.status === 'AKTIF' ? 'warning' : 'info'}
          isLoading={isToggling}
        />
      </div>
    </PullToRefresh>
  );
}
