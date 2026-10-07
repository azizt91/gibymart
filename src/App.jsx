import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';

// Pages
import AttendancePage from './pages/attendance/AttendancePage';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import AttendanceAdminPage from './pages/admin/AttendanceAdminPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import MonthlyRecapPage from './pages/admin/MonthlyRecapPage';
import DailyRecapPage from './pages/admin/DailyRecapPage';
import SettingsPage from './pages/admin/SettingsPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';

/**
 * Protected Route wrapper — redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Attendance Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<AttendancePage />} />
        <Route path="/absensi" element={<AttendancePage />} />
      </Route>

      {/* Login Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* Employee Portal Routes */}
      <Route path="/karyawan" element={<Navigate to="/login?tab=karyawan" replace />} />
      <Route path="/karyawan/login" element={<Navigate to="/login?tab=karyawan" replace />} />
      <Route path="/karyawan/dashboard" element={<EmployeeDashboardPage />} />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="absensi" element={<AttendanceAdminPage />} />
        <Route path="karyawan" element={<EmployeesPage />} />
        <Route path="rekap" element={<MonthlyRecapPage />} />
        <Route path="rekap-harian" element={<DailyRecapPage />} />
        <Route path="pengaturan" element={<SettingsPage />} />
        <Route path="log-aktivitas" element={<ActivityLogPage />} />
      </Route>

      {/* Catch all — redirect to attendance */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
