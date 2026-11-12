'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Bell } from 'lucide-react';

export function TopHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel-subtle border-b border-[#CFC5B8]/40 px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] flex items-center justify-center text-white font-bold text-sm shadow-sm">
          CR
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#1B1C19] leading-tight">ClassRadar</h1>
          <span className="text-[10px] font-medium text-[#7E766B] uppercase tracking-wider">
            {user.role} {user.department ? `• ${user.department}` : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-xl text-[#4C463C] hover:bg-[#F0EEE9] transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}

