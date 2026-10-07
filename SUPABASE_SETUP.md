# DOKUMENTASI SETUP SUPABASE POSTGRESQL (TAHAP 1)
**Aplikasi: GIBY MART — Sistem Absensi Karyawan**

> **STATUS SISTEM AKTIF SAAT INI:**
> Sistem operasional harian **MASIH 100% MENGGUNAKAN GOOGLE APPS SCRIPT & GOOGLE SHEETS**.
> Tahap 1 hanya menyiapkan fondasi database Supabase PostgreSQL, trigger, index, dan aturan keamanan (RLS). Tidak ada kode frontend, alur absensi, maupun endpoint Google Apps Script yang diubah atau dihentikan.

---

## 1. Tujuan Migrasi

Sistem absensi GIBY MART saat ini menggunakan Google Sheets melalui Google Apps Script sebagai penyimpanan data. Meskipun sederhana dan mudah diakses, Google Sheets memiliki keterbatasan:
- Batasan kuota harian execution time dan request per menit pada Google Apps Script.
- Ketiadaan integritas referensial (foreign key) dan ACID transaction yang ketat.
- Kurangnya fleksibilitas query relasional dan indeksasi untuk data historis absensi yang terus bertambah.
- Kecepatan response time (latensi) Google Apps Script yang relatif lebih tinggi dibandingkan query PostgreSQL langsung.

**Tujuan Tahap 1** adalah mempersiapkan arsitektur database relasional modern di Supabase (PostgreSQL) yang aman, memiliki integritas data tinggi, performa optimal dengan indexing, dan siap diintegrasikan secara bertahap tanpa downtime pada sistem produksi.

---

## 2. Arsitektur Lama (Aktif Saat Ini)

```text
[ Browser Client ]
  └── React 19 + Vite (Hosted di Netlify)
        └── src/services/api.js (fetch HTTP POST/GET)
              └── Google Apps Script (Web App Executable)
                    └── Google Sheets Database:
                          ├── Sheet KARYAWAN
                          ├── Sheet ABSENSI
                          ├── Sheet ADMIN
                          ├── Sheet PENGATURAN
                          └── Sheet LOG_AKTIVITAS
```

*Catatan: Alur ini tetap aktif sepenuhnya dan tidak terganggu sama sekali pada Tahap 1.*

---

## 3. Arsitektur Target (Pasca Migrasi Penuh)

```text
[ Browser Client ]
  └── React + Vite (Netlify)
        ├── Supabase Auth (Manajemen Sesi Admin aman via JWT, tanpa plaintext password)
        └── Supabase Client (PostgreSQL via REST & Realtime berkecepatan tinggi)
              └── Database PostgreSQL (Supabase Cloud):
                    ├── Row Level Security (RLS Terkunci)
                    ├── Tabel: employees, attendance, admin_profiles, settings, activity_logs
                    └── Database Functions & Triggers (auto updated_at, integritas relasi)
```

---

## 4. Daftar Tabel

| No | Nama Tabel | Kategori | Keterangan |
|---|---|---|---|
| 1 | `employees` | Master Data | Data induk seluruh karyawan aktif & nonaktif |
| 2 | `attendance` | Transaksi | Catatan presensi harian, jam kerja, dan perhitungan upah |
| 3 | `admin_profiles` | Autentikasi | Profil admin terhubung ke `auth.users` Supabase |
| 4 | `settings` | Konfigurasi | Pengaturan jam kerja, tarif, dan parameter toko |
| 5 | `activity_logs` | Audit Trail | Log riwayat aktivitas admin dan sistem |

---

## 5. Struktur Setiap Tabel

### 5.1. Tabel `employees`
Menyimpan data master karyawan toko.

| Kolom | Tipe Data | Nullable | Default | Keterangan / Constraint |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Primary Key |
| `employee_code` | `TEXT` | NOT NULL | - | Kode unik karyawan (`UNIQUE`) |
| `name` | `TEXT` | NOT NULL | - | Nama lengkap karyawan |
| `hourly_rate` | `NUMERIC(12,2)` | NOT NULL | `0` | Tarif upah per jam |
| `status` | `TEXT` | NOT NULL | `'AKTIF'` | `CHECK (status IN ('AKTIF', 'NONAKTIF'))` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Waktu data dibuat |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Otomatis diperbarui via trigger |

### 5.2. Tabel `attendance`
Menyimpan presensi masuk/pulang karyawan per hari serta kalkulasi jam & upah.

| Kolom | Tipe Data | Nullable | Default | Keterangan / Constraint |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Primary Key |
| `attendance_date`| `DATE` | NOT NULL | - | Tanggal absensi |
| `employee_id` | `UUID` | NOT NULL | - | Foreign Key ke `employees(id)` |
| `employee_name` | `TEXT` | NULL | - | Snapshot nama karyawan saat absensi |
| `check_in` | `TIMESTAMPTZ` | NULL | - | Waktu tepat absensi masuk |
| `check_out` | `TIMESTAMPTZ` | NULL | - | Waktu tepat absensi pulang |
| `total_minutes` | `INTEGER` | NOT NULL | `0` | Total durasi kerja dalam menit |
| `total_hours` | `NUMERIC(10,2)`| NOT NULL | `0` | Total jam kerja |
| `hourly_rate` | `NUMERIC(12,2)`| NOT NULL | `0` | Tarif upah per jam |
| `total_pay` | `NUMERIC(14,2)`| NOT NULL | `0` | Total upah yang diterima |
| `status` | `TEXT` | NOT NULL | `'BEKERJA'` | `CHECK (status IN ('BEKERJA', 'SELESAI', 'DIUBAH'))` |
| `source` | `TEXT` | NOT NULL | `'SISTEM'` | Sumber pencatatan absensi |
| `notes` | `TEXT` | NULL | - | Catatan / keterangan tambahan |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Otomatis diperbarui via trigger |

> **Constraint Penting:**
> `CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date)`
> Memastikan bahwa satu karyawan hanya dapat memiliki 1 record absensi per tanggal.

### 5.3. Tabel `admin_profiles`
Profil tambahan admin tanpa menyimpan password secara langsung, terikat ke sistem `auth.users` Supabase.

| Kolom | Tipe Data | Nullable | Default | Keterangan / Constraint |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | - | Primary Key, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `username` | `TEXT` | NOT NULL | - | Username login admin (`UNIQUE`) |
| `role` | `TEXT` | NOT NULL | `'SUPERADMIN'` | `CHECK (role IN ('SUPERADMIN', 'ADMIN'))` |
| `status` | `TEXT` | NOT NULL | `'AKTIF'` | `CHECK (status IN ('AKTIF', 'NONAKTIF'))` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Waktu akun didaftarkan |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Otomatis diperbarui via trigger |

### 5.4. Tabel `settings`
Menyimpan konfigurasi umum aplikasi GIBY MART dalam bentuk pasangan kunci dan nilai.

| Kolom | Tipe Data | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `key` | `TEXT` | NOT NULL | - | Primary Key identifier pengaturan |
| `value` | `TEXT` | NOT NULL | - | Nilai konfigurasi |

**Data Awal (7 Pengaturan Standar):**
1. `nama_toko` = `GIBY MART`
2. `jam_masuk_standar` = `08:00`
3. `jam_pulang_standar` = `17:00`
4. `durasi_istirahat_menit` = `60`
5. `metode_upah` = `PER_JAM`
6. `pembulatan_menit` = `1`
7. `timezone` = `Asia/Jakarta`

### 5.5. Tabel `activity_logs`
Menyimpan audit trail aktivitas penting admin dan sistem.

| Kolom | Tipe Data | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | Primary Key |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Timestamp log dicatat |
| `admin_id` | `UUID` | NULL | - | `REFERENCES admin_profiles(id) ON DELETE SET NULL` |
| `username` | `TEXT` | NULL | - | Nama admin saat melakukan aksi |
| `action` | `TEXT` | NOT NULL | - | Aksi yang dilakukan (contoh: UPDATE_EMPLOYEE) |
| `target` | `TEXT` | NULL | - | Entitas sasaran (contoh: attendance, employee) |
| `target_id` | `TEXT` | NULL | - | ID dari entitas sasaran |
| `detail` | `TEXT` | NULL | - | Keterangan detail perubahan (JSON / deskripsi) |
| `client_info` | `TEXT` | NULL | - | User-Agent / IP / Info client |

---

## 6. Relationship Antar Tabel (Entity Relationship)

```text
       auth.users (Supabase Auth Core)
             │
             │ 1 : 1 (ON DELETE CASCADE)
             ▼
      admin_profiles
             │
             │ 1 : N (ON DELETE SET NULL)
             ▼
       activity_logs

      employees
             │
             │ 1 : N (ON DELETE RESTRICT)
             ▼
        attendance
      [UNIQUE: employee_id + attendance_date]
```

1. **`auth.users` ↔ `admin_profiles`**: Relasi One-to-One. Akun admin dibuat melalui Supabase Auth, dan profil admin (`username`, `role`, `status`) disimpan di `admin_profiles` dengan referensi ID yang sama.
2. **`employees` ↔ `attendance`**: Relasi One-to-Many. Setiap data absensi wajib merujuk ke data karyawan yang valid di tabel `employees`. Menggunakan `ON DELETE RESTRICT` untuk mencegah data absensi historis hilang jika data karyawan tidak sengaja dihapus.
3. **`admin_profiles` ↔ `activity_logs`**: Relasi One-to-Many. Jika admin dihapus, riwayat log audit tetap dipertahankan (`ON DELETE SET NULL`).

---

## 7. Index Performa

Daftar index yang disiapkan untuk mengoptimalkan performa query:
- `idx_attendance_date` pada `attendance(attendance_date)`: Mempercepat filter absensi berdasarkan rentang tanggal atau tanggal aktif.
- `idx_attendance_employee_id` pada `attendance(employee_id)`: Mempercepat pengambilan riwayat absensi per karyawan.
- `idx_attendance_check_in` pada `attendance(check_in)`: Mempercepat laporan berdasarkan jam masuk.
- `idx_attendance_check_out` pada `attendance(check_out)`: Mempercepat query karyawan yang belum check-out.
- `idx_employees_status` pada `employees(status)`: Mempercepat filter daftar karyawan yang berstatus 'AKTIF'.
- `idx_activity_logs_created_at` pada `activity_logs(created_at DESC)`: Mempercepat pembacaan riwayat aktivitas terbaru.
- **Index Gabungan (Composite Index)**: Index untuk `(employee_id, attendance_date)` otomatis dioptimasi oleh database melalui `UNIQUE CONSTRAINT uq_attendance_employee_date`.

---

## 8. Trigger `updated_at`

Dibuat fungsi PostgreSQL terpusat:
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Diterapkan ke 3 tabel yang memiliki kolom `updated_at`:
- `trigger_employees_updated_at` pada tabel `employees`
- `trigger_attendance_updated_at` pada tabel `attendance`
- `trigger_admin_profiles_updated_at` pada tabel `admin_profiles`

---

## 9. Row Level Security (RLS) & Catatan Keamanan

1. **RLS Diaktifkan di Semua Tabel**:
   - `employees`
   - `attendance`
   - `admin_profiles`
   - `settings`
   - `activity_logs`

2. **Tanpa Akses Anonymous Publik**:
   - **TIDAK ADA** kebijakan `USING (true)` yang dibuka untuk peran publik/anonymous (`anon`).
   - Setiap permintaan anonim dari browser tanpa token JWT autentikasi akan **otomatis ditolak (DENIED)** oleh database.
   - Kebijakan saat ini dikonfigurasi khusus untuk role `authenticated`.

3. **Keamanan Kredensial**:
   - Tidak ada kolom password plaintext atau password hash di tabel database aplikasi. Autentikasi diserahkan ke sistem `auth.users` Supabase.
   - **TIDAK ADA** `service_role` key yang disimpan di frontend atau file `.env`.
   - File `.env` aplikasi saat ini tetap murni menggunakan konfigurasi Google Apps Script tanpa gangguan.

---

## 10. Cara Eksekusi Skema di Supabase

File SQL lengkap telah disediakan pada file: [`supabase/schema.sql`](file:///c:/laragon/www/giby-mart-absensi/supabase/schema.sql)

Langkah eksekusi:
1. Buka dashboard proyek Supabase Anda ([supabase.com](https://supabase.com)).
2. Masuk ke menu **SQL Editor** pada navigasi sisi kiri.
3. Buat query baru (**New Query**).
4. Salin seluruh isi dari [`supabase/schema.sql`](file:///c:/laragon/www/giby-mart-absensi/supabase/schema.sql).
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
6. Verifikasi di menu **Table Editor** bahwa kelima tabel (`employees`, `attendance`, `admin_profiles`, `settings`, `activity_logs`) telah muncul dengan benar.

---

## 11. Langkah Tahap Berikutnya (Rekomendasi TAHAP 2)

Setelah Tahap 1 terverifikasi dan skema database di Supabase siap:
1. **Pembuatan Akun Admin di Supabase Auth**: Membuat user admin pertama melalui dashboard Supabase Auth atau script migrasi admin, lalu memasukkan entri profilnya ke `admin_profiles`.
2. **Migrasi Data Karyawan (Data Referensi)**: Melakukan migrasi data karyawan dari Google Sheets Sheet `KARYAWAN` ke tabel `employees`.
3. **Pengujian Paralel**: Mempersiapkan script atau service adapter untuk membaca data karyawan dari Supabase tanpa mematikan alur absensi Google Apps Script.
4. **Migrasi Data Riwayat Absensi**: Mentransfer data absensi masa lalu dari Google Sheets Sheet `ABSENSI` ke tabel `attendance`.
