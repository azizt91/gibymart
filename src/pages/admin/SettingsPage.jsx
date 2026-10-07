import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ContentCard from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Save, Store, Clock, DollarSign, Globe } from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();

  const [settings, setSettings] = useState({
    nama_toko: 'GIBY MART',
    jam_masuk_standar: '08:00',
    jam_pulang_standar: '17:00',
    durasi_istirahat_menit: '60',
    metode_upah: 'PER_JAM',
    pembulatan_menit: '1',
    timezone: 'Asia/Jakarta'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsAPI.get();
      if (res.success && res.data) {
        const mapped = {};
        res.data.forEach((item) => {
          mapped[item.key] = item.value;
        });
        setSettings((prev) => ({ ...prev, ...mapped }));
      }
    } catch (err) {
      toast.error('Gagal memuat pengaturan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Simulate saving each setting
      const res = await settingsAPI.update('all', settings);
      if (res.success) {
        toast.success('Pengaturan sistem berhasil disimpan!');
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ContentCard title="Pengaturan Sistem">
        <TableSkeleton rows={6} cols={2} />
      </ContentCard>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Konfigurasi standar operasional toko, jam kerja, dan formula kalkulasi upah GIBY MART
        </p>
      </div>

      <form onSubmit={handleSave}>
        <ContentCard
          title="Pengaturan General & Jam Kerja"
          footer={
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                isLoading={isSaving}
              >
                Simpan Pengaturan
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Nama Toko */}
            <Input
              label="Nama Toko / Minimarket"
              value={settings.nama_toko}
              onChange={(e) => setSettings({ ...settings, nama_toko: e.target.value })}
              icon={Store}
              helperText="Nama toko yang tampil pada header aplikasi dan laporan PDF/Excel"
              isRequired
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jam Masuk Standar */}
              <Input
                label="Jam Masuk Standar"
                type="time"
                value={settings.jam_masuk_standar}
                onChange={(e) => setSettings({ ...settings, jam_masuk_standar: e.target.value })}
                icon={Clock}
                isRequired
              />

              {/* Jam Pulang Standar */}
              <Input
                label="Jam Pulang Standar"
                type="time"
                value={settings.jam_pulang_standar}
                onChange={(e) => setSettings({ ...settings, jam_pulang_standar: e.target.value })}
                icon={Clock}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Durasi Istirahat */}
              <Input
                label="Durasi Istirahat (menit)"
                type="number"
                value={settings.durasi_istirahat_menit}
                onChange={(e) => setSettings({ ...settings, durasi_istirahat_menit: e.target.value })}
                helperText="Menit istirahat yang dipotong dari total durasi kerja"
                isRequired
              />

              {/* Metode Upah */}
              <Select
                label="Metode Kalkulasi Upah"
                options={[
                  { value: 'PER_JAM', label: 'Per Jam (Rupiah per jam / 60 menit)' },
                  { value: 'FLAT_HARIAN', label: 'Flat Harian' },
                ]}
                value={settings.metode_upah}
                onChange={(e) => setSettings({ ...settings, metode_upah: e.target.value })}
                icon={DollarSign}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pembulatan Menit */}
              <Select
                label="Pembulatan Menit Kerja"
                options={[
                  { value: '1', label: 'Tanpa Pembulatan (Presisi 1 Menit)' },
                  { value: '5', label: 'Pembulatan 5 Menit' },
                  { value: '15', label: 'Pembulatan 15 Menit' },
                ]}
                value={settings.pembulatan_menit}
                onChange={(e) => setSettings({ ...settings, pembulatan_menit: e.target.value })}
                isRequired
              />

              {/* Timezone */}
              <Input
                label="Zona Waktu (Timezone)"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                icon={Globe}
                isDisabled
                helperText="Waktu Indonesia Barat (Asia/Jakarta)"
              />
            </div>
          </div>
        </ContentCard>
      </form>
    </div>
  );
}
