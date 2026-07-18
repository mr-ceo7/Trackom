/**
 * Auth context - provides authentication state and actions across the app.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  company: string | null;
  avatar_url: string | null;
  account_type: 'business' | 'reseller';
  plan: 'starter' | 'growth' | 'enterprise';
  sms_balance: number;
  credit_rate: number;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  webhook_url: string | null;
  is_2fa_enabled: boolean;
  two_factor_method: 'totp' | 'sms' | 'email';
  sandbox_mode: boolean;
  created_at: string;
  branding?: { logo_url?: string; brand_name?: string } | null;
  custom_brand_name?: string | null;
  custom_logo_url?: string | null;
  custom_primary_color?: string | null;
  notification_preferences?: Record<string, boolean>;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ require_2fa?: boolean; temp_token?: string; method?: 'totp' | 'sms' | 'email' } | void>;
  login2Fa: (tempToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleAuth: (credential: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  toggleSandboxMode: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  account_type?: 'business' | 'reseller';
  parent_id?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = (access_token: string, refresh_token: string) => {
    localStorage.setItem('trackom_access_token', access_token);
    localStorage.setItem('trackom_refresh_token', refresh_token);
    
    // Set domain-wide cookie to share login session state with landing page
    const domain = window.location.hostname.includes('trackomgroup.com') ? '.trackomgroup.com' : '';
    document.cookie = `trackom_session=active; path=/; domain=${domain}; max-age=31536000; SameSite=Lax; Secure`;
  };

  const clearTokens = () => {
    localStorage.removeItem('trackom_access_token');
    localStorage.removeItem('trackom_refresh_token');
    
    // Clear domain-wide session cookie
    const domain = window.location.hostname.includes('trackomgroup.com') ? '.trackomgroup.com' : '';
    document.cookie = `trackom_session=; path=/; domain=${domain}; max-age=0; SameSite=Lax; Secure`;
  };

  const fetchUser = useCallback(async () => {
    try {
      const resp = await api.get('/users/me');
      setUser(resp.data);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  // On mount, check for existing session
  useEffect(() => {
    const token = localStorage.getItem('trackom_access_token');
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const resp = await api.post('/auth/login', { email, password });
    if (resp.data.require_2fa) {
      return resp.data;
    }
    saveTokens(resp.data.access_token, resp.data.refresh_token);
    await fetchUser();
    return resp.data;
  };

  const login2Fa = async (tempToken: string, code: string) => {
    const resp = await api.post('/auth/login/2fa', { temp_token: tempToken, code });
    saveTokens(resp.data.access_token, resp.data.refresh_token);
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    const resp = await api.post('/auth/register', {
      ...data,
      account_type: data.account_type || 'business',
    });
    saveTokens(resp.data.access_token, resp.data.refresh_token);
    await fetchUser();
  };

  const googleAuth = async (credential: string) => {
    const resp = await api.post('/auth/google', { credential });
    saveTokens(resp.data.access_token, resp.data.refresh_token);
    await fetchUser();
    return resp.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to invalidate session on backend:', err);
    } finally {
      clearTokens();
      setUser(null);
    }
  };


  const refreshUser = fetchUser;

  const toggleSandboxMode = useCallback(async () => {
    if (!user) return;
    const newMode = !user.sandbox_mode;
    const resp = await api.put('/auth/sandbox-mode', { sandbox_mode: newMode });
    setUser(resp.data);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        login2Fa,
        register,
        googleAuth,
        logout,
        refreshUser,
        toggleSandboxMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
