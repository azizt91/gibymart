/**
 * Application-wide constants
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || '';

// Dynamic USE_MOCK determination:
// If VITE_USE_MOCK is explicitly 'false', USE_MOCK will be false.
// If VITE_USE_MOCK is explicitly 'true', USE_MOCK will be true.
// Otherwise falls back to checking if API_URL is missing or placeholder.
const rawUseMock = import.meta.env.VITE_USE_MOCK;
export const USE_MOCK =
  rawUseMock === 'false'
    ? false
    : rawUseMock === 'true'
    ? true
    : (!API_URL || API_URL.includes('YOUR_DEPLOYMENT_ID'));

// App Info
export const APP_NAME = 'GIBY MART';
export const APP_TAGLINE = 'Sistem Absensi Karyawan';

// Timezone
export const TIMEZONE = 'Asia/Jakarta';

// Employee Status
export const EMPLOYEE_STATUS = {
  AKTIF: 'AKTIF',
  NONAKTIF: 'NONAKTIF',
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  BELUM_ABSEN: 'BELUM_ABSEN',
  BEKERJA: 'BEKERJA',
  HADIR: 'HADIR',
  DIKOREKSI: 'DIKOREKSI',
  BELUM_MASUK: 'BELUM_MASUK',
};

// Attendance Source
export const ATTENDANCE_SOURCE = {
  SISTEM: 'SISTEM',
  ADMIN: 'ADMIN',
};

// User Roles
export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
};

// Badge color mapping
export const STATUS_BADGE_COLORS = {
  // Attendance status
  [ATTENDANCE_STATUS.HADIR]: 'green',
  [ATTENDANCE_STATUS.BEKERJA]: 'blue',
  [ATTENDANCE_STATUS.BELUM_ABSEN]: 'yellow',
  [ATTENDANCE_STATUS.BELUM_MASUK]: 'red',
  [ATTENDANCE_STATUS.DIKOREKSI]: 'purple',
  PULANG: 'green',
  // Employee status
  [EMPLOYEE_STATUS.AKTIF]: 'green',
  [EMPLOYEE_STATUS.NONAKTIF]: 'gray',
};

// Navigation items for admin sidebar
export const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/absensi', label: 'Absensi', icon: 'ClipboardCheck' },
  { path: '/admin/karyawan', label: 'Karyawan', icon: 'Users' },
  { path: '/admin/rekap', label: 'Rekap', icon: 'BarChart3' },
  { path: '/admin/pengaturan', label: 'Pengaturan', icon: 'Settings' },
  { path: '/admin/log-aktivitas', label: 'Log Aktivitas', icon: 'ScrollText' },
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Date formats (for date-fns)
export const DATE_FORMAT = {
  DISPLAY: 'dd MMMM yyyy',
  DISPLAY_SHORT: 'dd MMM yyyy',
  DISPLAY_WITH_DAY: 'EEEE, dd MMMM yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss',
  TIME_SHORT: 'HH:mm',
  DATETIME: 'dd-MM-yyyy HH:mm',
};

// Months in Indonesian
export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Days in Indonesian
export const DAYS_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];
