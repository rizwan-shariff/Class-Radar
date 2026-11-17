'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-[#292A2D] border-[#3C4043] text-[#E8EAED] hover:bg-[#35363A] shadow-sm'
          : 'bg-white/80 border-[#CFC5B8]/80 text-[#6C5939] hover:bg-[#F0EEE9] shadow-sm'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Sand theme' : 'Switch to Chromium Greyish Dark theme'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#FDD663] animate-in spin-in-90 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-[#6C5939] animate-in spin-in-90 duration-200" />
      )}
    </button>
  );
}
