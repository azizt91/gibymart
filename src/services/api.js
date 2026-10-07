/**
 * API Service Layer — 100% Supabase Implementation
 * Direct PostgreSQL access via Supabase Client (@supabase/supabase-js)
 * Fully disconnected from Google Apps Script.
 */

import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

// ============================================
// Helper: Helper Date and Time utilities
// ============================================
const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');
const getCurrentTimeString = () => format(new Date(), 'HH:mm:ss');

export const formatTimeForDisplay = (val) => {
  if (!val || val === '-' || val === 'null' || val === 'undefined') return '-';
  if (typeof val === 'string') {
    if (val.includes('T')) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta',
          }).replace(/\./g, ':');
        }
      } catch {
        return val;
      }
    }
    return val.replace(/\./g, ':');
  }
  return String(val);
};

export const formatDateTimeForDisplay = (val) => {
  if (!val || val === '-' || val === 'null' || val === 'undefined') return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const datePart = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).replace(/\./g, ':');
    return `${datePart}, ${timePart}`;
  } catch {
    return String(val);
  }
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    return d.getHours() * 60 + d.getMinutes();
  }
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// Helper: safe log activity in background
const logActivity = async (action, detail = '', target = '') => {
  try {
    const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const adminId = authUser.id && authUser.id.length === 36 ? authUser.id : null;
    const username = authUser.username || authUser.name || 'admin';
    await supabase.from('activity_logs').insert({
      action,
      detail,
      target,
      admin_id: adminId,
      username: username,
    });
  } catch (err) {
    console.warn('[Log] Failed to record activity log:', err);
  }
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: async (identifier, password) => {
    try {
      let email = identifier.trim();

      // If user typed username, lookup email from admin_profiles
      if (!email.includes('@')) {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('email')
          .ilike('username', email)
          .maybeSingle();

        if (profile?.email) {
          email = profile.email;
        } else {
          return {
            success: false,
            message: 'Username tidak ditemukan. Silakan masukkan email yang terdaftar di Supabase.',
          };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email/username atau password salah.';
        }
        return { success: false, message: msg };
      }

      logActivity('LOGIN', `Admin berhasil login`, email);

      return {
        success: true,
        data: {
          token: data.session?.access_token,
          role: 'SUPERADMIN',
          username: email.split('@')[0],
          id: data.user.id,
        },
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  validateToken: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        success: !!session,
        data: {
          valid: !!session,
          role: 'SUPERADMIN',
          username: session?.user?.email?.split('@')[0] || 'admin',
        },
      };
    } catch {
      return { success: false };
    }
  },
};

// Helper: get and save meal allowance map from settings
export const getMealAllowanceMap = async () => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'meal_allowance_map')
      .maybeSingle();

    if (data && data.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.warn('[MealAllowance] Failed to read map:', err);
  }
  return {};
};

export const saveMealAllowance = async (employeeId, employeeCode, amount) => {
  try {
    const currentMap = await getMealAllowanceMap();
    const val = Number(amount) || 0;
    if (employeeId) currentMap[String(employeeId)] = val;
    if (employeeCode) currentMap[String(employeeCode)] = val;
    await supabase.from('settings').upsert({
      key: 'meal_allowance_map',
      value: JSON.stringify(currentMap),
    }, { onConflict: 'key' });
  } catch (err) {
    console.warn('[MealAllowance] Failed to save allowance:', err);
  }
};

// ============================================
// EMPLOYEE API
// ============================================
export const employeeAPI = {
  getAll: async () => {
    try {
      const [empRes, mealMap] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: true }),
        getMealAllowanceMap(),
      ]);

      if (empRes.error) throw empRes.error;

      const formatted = (empRes.data || []).map((emp) => {
        const mealAllowance = Number(
          mealMap[String(emp.id)] ??
          mealMap[emp.employee_code] ??
          emp.meal_allowance ??
          0
        );

        return {
          id: String(emp.id),
          employeeCode: emp.employee_code || `K${String(emp.id).substring(0, 3)}`,
          name: emp.name,
          hourlyRate: Number(emp.hourly_rate) || 10000,
          mealAllowance,
          status: emp.status || 'AKTIF',
          pin: emp.pin || '1234',
          createdAt: emp.created_at,
          updatedAt: emp.updated_at,
        };
      });

      return { success: true, data: formatted };
    } catch (err) {
      console.error('[EmployeeAPI] getAll error:', err);
      return { success: false, message: err.message || 'Gagal memuat data karyawan.' };
    }
  },

  getActive: async () => {
    try {
      const [empRes, mealMap] = await Promise.all([
        supabase
          .from('employees')
          .select('id, employee_code, name, hourly_rate')
          .eq('status', 'AKTIF')
          .order('name', { ascending: true }),
        getMealAllowanceMap(),
      ]);

      if (empRes.error) throw empRes.error;

      const formatted = (empRes.data || []).map((emp) => ({
        id: String(emp.id),
        employeeCode: emp.employee_code || String(emp.id),
        name: emp.name,
        hourlyRate: Number(emp.hourly_rate) || 10000,
        mealAllowance: Number(
          mealMap[String(emp.id)] ??
          mealMap[emp.employee_code] ??
          0
        ),
      }));

      return { success: true, data: formatted };
    } catch (err) {
      console.error('[EmployeeAPI] getActive error:', err);
      return { success: false, message: err.message || 'Gagal memuat karyawan aktif.' };
    }
  },

  add: async (formData) => {
    try {
      let code = formData.employeeCode || formData.employee_code;
      if (!code || !code.trim()) {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });
        const nextNum = (count || 0) + 1;
        code = `K${String(nextNum).padStart(3, '0')}`;
      } else {
        code = code.trim().toUpperCase();
      }

      const mealAllowance = Number(formData.mealAllowance) || 0;

      const payload = {
        employee_code: code,
        name: formData.name?.trim(),
        hourly_rate: Number(formData.hourlyRate) || 10000,
        meal_allowance: mealAllowance,
        status: formData.status || 'AKTIF',
        pin: formData.pin ? String(formData.pin).trim() : '1234',
      };

      if (formData.id) {
        payload.id = formData.id;
      }

      const { data, error } = await supabase
        .from('employees')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Persist meal allowance map as fallback
      await saveMealAllowance(data.id, data.employee_code, mealAllowance);

      logActivity('TAMBAH_KARYAWAN', `Menambahkan karyawan ${data.name} (${data.employee_code}) - Uang Makan: Rp ${mealAllowance.toLocaleString('id-ID')}`, `Kode: ${data.employee_code}`);

      return {
        success: true,
        data: {
          id: String(data.id),
          employeeCode: data.employee_code,
          name: data.name,
          hourlyRate: Number(data.hourly_rate),
          mealAllowance,
          status: data.status,
          pin: data.pin || '1234',
        },
        message: 'Karyawan berhasil ditambahkan.',
      };
    } catch (err) {
      console.error('[EmployeeAPI] add error:', err);
      return { success: false, message: err.message || 'Gagal menambahkan karyawan.' };
    }
  },

  update: async (formData) => {
    try {
      const mealAllowance = Number(formData.mealAllowance ?? formData.meal_allowance ?? 0);
      const payload = {
        name: formData.name?.trim(),
        hourly_rate: Number(formData.hourlyRate) || 10000,
        meal_allowance: mealAllowance,
        status: formData.status || 'AKTIF',
        updated_at: new Date().toISOString(),
      };

      if (formData.employeeCode || formData.employee_code) {
        payload.employee_code = (formData.employeeCode || formData.employee_code).trim().toUpperCase();
      }

      if (formData.pin) {
        payload.pin = String(formData.pin).trim();
      }

      const { data, error } = await supabase
        .from('employees')
        .update(payload)
        .eq('id', formData.id)
        .select()
        .single();

      if (error) throw error;

      await saveMealAllowance(data.id, data.employee_code, mealAllowance);

      logActivity('UPDATE_KARYAWAN', `Memperbarui data karyawan ${data.name} (${data.employee_code}) - Uang Makan: Rp ${mealAllowance.toLocaleString('id-ID')}`, `Kode: ${data.employee_code}`);

      return {
        success: true,
        data: {
          id: String(data.id),
          employeeCode: data.employee_code,
          name: data.name,
          hourlyRate: Number(data.hourly_rate),
          mealAllowance,
          status: data.status,
          pin: data.pin || '1234',
        },
        message: 'Data karyawan berhasil diperbarui.',
      };
    } catch (err) {
      console.error('[EmployeeAPI] update error:', err);
      return { success: false, message: err.message || 'Gagal memperbarui data karyawan.' };
    }
  },
};

// Helper to safely format ISO timestamp from date + time
const makeIsoDateTime = (dateStr, timeStr) => {
  if (!timeStr || timeStr === '-') return null;
  if (typeof timeStr === 'string' && timeStr.includes('T')) return timeStr;
  const parts = String(timeStr).trim().split(':');
  const h = String(parts[0] || '0').padStart(2, '0');
  const m = String(parts[1] || '0').padStart(2, '0');
  const s = String(parts[2] || '0').padStart(2, '0');
  const d = new Date(`${dateStr}T${h}:${m}:${s}`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceAPI = {
  checkIn: async (employeeId) => {
    try {
      if (!employeeId) throw new Error('ID Karyawan wajib dipilih.');

      // 1. Fetch employee
      const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empErr || !emp) throw new Error('Data karyawan tidak ditemukan.');
      if (emp.status !== 'AKTIF') {
        throw new Error(`Karyawan ${emp.name} berstatus NONAKTIF dan tidak dapat melakukan absensi.`);
      }

      const today = getTodayDateString();
      const now = new Date();
      const nowIso = now.toISOString();
      const nowTime = format(now, 'HH:mm:ss');

      // 2. Check if already checked in today
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', String(employeeId))
        .or(`attendance_date.eq.${today},date.eq.${today}`)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          message: `Anda sudah melakukan absen masuk hari ini pada jam ${formatTimeForDisplay(existing.check_in)}.`,
        };
      }

      // 3. Insert record with proper timestamptz & attendance_date
      const insertPayload = {
        employee_id: String(emp.id),
        employee_name: emp.name,
        attendance_date: today,
        date: today,
        check_in: nowIso,
        check_out: null,
        status: 'BEKERJA',
        source: 'SISTEM',
        hourly_rate: Number(emp.hourly_rate) || 10000,
        total_minutes: 0,
        total_hours: 0,
        total_pay: 0,
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: String(data.id),
          employeeId: String(emp.id),
          employeeName: emp.name,
          date: today,
          time: nowTime,
          status: 'BEKERJA',
        },
        message: `Absen masuk berhasil untuk ${emp.name} pada jam ${nowTime}.`,
      };
    } catch (err) {
      console.error('[AttendanceAPI] checkIn error:', err);
      return { success: false, message: err.message || 'Gagal melakukan absen masuk.' };
    }
  },

  checkOut: async (employeeId) => {
    try {
      if (!employeeId) throw new Error('ID Karyawan wajib dipilih.');

      const today = getTodayDateString();
      const now = new Date();
      const nowIso = now.toISOString();
      const nowTime = format(now, 'HH:mm:ss');

      // Find today's active attendance
      const { data: existing, error: findErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', String(employeeId))
        .or(`attendance_date.eq.${today},date.eq.${today}`)
        .maybeSingle();

      if (findErr || !existing) {
        return {
          success: false,
          message: 'Belum ada data absen masuk hari ini. Silakan absen masuk terlebih dahulu.',
        };
      }

      if (existing.status === 'HADIR' || existing.status === 'SELESAI' || (existing.check_out && existing.check_out !== '-')) {
        return {
          success: false,
          message: `Anda sudah melakukan absen pulang hari ini pada jam ${formatTimeForDisplay(existing.check_out)}.`,
        };
      }

      // Calculate minutes and pay directly from timestamp diff
      const checkInDate = new Date(existing.check_in);
      let diffMinutes = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60));
      if (diffMinutes < 0 || isNaN(diffMinutes)) diffMinutes = 0;

      const hourlyRate = Number(existing.hourly_rate) || 10000;
      const totalHours = Number((diffMinutes / 60).toFixed(2));
      const workPay = Math.round((diffMinutes / 60) * hourlyRate);

      const mealMap = await getMealAllowanceMap();
      const mealAllowance = Number(mealMap[String(existing.employee_id)] ?? 0);
      const totalPay = workPay + mealAllowance;

      const updatePayload = {
        check_out: nowIso,
        total_minutes: diffMinutes,
        total_hours: totalHours,
        meal_allowance: mealAllowance,
        total_pay: totalPay,
        status: 'SELESAI',
        updated_at: nowIso,
      };

      const { error: updErr } = await supabase
        .from('attendance')
        .update(updatePayload)
        .eq('id', existing.id);

      if (updErr) throw updErr;

      return {
        success: true,
        data: {
          id: String(existing.id),
          time: nowTime,
          totalMinutes: diffMinutes,
          totalHours,
          workPay,
          mealAllowance,
          estimatedPay: totalPay,
          status: 'HADIR',
        },
        message: `Absen pulang berhasil pada jam ${nowTime}. Total durasi: ${diffMinutes} menit.`,
      };
    } catch (err) {
      console.error('[AttendanceAPI] checkOut error:', err);
      return { success: false, message: err.message || 'Gagal melakukan absen pulang.' };
    }
  },

  getStatus: async (employeeId) => {
    try {
      if (!employeeId) return { success: true, data: { status: 'BELUM_MASUK' } };

      const today = getTodayDateString();
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', String(employeeId))
        .or(`attendance_date.eq.${today},date.eq.${today}`)
        .order('check_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return { success: true, data: { status: 'BELUM_MASUK' } };
      }

      const normalizedStatus = (data.status === 'SELESAI' || data.status === 'HADIR') ? 'HADIR' : data.status;

      return {
        success: true,
        data: {
          id: String(data.id),
          status: normalizedStatus,
          checkIn: formatTimeForDisplay(data.check_in),
          checkInTime: formatTimeForDisplay(data.check_in),
          checkOut: formatTimeForDisplay(data.check_out),
          checkOutTime: formatTimeForDisplay(data.check_out),
          totalMinutes: Number(data.total_minutes) || 0,
          totalHours: Number(data.total_hours) || 0,
          totalPay: Number(data.total_pay) || 0,
        },
      };
    } catch (err) {
      console.error('[AttendanceAPI] getStatus error:', err);
      return { success: false, message: err.message };
    }
  },

  getToday: async () => {
    const today = getTodayDateString();
    return attendanceAPI.getDaily(today);
  },

  getDaily: async (date) => {
    try {
      const targetDate = date || getTodayDateString();

      // Fetch employees to map employee_code and meal allowance
      const [empsRes, mealMap] = await Promise.all([
        supabase.from('employees').select('id, employee_code'),
        getMealAllowanceMap(),
      ]);

      const empCodeMap = {};
      (empsRes.data || []).forEach((e) => {
        empCodeMap[e.id] = e.employee_code || String(e.id);
      });

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .or(`attendance_date.eq.${targetDate},date.eq.${targetDate}`)
        .order('check_in', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((att) => {
        const mealAllowance = Number(mealMap[String(att.employee_id)] ?? 0);
        return {
          id: String(att.id),
          employeeId: empCodeMap[att.employee_id] || String(att.employee_id),
          employeeCode: empCodeMap[att.employee_id] || String(att.employee_id),
          employeeName: att.employee_name,
          date: att.attendance_date || att.date,
          checkIn: formatTimeForDisplay(att.check_in),
          checkOut: formatTimeForDisplay(att.check_out),
          totalMinutes: Number(att.total_minutes) || 0,
          totalHours: Number(att.total_hours) || 0,
          hourlyRate: Number(att.hourly_rate) || 10000,
          mealAllowance,
          totalPay: Number(att.total_pay) || 0,
          status: att.status,
          source: att.source || 'SISTEM',
          notes: att.notes || '',
        };
      });

      return { success: true, data: formatted };
    } catch (err) {
      console.error('[AttendanceAPI] getDaily error:', err);
      return { success: false, message: err.message || 'Gagal memuat absensi harian.' };
    }
  },

  getMonthly: async (month, year) => {
    try {
      const m = String(month).padStart(2, '0');
      const y = String(year);
      const prefix = `${y}-${m}-`;

      const [empsRes, mealMap] = await Promise.all([
        supabase.from('employees').select('id, employee_code'),
        getMealAllowanceMap(),
      ]);

      const empCodeMap = {};
      (empsRes.data || []).forEach((e) => {
        empCodeMap[e.id] = e.employee_code || String(e.id);
      });

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', `${prefix}01`)
        .lte('date', `${prefix}31`)
        .order('check_in', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((att) => {
        const mealAllowance = Number(mealMap[String(att.employee_id)] ?? 0);
        return {
          id: String(att.id),
          employeeId: empCodeMap[att.employee_id] || String(att.employee_id),
          employeeCode: empCodeMap[att.employee_id] || String(att.employee_id),
          rawEmployeeId: String(att.employee_id),
          employeeName: att.employee_name,
          date: att.attendance_date || att.date,
          checkIn: formatTimeForDisplay(att.check_in),
          checkOut: formatTimeForDisplay(att.check_out),
          totalMinutes: Number(att.total_minutes) || 0,
          totalHours: Number(att.total_hours) || 0,
          hourlyRate: Number(att.hourly_rate) || 10000,
          mealAllowance,
          totalPay: Number(att.total_pay) || 0,
          status: att.status,
          source: att.source || 'SISTEM',
          notes: att.notes || '',
        };
      });

      return { success: true, data: formatted };
    } catch (err) {
      console.error('[AttendanceAPI] getMonthly error:', err);
      return { success: false, message: err.message || 'Gagal memuat absensi bulanan.' };
    }
  },

  edit: async (correctionData) => {
    try {
      const { id, checkIn, checkOut, note } = correctionData;
      if (!id) throw new Error('ID absensi wajib disertakan.');

      const inMinutes = parseTimeToMinutes(checkIn);
      const outMinutes = checkOut && checkOut !== '-' ? parseTimeToMinutes(checkOut) : 0;
      let diffMinutes = outMinutes > 0 ? outMinutes - inMinutes : 0;
      if (diffMinutes < 0) diffMinutes = 0;

      // Fetch row to preserve hourly rate, employee_id, and date
      const { data: current } = await supabase
        .from('attendance')
        .select('*')
        .eq('id', id)
        .single();

      const recordDate = current?.attendance_date || current?.date || getTodayDateString();
      const hourlyRate = current ? Number(current.hourly_rate) || 10000 : 10000;
      const totalHours = Number((diffMinutes / 60).toFixed(2));
      const workPay = Math.round((diffMinutes / 60) * hourlyRate);

      const mealMap = await getMealAllowanceMap();
      const mealAllowance = Number(mealMap[String(current?.employee_id)] ?? 0);
      const status = checkOut && checkOut !== '-' ? 'SELESAI' : 'BEKERJA';
      const totalPay = (diffMinutes > 0 || status === 'SELESAI') ? (workPay + mealAllowance) : workPay;

      const payload = {
        check_in: makeIsoDateTime(recordDate, checkIn),
        check_out: checkOut && checkOut !== '-' ? makeIsoDateTime(recordDate, checkOut) : null,
        total_minutes: diffMinutes,
        total_hours: totalHours,
        meal_allowance: mealAllowance,
        total_pay: totalPay,
        status: status,
        source: 'ADMIN',
        notes: note || 'Koreksi manual admin',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('attendance')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logActivity(
        'EDIT_ABSENSI',
        `Koreksi absensi: In ${checkIn}, Out ${checkOut || '-'} (${note || 'Koreksi admin'})`,
        `ID: ${id}`
      );

      return {
        success: true,
        data,
        message: 'Absensi berhasil dikoreksi.',
      };
    } catch (err) {
      console.error('[AttendanceAPI] edit error:', err);
      return { success: false, message: err.message || 'Gagal mengoreksi data absensi.' };
    }
  },
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  get: async () => {
    try {
      const today = getTodayDateString();

      // 1. Fetch all employees and meal allowances
      const [empRes, mealMap] = await Promise.all([
        supabase.from('employees').select('id, employee_code, name, status, hourly_rate'),
        getMealAllowanceMap(),
      ]);

      const allEmployees = empRes.data || [];
      const empCodeMap = {};
      allEmployees.forEach((e) => {
        empCodeMap[e.id] = e.employee_code || String(e.id);
      });

      const totalEmployeesCount = allEmployees ? allEmployees.length : 0;
      const activeEmployeesCount = allEmployees
        ? allEmployees.filter((e) => e.status === 'AKTIF').length
        : 0;
      const inactiveEmployeesCount = totalEmployeesCount - activeEmployeesCount;

      // 2. Fetch today's attendance
      const { data: todayAtt } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      const todayList = (todayAtt || []).map((att) => ({
        id: String(att.id),
        employeeId: empCodeMap[att.employee_id] || String(att.employee_id),
        employeeCode: empCodeMap[att.employee_id] || String(att.employee_id),
        employeeName: att.employee_name,
        date: att.date,
        checkIn: formatTimeForDisplay(att.check_in),
        checkOut: formatTimeForDisplay(att.check_out),
        totalMinutes: Number(att.total_minutes) || 0,
        totalHours: Number(att.total_hours) || 0,
        hourlyRate: Number(att.hourly_rate) || 10000,
        mealAllowance: Number(mealMap[String(att.employee_id)] ?? 0),
        totalPay: Number(att.total_pay) || 0,
        status: att.status,
        source: att.source || 'SISTEM',
        notes: att.notes || '',
      }));

      // Count states
      const checkedOutCount = todayList.filter((a) => a.status === 'HADIR' || (a.checkOut && a.checkOut !== '-')).length;
      const workingCount = todayList.filter((a) => a.status === 'BEKERJA' && (!a.checkOut || a.checkOut === '-')).length;
      const totalCheckedIn = todayList.length;

      const rate = activeEmployeesCount > 0
        ? Math.round((totalCheckedIn / activeEmployeesCount) * 100)
        : 0;

      // 3. Monthly Summary for current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}-`;

      const { data: monthAtt } = await supabase
        .from('attendance')
        .select('date, total_minutes, total_pay, status')
        .gte('date', `${monthPrefix}01`)
        .lte('date', `${monthPrefix}31`);

      const uniqueDays = new Set((monthAtt || []).map((a) => a.date)).size;
      const sumMinutes = (monthAtt || []).reduce((acc, a) => acc + (Number(a.total_minutes) || 0), 0);
      const sumPay = (monthAtt || []).reduce((acc, a) => acc + (Number(a.total_pay) || 0), 0);

      const hours = Math.floor(sumMinutes / 60);
      const mins = sumMinutes % 60;
      const totalHoursMinutes = `${hours}:${String(mins).padStart(2, '0')}`;

      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];

      const monthlyRecapSummary = {
        month: monthNames[now.getMonth()],
        year: currentYear,
        totalDays: uniqueDays,
        avgAttendance: uniqueDays > 0
          ? `${((monthAtt || []).length / uniqueDays).toFixed(1)} / ${activeEmployeesCount}`
          : `0 / ${activeEmployeesCount}`,
        totalHoursMinutes,
        totalPay: sumPay,
      };

      // 4. Last 5 days chart
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const chartData = [];

      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = format(d, 'yyyy-MM-dd');
        const dayLabel = `${d.getDate()} ${shortMonths[d.getMonth()]}`;

        let hadir = 0;
        let bekerja = 0;

        if (i === 0) {
          hadir = checkedOutCount;
          bekerja = workingCount;
        } else {
          const dayMatches = (monthAtt || []).filter((a) => a.date === dayStr);
          hadir = dayMatches.filter((a) => a.status === 'HADIR').length;
          bekerja = dayMatches.filter((a) => a.status === 'BEKERJA').length;
        }

        chartData.push({
          date: dayLabel,
          hadir,
          bekerja,
          tidakHadir: 0,
        });
      }

      return {
        success: true,
        data: {
          totalEmployees: totalEmployeesCount,
          activeEmployees: activeEmployeesCount,
          inactiveEmployees: inactiveEmployeesCount,
          todayCheckedIn: totalCheckedIn,
          todayWorking: workingCount,
          todayCheckedOut: checkedOutCount,
          presentToday: checkedOutCount,
          currentlyWorking: workingCount,
          attendanceRate: `${rate}%`,
          todayAttendance: todayList,
          monthlyRecapSummary,
          chartData,
        },
      };
    } catch (err) {
      console.error('[DashboardAPI] get error:', err);
      return { success: false, message: err.message || 'Gagal memuat dashboard.' };
    }
  },
};

// ============================================
// RECAP API
// ============================================
export const recapAPI = {
  getDaily: async (date) => {
    return attendanceAPI.getDaily(date);
  },

  getMonthly: async (month, year) => {
    try {
      const m = String(month).padStart(2, '0');
      const y = String(year);
      const prefix = `${y}-${m}-`;

      // Fetch employees, attendance, and meal allowance map concurrently
      const [empRes, attRes, mealMap] = await Promise.all([
        supabase.from('employees').select('id, employee_code, name, hourly_rate, status').order('name'),
        supabase
          .from('attendance')
          .select('*')
          .gte('date', `${prefix}01`)
          .lte('date', `${prefix}31`),
        getMealAllowanceMap(),
      ]);

      const employees = empRes.data || [];
      const records = attRes.data || [];

      // Group by employee
      const recapMap = {};
      employees.forEach((emp) => {
        const code = emp.employee_code || `K${String(emp.id).substring(0, 3)}`;
        const mealAllowance = Number(
          mealMap[String(emp.id)] ??
          mealMap[emp.employee_code] ??
          0
        );

        recapMap[String(emp.id)] = {
          rawId: String(emp.id),
          employeeId: code,
          employeeCode: code,
          employeeName: emp.name,
          daysPresent: 0,
          totalMinutes: 0,
          totalHours: 0,
          hourlyRate: Number(emp.hourly_rate) || 10000,
          mealAllowance: mealAllowance,
          totalMealAllowance: 0,
          totalWorkPay: 0,
          totalPay: 0,
          records: [],
        };
      });

      records.forEach((att) => {
        const empId = String(att.employee_id);
        if (!recapMap[empId]) {
          const fallbackCode = `K${empId.substring(0, 3)}`;
          const mealAllowance = Number(mealMap[empId] ?? 0);
          recapMap[empId] = {
            rawId: empId,
            employeeId: fallbackCode,
            employeeCode: fallbackCode,
            employeeName: att.employee_name || `Karyawan (${fallbackCode})`,
            daysPresent: 0,
            totalMinutes: 0,
            totalHours: 0,
            hourlyRate: Number(att.hourly_rate) || 10000,
            mealAllowance: mealAllowance,
            totalMealAllowance: 0,
            totalWorkPay: 0,
            totalPay: 0,
            records: [],
          };
        }

        recapMap[empId].daysPresent += 1;
        recapMap[empId].totalMinutes += Number(att.total_minutes) || 0;
        recapMap[empId].totalHours += Number(att.total_hours) || 0;
        recapMap[empId].records.push(att);
      });

      const recapList = Object.values(recapMap).map((item) => {
        const totalHours = Number(item.totalHours.toFixed(2));
        const totalWorkPay = Math.round(totalHours * item.hourlyRate);
        const totalMealAllowance = item.daysPresent * item.mealAllowance;
        // Total Upah = Upah Jam Kerja + Total Uang Makan Hadir
        const totalPay = item.daysPresent > 0 ? (totalWorkPay + totalMealAllowance) : 0;

        return {
          ...item,
          totalHours,
          totalWorkPay,
          totalMealAllowance,
          totalPay,
        };
      });

      return { success: true, data: recapList };
    } catch (err) {
      console.error('[RecapAPI] getMonthly error:', err);
      return { success: false, message: err.message || 'Gagal memuat rekap bulanan.' };
    }
  },
};

// ============================================
// SETTINGS API
// ============================================
export const settingsAPI = {
  get: async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('[SettingsAPI] get error:', err);
      return { success: false, message: err.message };
    }
  },

  update: async (key, value) => {
    try {
      if (key === 'all' && typeof value === 'object') {
        const entries = Object.entries(value).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));

        const { error } = await supabase
          .from('settings')
          .upsert(entries, { onConflict: 'key' });

        if (error) throw error;
        logActivity('UPDATE_PENGATURAN', 'Memperbarui semua konfigurasi sistem', 'SISTEM');
        return { success: true, message: 'Pengaturan berhasil diperbarui.' };
      }

      const { error } = await supabase
        .from('settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });

      if (error) throw error;
      logActivity('UPDATE_PENGATURAN', `Memperbarui konfigurasi ${key}`, key);
      return { success: true, message: 'Pengaturan berhasil diperbarui.' };
    } catch (err) {
      console.error('[SettingsAPI] update error:', err);
      return { success: false, message: err.message || 'Gagal menyimpan pengaturan.' };
    }
  },
};

// ============================================
// ACTIVITY LOG API
// ============================================
export const logAPI = {
  get: async (page = 1, limit = 50) => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formatted = (data || []).map((l) => {
        let adminName = l.username;
        if (!adminName || adminName.length > 25 || adminName.includes('-')) {
          adminName = 'admin';
        }

        return {
          id: String(l.id),
          action: l.action,
          detail: l.detail || l.action,
          target: l.target || '-',
          username: adminName,
          timestamp: formatDateTimeForDisplay(l.created_at),
        };
      });

      return { success: true, data: formatted };
    } catch (err) {
      console.error('[LogAPI] get error:', err);
      return { success: false, message: err.message || 'Gagal memuat log aktivitas.' };
    }
  },
};

// ============================================
// EMPLOYEE PORTAL API
// ============================================
export const employeeAuthAPI = {
  login: async (identifier, pin) => {
    try {
      if (!identifier || !pin) {
        return { success: false, message: 'Nama/ID Karyawan dan PIN wajib diisi.' };
      }

      const cleanId = String(identifier).trim();
      const cleanPin = String(pin).trim();

      // Find active employee
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'AKTIF');

      if (error) throw error;

      const emp = (employees || []).find((e) => {
        return (
          String(e.id).toLowerCase() === cleanId.toLowerCase() ||
          String(e.employee_code || '').toLowerCase() === cleanId.toLowerCase() ||
          e.name.toLowerCase() === cleanId.toLowerCase() ||
          e.name.toLowerCase().includes(cleanId.toLowerCase())
        );
      });

      if (!emp) {
        return {
          success: false,
          message: 'Karyawan tidak ditemukan atau status belum aktif. Hubungi Superadmin.',
        };
      }

      // Check PIN (default '1234' if column not yet set)
      const expectedPin = emp.pin || '1234';
      if (cleanPin !== String(expectedPin).trim()) {
        return {
          success: false,
          message: 'PIN yang Anda masukkan salah. (PIN default baru: 1234)',
        };
      }

      const mealMap = await getMealAllowanceMap();
      const mealAllowance = Number(
        mealMap[String(emp.id)] ??
        mealMap[emp.employee_code] ??
        0
      );

      const employeeSession = {
        id: String(emp.id),
        employeeCode: emp.employee_code || `K${String(emp.id).substring(0, 3)}`,
        name: emp.name,
        hourlyRate: Number(emp.hourly_rate) || 10000,
        mealAllowance,
        status: emp.status,
        role: 'KARYAWAN',
      };

      localStorage.setItem('employee_user', JSON.stringify(employeeSession));

      return {
        success: true,
        data: employeeSession,
        message: `Selamat datang, ${emp.name}!`,
      };
    } catch (err) {
      console.error('[EmployeeAuthAPI] login error:', err);
      return { success: false, message: err.message || 'Gagal login karyawan.' };
    }
  },

  getCurrentSession: () => {
    try {
      const stored = localStorage.getItem('employee_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('employee_user');
  },

  getSummary: async (employeeId, month, year) => {
    try {
      const m = String(month).padStart(2, '0');
      const y = String(year);
      const prefix = `${y}-${m}-`;

      const [recordsRes, empRes, mealMap] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', String(employeeId))
          .gte('date', `${prefix}01`)
          .lte('date', `${prefix}31`)
          .order('date', { ascending: false }),
        supabase
          .from('employees')
          .select('hourly_rate')
          .eq('id', employeeId)
          .maybeSingle(),
        getMealAllowanceMap(),
      ]);

      if (recordsRes.error) throw recordsRes.error;

      const list = recordsRes.data || [];
      const mealAllowance = Number(mealMap[String(employeeId)] ?? 0);
      const hourlyRate = Number(empRes.data?.hourly_rate) || 10000;

      const totalMinutes = list.reduce((acc, r) => acc + (Number(r.total_minutes) || 0), 0);
      const totalHours = Number((totalMinutes / 60).toFixed(2));
      const daysPresent = list.filter((r) => r.status === 'HADIR' || r.status === 'BEKERJA' || (r.check_in && r.check_in !== '-')).length;

      const totalWorkPay = Math.round(totalHours * hourlyRate);
      const totalMealAllowance = daysPresent * mealAllowance;
      const totalPay = daysPresent > 0 ? (totalWorkPay + totalMealAllowance) : 0;

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const durationFormatted = `${hours} Jam ${mins} Menit`;

      return {
        success: true,
        data: {
          totalMinutes,
          totalHours,
          durationFormatted,
          hourlyRate,
          mealAllowance,
          totalWorkPay,
          totalMealAllowance,
          totalPay,
          daysPresent,
          records: list.map((r) => {
            const recMins = Number(r.total_minutes) || 0;
            const recHours = Number(r.total_hours) || Number((recMins / 60).toFixed(2));
            const recWorkPay = Math.round(recHours * (Number(r.hourly_rate) || hourlyRate));
            const recPay = recWorkPay + mealAllowance;

            return {
              id: String(r.id),
              date: r.date,
              checkIn: formatTimeForDisplay(r.check_in),
              checkOut: formatTimeForDisplay(r.check_out),
              totalMinutes: recMins,
              totalHours: recHours,
              hourlyRate: Number(r.hourly_rate) || hourlyRate,
              mealAllowance: mealAllowance,
              workPay: recWorkPay,
              totalPay: recPay,
              status: r.status,
              notes: r.notes || '',
            };
          }),
        },
      };
    } catch (err) {
      console.error('[EmployeeAuthAPI] getSummary error:', err);
      return { success: false, message: err.message || 'Gagal memuat rekap karyawan.' };
    }
  },

  changePin: async (employeeId, oldPin, newPin) => {
    try {
      if (!newPin || String(newPin).trim().length < 4) {
        return { success: false, message: 'PIN baru minimal harus 4 karakter.' };
      }

      const { data: emp, error: findErr } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (findErr || !emp) {
        return { success: false, message: 'Karyawan tidak ditemukan.' };
      }

      const currentPin = emp.pin || '1234';
      if (String(oldPin).trim() !== String(currentPin).trim()) {
        return { success: false, message: 'PIN lama yang Anda masukkan salah.' };
      }

      const { error: updErr } = await supabase
        .from('employees')
        .update({ pin: String(newPin).trim(), updated_at: new Date().toISOString() })
        .eq('id', employeeId);

      if (updErr) throw updErr;

      return { success: true, message: 'PIN berhasil diperbarui!' };
    } catch (err) {
      console.error('[EmployeeAuthAPI] changePin error:', err);
      return { success: false, message: err.message || 'Gagal mengubah PIN.' };
    }
  },
};

