'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, tokenValue: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const applyTheme = (darkMode: boolean) => {
  document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('emolearn_token');
    const storedUser = localStorage.getItem('emolearn_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        applyTheme(Boolean(parsedUser.preferences?.darkMode));
      } catch {
        localStorage.removeItem('emolearn_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: User, tokenValue: string) => {
    localStorage.setItem('emolearn_token', tokenValue);
    localStorage.setItem('emolearn_user', JSON.stringify(userData));
    setUser(userData);
    setToken(tokenValue);
    applyTheme(Boolean(userData.preferences?.darkMode));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('emolearn_token');
    localStorage.removeItem('emolearn_user');
    setUser(null);
    setToken(null);
    applyTheme(false);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('emolearn_user', JSON.stringify(updated));
      if (updates.preferences?.darkMode !== undefined) {
        applyTheme(updates.preferences.darkMode);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
