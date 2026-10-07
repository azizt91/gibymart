import { useState, useEffect, useMemo } from 'react';
import { employeeAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
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
  const [formData, setFormData] = useState({ employeeCode: '', name: '', hourlyRate: 10000, status: 'AKTIF', pin: '1234' });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Status Toggle Dialog State
  const [confirmToggleData, setConfirmToggleData] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await employeeAPI.getAll();
      if (res.success) {
        setEmployees(Array.isArray(res.data) ? res.data : []);
      } else {
        toast.error(res.message || 'Gagal mengambil data karyawan.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered employees memo
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const empName = emp.name || '';
      const empCode = emp.employeeCode || emp.id || '';
      const matchesSearch =
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Open Modal (Add or Edit)
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({ employeeCode: '', name: '', hourlyRate: 10000, status: 'AKTIF', pin: '1234' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode || '',
      name: emp.name,
      hourlyRate: emp.hourlyRate,
      status: emp.status,
      pin: emp.pin || '1234'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Form Add/Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama karyawan tidak boleh kosong.');
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
          await fetchEmployees();
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Gagal mengupdate data.');
        }
      } else {
        // Add Mode
        const res = await employeeAPI.add(formData);
        if (res.success) {
          toast.success(`Karyawan ${formData.name} berhasil ditambahkan.`);
          await fetchEmployees();
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Gagal menambahkan karyawan.');
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status Confirm
  const handleConfirmStatusToggle = async () => {
    if (!confirmToggleData) return;
    const newStatus = confirmToggleData.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    setIsToggling(true);
    try {
      const res = await employeeAPI.update({
        id: confirmToggleData.id,
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Status ${confirmToggleData.name} diubah menjadi ${newStatus}.`);
        await fetchEmployees();
        setConfirmToggleData(null);
      } else {
        toast.error(res.message || 'Gagal mengubah status.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Data Karyawan</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Kelola daftar karyawan dan tarif upah per jam operasional GIBY MART
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={handleOpenAddModal} className="shadow-sm">
          + Tambah Karyawan
        </Button>
      </div>

      {/* Main Content Card with Search & Filters */}
      <ContentCard>
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 mb-6 p-3 sm:p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari nama atau ID karyawan..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-52">
            <Select
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'NONAKTIF', label: 'Non-Aktif' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              icon={Filter}
            />
          </div>
        </div>

        {/* Employees Table */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            title="Tidak Ada Karyawan"
            description={
              searchQuery
                ? `Tidak ada karyawan yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada data karyawan yang terdaftar.'
            }
            actionLabel={!searchQuery ? '+ Tambah Karyawan Pertama' : undefined}
            onAction={!searchQuery ? handleOpenAddModal : undefined}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>No</TableHeaderCell>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>Nama Karyawan</TableHeaderCell>
                    <TableHeaderCell>Tarif / Jam</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="center">Aksi</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((emp, idx) => (
                    <TableRow key={emp.id || idx}>
                      <TableCell className="text-slate-400 font-semibold">{idx + 1}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {emp.employeeCode || emp.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        <div>{emp.name}</div>
                        <div className="text-[11px] font-mono font-semibold text-slate-400 mt-0.5">
                          PIN: <span className="text-slate-600">{emp.pin || '1234'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        {formatRupiah(emp.hourlyRate)} / jam
                      </TableCell>
                      <TableCell>
                        {emp.status === 'AKTIF' ? (
                          <Badge variant="green" size="sm" dot>AKTIF</Badge>
                        ) : (
                          <Badge variant="gray" size="sm" dot>NONAKTIF</Badge>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(emp)}
                            title="Edit Karyawan"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmToggleData(emp)}
                            title={emp.status === 'AKTIF' ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              emp.status === 'AKTIF'
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200/80'
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200/80'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {emp.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                        ID: {emp.id}
                      </span>
                    </div>
                    {emp.status === 'AKTIF' ? (
                      <Badge variant="green" size="sm" dot>AKTIF</Badge>
                    ) : (
                      <Badge variant="gray" size="sm" dot>NONAKTIF</Badge>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tarif Per Jam:</span>
                      <strong className="text-emerald-700 font-bold text-sm">
                        {formatRupiah(emp.hourlyRate)} / jam
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
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
                        onClick={() => setConfirmToggleData(emp)}
                        className={emp.status === 'AKTIF' ? 'text-amber-600' : 'text-emerald-600'}
                      >
                        {emp.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ContentCard>

      {/* Modal Form Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        subtitle={editingEmployee ? `ID Karyawan: ${editingEmployee.id}` : 'Lengkapi informasi data karyawan di bawah ini'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)} isDisabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmitForm} isLoading={isSaving} className="shadow-md shadow-blue-500/20">
              {editingEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4" style={{ gap: '18px' }}>
          <Input
            label="Kode Karyawan"
            placeholder="Contoh: K001 (Kosongkan jika ingin dibuat otomatis)"
            value={formData.employeeCode}
            onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
            helperText="Kode identitas unik karyawan (misal: K001, K002)"
          />

          <Input
            label="Nama Lengkap Karyawan"
            placeholder="Contoh: Budi Santoso"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formError}
            isRequired
          />

          <Input
            label="Tarif Upah Per Jam (Rupiah)"
            type="number"
            placeholder="10000"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
            helperText="Default tarif: Rp 10.000 / jam"
            isRequired
          />

          <Input
            label="PIN Login Portal Karyawan"
            placeholder="1234"
            maxLength={6}
            value={formData.pin}
            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
            helperText="Digunakan oleh karyawan untuk login melihat jam & upah (Default: 1234)"
            isRequired
          />

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
  );
}
