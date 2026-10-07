# GIBY MART — Sistem Absensi Karyawan

Aplikasi web modern untuk manajemen absensi karyawan, perhitungan upah kerja per jam, rekap bulanan/harian, serta Portal Mandiri Karyawan berbasis **React 19**, **Vite**, **Tailwind CSS v4**, dan backend database **Supabase (PostgreSQL)**.

---

## Fitur Utama

### 1. Panel Admin & Superadmin
- **Dashboard Utama:** Ringkasan operasional real-time (total karyawan, yang sedang bekerja, sudah pulang, KPI bulanan, dan grafik kehadiran).
- **Manajemen Absensi:** Pemantauan absensi masuk/pulang harian dan fitur koreksi manual admin.
- **Data Karyawan:** Tambah, edit, atur tarif upah per jam, kode karyawan (K001, K002), dan status aktif/nonaktif.
- **Rekap Bulanan & Harian:** Perhitungan total durasi jam kerja, estimasi upah bersih, rincian harian, serta fitur **Export CSV** (Excel ready).
- **Log Aktivitas:** Audit trail pencatatan aktivitas admin secara real-time.
- **Pengaturan Toko:** Konfigurasi jam operasional, radius GPS/WiFi, dan toleransi keterlambatan.

### 2. Portal Karyawan (Self-Service)
- Login mandiri menggunakan Nama / Kode Karyawan & PIN keamanan.
- Absen masuk & absen pulang cepat.
- Pantau akumulasi jam kerja dan estimasi upah bulan berjalan.
- Rincian riwayat absensi harian dalam tampilan kartu responsif di layar HP.
- Ganti PIN mandiri.

---

## Teknologi

- **Frontend:** React 19, Vite 8, React Router v7, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend / Database:** 100% Supabase (PostgreSQL, Row Level Security, Auth Session)
- **Format Jam & Tanggal:** Real-time Asia/Jakarta (WIB)

---

## Panduan Instalasi Lokal

1. **Clone repositori:**
   ```bash
   git clone https://github.com/azizt91/gibymart.git
   cd gibymart
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (.env):**
   Salin `.env.example` ke `.env` dan sesuaikan kredensial Supabase:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_USE_MOCK=false
   ```

4. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

5. **Build untuk produksi:**
   ```bash
   npm run build
   ```
