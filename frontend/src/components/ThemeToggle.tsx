'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center h-8 w-16 p-0.5 rounded-full cursor-pointer transition-colors duration-500 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner select-none ${
        isDark
          ? 'bg-[#1e2330] border border-white/15'
          : 'bg-[#4098e7] border border-[#2b7bc4]'
      } ${className}`}
    >
      {/* DAY BACKGROUND: Clouds & Daylight Sky */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isDark ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Soft Background Sun Halo */}
        <div className="absolute left-2 top-1 w-6 h-6 rounded-full bg-yellow-200/40 blur-sm pointer-events-none" />

        {/* Fluffy Cartoon Clouds */}
        <div className="absolute right-1 bottom-0.5 flex items-end opacity-90 transition-transform duration-500 transform translate-x-0">
          {/* Cloud Bubble 1 */}
          <div className="w-4 h-4 rounded-full bg-white shadow-xs -mr-1.5" />
          {/* Cloud Bubble 2 */}
          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
          {/* Cloud Bubble 3 */}
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs -ml-1" />
        </div>
        {/* Distant faint cloud */}
        <div className="absolute right-6 top-1 flex items-end opacity-60">
          <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
          <div className="w-3.5 h-3.5 rounded-full bg-white/90 -ml-1" />
        </div>
      </div>

      {/* NIGHT BACKGROUND: Twinkling Stars */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Star 1 */}
        <span
          className="absolute left-2.5 top-2 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff] transition-transform duration-500"
          style={{ transform: isDark ? 'scale(1)' : 'scale(0)' }}
        />
        {/* Star 2 (Four point sparkle) */}
        <span
          className="absolute left-5 top-4 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_5px_#ffe082] transition-transform duration-500 delay-75"
          style={{ transform: isDark ? 'scale(1)' : 'scale(0)' }}
        />
        {/* Star 3 */}
        <span
          className="absolute left-7 top-1.5 w-1 h-1 rounded-full bg-white/90 transition-transform duration-500 delay-100"
          style={{ transform: isDark ? 'scale(1)' : 'scale(0)' }}
        />
        {/* Star 4 */}
        <span
          className="absolute left-4 bottom-2 w-0.5 h-0.5 rounded-full bg-blue-100 transition-transform duration-500"
          style={{ transform: isDark ? 'scale(1)' : 'scale(0)' }}
        />
      </div>

      {/* THE CELESTIAL ORB (SUN <-> MOON) */}
      <div
        className={`relative z-10 w-7 h-7 rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform flex items-center justify-center overflow-hidden ${
          isDark
            ? 'translate-x-8 bg-[#E6E8EA] shadow-[0_0_8px_rgba(255,255,255,0.4)]'
            : 'translate-x-0 bg-[#FFD43F] shadow-[0_0_10px_rgba(255,212,63,0.8)]'
        }`}
      >
        {/* SUN FACE DETAILS */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isDark ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}
        >
          {/* Subtle Sun highlight ring */}
          <div className="w-5 h-5 rounded-full bg-[#FFE57F] opacity-70" />
        </div>

        {/* MOON CRATERS */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
          }`}
        >
          {/* Crater 1 */}
          <span className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-[#B8BCC2]/80 shadow-inner" />
          {/* Crater 2 */}
          <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#B8BCC2]/80 shadow-inner" />
          {/* Crater 3 */}
          <span className="absolute top-2.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#B8BCC2]/70 shadow-inner" />
        </div>
      </div>
    </button>
  );
}
