/**
 * Empty Mock State
 * All dummy and simulated employee/attendance data has been completely eliminated.
 * Production mode (VITE_USE_MOCK=false) relies 100% on Google Sheets via Apps Script.
 */

export const mockEmployees = [];

export const mockTodayAttendance = [];

export const mockDashboard = {
  totalEmployees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  todayCheckedIn: 0,
  todayWorking: 0,
  todayCheckedOut: 0,
  todayNotCheckedIn: 0,
  todayTotalPay: 0,
  todayAttendance: [],
  chartData: [],
  monthlyRecapSummary: {
    month: '',
    year: new Date().getFullYear(),
    totalDays: 0,
    avgAttendance: '0 / 0',
    totalHoursMinutes: '0:00',
    totalPay: 0,
  },
};

export const mockMonthlyRecap = [];

export const mockSettings = [
  { key: 'nama_toko', value: 'GIBY MART' },
  { key: 'jam_masuk_standar', value: '08:00' },
  { key: 'jam_pulang_standar', value: '17:00' },
  { key: 'durasi_istirahat_menit', value: '60' },
  { key: 'metode_upah', value: 'PER_JAM' },
  { key: 'pembulatan_menit', value: '1' },
  { key: 'timezone', value: 'Asia/Jakarta' },
];

export const mockActivityLog = [];
