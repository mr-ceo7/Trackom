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
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleAuth: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  account_type?: 'business' | 'reseller';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = (access_token: string, refresh_token: string) => {
    localStorage.setItem('trackom_access_token', access_token);
    localStorage.setItem('trackom_refresh_token', refresh_token);
  };

  const clearTokens = () => {
    localStorage.removeItem('trackom_access_token');
    localStorage.removeItem('trackom_refresh_token');
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
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshUser = fetchUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleAuth,
        logout,
        refreshUser,
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
