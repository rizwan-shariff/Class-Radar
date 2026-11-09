'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, User } from '@/lib/api';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      const userProfile = await api.auth.me();
      login(res.token, userProfile);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = async (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    let emailChoice = 'student1@classradar.edu';
    if (role === 'STUDENT') {
      emailChoice = 'student1@classradar.edu';
    } else if (role === 'FACULTY') {
      emailChoice = 'faculty1@classradar.edu';
    } else if (role === 'ADMIN') {
      emailChoice = 'admin@classradar.edu';
    }
    setEmail(emailChoice);
    setPassword('classradar123');

    // Quick direct sign-in for seamless UX
    setLoading(true);
    try {
      const res = await api.auth.login({ email: emailChoice, password: 'classradar123' });
      const userProfile = await api.auth.me();
      login(res.token, userProfile);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      {/* Background Soft Blobs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#E7DFD1]/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#E5E2DD]/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-xl relative border border-[#CFC5B8]/60">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] text-white shadow-md shadow-[#6C5939]/20 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B1C19] tracking-tight">ClassRadar</h2>
          <p className="text-sm text-[#4C463C] mt-1">
            Academic Schedule & Real-Time Attendance Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] text-xs font-medium flex items-center gap-2">
            <span className="shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4C463C] mb-1.5 ml-1">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7E766B] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="id@institution.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF]/80 border border-[#CFC5B8]/80 text-[#1B1C19] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4C463C] mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7E766B] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF]/80 border border-[#CFC5B8]/80 text-[#1B1C19] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#6C5939] to-[#86724F] hover:from-[#554425] hover:to-[#6C5939] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-[#6C5939]/20 transition-all duration-200 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#CFC5B8]/50">
          <p className="text-[11px] font-semibold text-[#7E766B] uppercase tracking-wider text-center mb-3">
            Quick Fill Demo Persona
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('STUDENT')}
              className="py-2 px-2 text-xs font-medium rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-[#1B1C19] transition text-center"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('FACULTY')}
              className="py-2 px-2 text-xs font-medium rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-[#1B1C19] transition text-center"
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('ADMIN')}
              className="py-2 px-2 text-xs font-medium rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-[#1B1C19] transition text-center"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

