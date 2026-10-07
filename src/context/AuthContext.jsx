import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../services/api';
import { USE_MOCK } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper to construct user object
  const buildUserData = async (authUser, sessionToken) => {
    let profileData = null;
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    } catch {
      // Ignore if table or network is not ready
    }

    const username =
      profileData?.username ||
      profileData?.full_name ||
      authUser.email?.split('@')[0] ||
      'Super Admin';

    const role = profileData?.role || 'SUPERADMIN';

    return {
      id: authUser.id,
      email: authUser.email,
      username,
      role,
      token: sessionToken || '',
      profile: profileData,
    };
  };

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (USE_MOCK) {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        if (token && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const userData = await buildUserData(session.user, session.access_token);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('auth_token', session.access_token);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted || USE_MOCK) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await buildUserData(session.user, session.access_token);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    if (USE_MOCK) {
      const result = await authAPI.login(identifier, password);
      if (result.success) {
        const userData = {
          username: result.data.username,
          role: result.data.role,
          token: result.data.token,
        };
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: result.message };
    }

    try {
      let email = identifier.trim();

      // If user typed username instead of email, check admin_profiles table
      if (!email.includes('@')) {
        try {
          const { data: profile, error: profileErr } = await supabase
            .from('admin_profiles')
            .select('email')
            .ilike('username', email)
            .maybeSingle();

          if (profileErr) {
            console.warn('[Auth] Error querying admin_profiles:', profileErr);
          }

          if (profile && profile.email) {
            email = profile.email;
          } else {
            return {
              success: false,
              message: `Username "${email}" tidak ditemukan atau belum dapat diakses. Silakan login menggunakan email.`,
            };
          }
        } catch {
          return {
            success: false,
            message: 'Silakan login menggunakan alamat email yang Anda daftarkan di Supabase.',
          };
        }
      }

      // Supabase Auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email atau password salah. Silakan periksa kembali.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Email belum dikonfirmasi. Pastikan opsi "Auto Confirm User" aktif di Supabase.';
        }
        return { success: false, message: msg };
      }

      if (data?.user) {
        const userData = await buildUserData(data.user, data.session?.access_token);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_token', data.session?.access_token || '');
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, message: 'Gagal mendapatkan data user dari Supabase.' };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan saat menghubungi server Supabase.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!USE_MOCK) {
        await supabase.auth.signOut();
      } else {
        await authAPI.logout();
      }
    } catch (err) {
      console.warn('[Auth] Sign out warning:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value = {
    user,
    admin: user, // compatibility alias
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

