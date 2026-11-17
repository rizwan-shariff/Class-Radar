'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, api, getToken, clearToken, setToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.auth.me();
        setUser(profile);
      } catch (err) {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = (token: string, userObj: User) => {
    setToken(token);
    setUser(userObj);
    if (userObj.role === 'STUDENT') {
      router.push('/student');
    } else if (userObj.role === 'FACULTY') {
      router.push('/faculty');
    } else if (userObj.role === 'ADMIN') {
      router.push('/admin');
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

