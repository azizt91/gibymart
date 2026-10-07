-- ==============================================================================
-- GIBY MART ABSENSI - SKEMA DATABASE SUPABASE (POSTGRESQL) - TAHAP 1
-- ==============================================================================
-- Deskripsi: Menyiapkan DDL skema tabel, relasi, constraint, trigger updated_at,
--            index performa, konfigurasi default, dan Row Level Security (RLS).
-- Catatan:   Tidak mengubah backend aktif (Google Apps Script / Sheets) pada tahap ini.
-- ==============================================================================

-- 1. EKSTENSI (Pastikan pgcrypto / uuid-ossp tersedia jika diperlukan)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: employees (Karyawan)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.employees IS 'Tabel master data karyawan GIBY MART';
COMMENT ON COLUMN public.employees.employee_code IS 'Kode unik karyawan (misal: K001, K002)';
COMMENT ON COLUMN public.employees.hourly_rate IS 'Tarif upah per jam karyawan';
COMMENT ON COLUMN public.employees.status IS 'Status status kepegawaian (AKTIF / NONAKTIF)';

-- ==============================================================================
-- 3. TABEL: attendance (Absensi)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_date DATE NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    employee_name TEXT NULL,
    check_in TIMESTAMPTZ NULL,
    check_out TIMESTAMPTZ NULL,
    total_minutes INTEGER NOT NULL DEFAULT 0,
    total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_pay NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'BEKERJA' CHECK (status IN ('BEKERJA', 'SELESAI', 'DIUBAH')),
    source TEXT NOT NULL DEFAULT 'SISTEM',
    notes TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraint: 1 karyawan hanya memiliki 1 catatan absensi per tanggal
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

COMMENT ON TABLE public.attendance IS 'Catatan absensi harian dan perhitungan upah karyawan';
COMMENT ON CONSTRAINT uq_attendance_employee_date ON public.attendance IS 'Mencegah duplikasi data absensi untuk karyawan pada tanggal yang sama';

-- ==============================================================================
-- 4. TABEL: admin_profiles (Profil Admin terintegrasi dengan Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'SUPERADMIN' CHECK (role IN ('SUPERADMIN', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_profiles IS 'Profil tambahan untuk admin, terhubung dengan auth.users Supabase (tanpa plaintext password)';

-- ==============================================================================
-- 5. TABEL: settings (Pengaturan Aplikasi)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

COMMENT ON TABLE public.settings IS 'Parameter konfigurasi global aplikasi GIBY MART';

-- Inisialisasi 7 Pengaturan Default (Idempotent / Upsert)
INSERT INTO public.settings (key, value)
VALUES
    ('nama_toko', 'GIBY MART'),
    ('jam_masuk_standar', '08:00'),
    ('jam_pulang_standar', '17:00'),
    ('durasi_istirahat_menit', '60'),
    ('metode_upah', 'PER_JAM'),
    ('pembulatan_menit', '1'),
    ('timezone', 'Asia/Jakarta')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- 6. TABEL: activity_logs (Audit Trail / Riwayat Aktivitas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    admin_id UUID NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    username TEXT NULL,
    action TEXT NOT NULL,
    target TEXT NULL,
    target_id TEXT NULL,
    detail TEXT NULL,
    client_info TEXT NULL
);

COMMENT ON TABLE public.activity_logs IS 'Log audit pencatatan aksi admin dan aktivitas sistem';

-- ==============================================================================
-- 7. INDEX UNTUK PERFORMA QUERY
-- ==============================================================================
-- Index untuk filter dan pencarian absensi
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON public.attendance(check_in);
CREATE INDEX IF NOT EXISTS idx_attendance_check_out ON public.attendance(check_out);

-- Index untuk filter status karyawan
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Index urutan waktu activity log
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Catatan: Index gabungan (employee_id, attendance_date) otomatis terbuat dari UNIQUE CONSTRAINT uq_attendance_employee_date.

-- ==============================================================================
-- 8. TRIGGER OTOMATIS UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pada tabel employees
DROP TRIGGER IF EXISTS trigger_employees_updated_at ON public.employees;
CREATE TRIGGER trigger_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pada tabel attendance
DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance;
CREATE TRIGGER trigger_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pada tabel admin_profiles
DROP TRIGGER IF EXISTS trigger_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER trigger_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) - KEBIJAKAN KEAMANAN KETAT
-- ==============================================================================
-- Aktifkan RLS di seluruh tabel
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PENTING:
-- Sesuai standar keamanan Tahap 1, TIDAK DIIZINKAN membuka policy publik anonymous (USING true).
-- Seluruh akses data dibatasi hanya untuk user terautentikasi (authenticated) Supabase Auth.
-- Akses anonymous via browser otomatis DITOLAK (DENIED) oleh PostgreSQL RLS.

-- Kebijakan admin_profiles:
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.admin_profiles;
CREATE POLICY "Authenticated users can view own profile"
    ON public.admin_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Kebijakan employees:
DROP POLICY IF EXISTS "Authenticated users can read employees" ON public.employees;
CREATE POLICY "Authenticated users can read employees"
    ON public.employees
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can modify employees" ON public.employees;
CREATE POLICY "Authenticated users can modify employees"
    ON public.employees
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Kebijakan attendance:
DROP POLICY IF EXISTS "Authenticated users can read attendance" ON public.attendance;
CREATE POLICY "Authenticated users can read attendance"
    ON public.attendance
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can modify attendance" ON public.attendance;
CREATE POLICY "Authenticated users can modify attendance"
    ON public.attendance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Kebijakan settings:
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings"
    ON public.settings
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.settings;
CREATE POLICY "Authenticated users can update settings"
    ON public.settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Kebijakan activity_logs:
DROP POLICY IF EXISTS "Authenticated users can read activity_logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can read activity_logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert activity_logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity_logs"
    ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- 10. MIGRATION: Uang Makan Otomatis Saat Kehadiran (Meal Allowance)
-- ==============================================================================
-- Kolom meal_allowance pada employees untuk menyimpan nominal per hari karyawan
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.employees.meal_allowance IS 'Nominal uang makan harian otomatis saat karyawan hadir/bekerja';

-- Kolom meal_allowance pada attendance untuk pencatatan historis per hari
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.attendance.meal_allowance IS 'Nominal uang makan yang didapatkan pada tanggal absensi ini';

