'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { JitterHeaderButton } from './ui/JitterHeaderButton';
import {
  LogOut,
  Bell,
  Calendar,
  BookOpen,
  QrCode,
  UserCheck,
  Search,
  BarChart3,
  Inbox,
  Layers,
  UploadCloud,
  ChevronRight,
  Shield,
  Sparkles,
  History,
  Users,
  FileCheck2,
  Clock
} from 'lucide-react';

export function TopHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user || pathname === '/login') return null;

  interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
  }

  let desktopNav: NavItem[] = [];

  if (user.role === 'STUDENT') {
    desktopNav = [
      { label: "Today's Schedule", href: '/student', icon: <Calendar className="w-4 h-4" /> },
      { label: 'Weekly Timetable', href: '/student/timetable', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Attendance & Compliance', href: '/student/attendance', icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Deadlines', href: '/student/deadlines', icon: <FileCheck2 className="w-4 h-4" /> },
      { label: 'Community Feed', href: '/student/threads', icon: <Users className="w-4 h-4" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-4 h-4" /> },
    ];
  } else if (user.role === 'FACULTY') {
    desktopNav = [
      { label: "Teaching Schedule", href: '/faculty', icon: <Calendar className="w-4 h-4" /> },
      { label: 'QR Attendance Session', href: '/faculty/session', icon: <QrCode className="w-4 h-4" /> },
      { label: 'Deadlines & Projects', href: '/faculty/deadlines', icon: <FileCheck2 className="w-4 h-4" /> },
      { label: 'Attendance History', href: '/faculty/history', icon: <History className="w-4 h-4" /> },
      { label: 'Free Room Finder', href: '/rooms', icon: <Search className="w-4 h-4" /> },
    ];
  } else if (user.role === 'ADMIN') {
    desktopNav = [
      { label: 'Analytics', href: '/admin', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Absences Inbox', href: '/admin/absences', icon: <Inbox className="w-4 h-4" /> },
      { label: 'Slot Editor', href: '/admin/slots', icon: <Layers className="w-4 h-4" /> },
      { label: 'Import CSV', href: '/admin/import', icon: <UploadCloud className="w-4 h-4" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-4 h-4" /> },
    ];
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#CFC5B8]/60 dark:border-white/10 backdrop-blur-2xl bg-[#FCF9F4]/95 dark:bg-[#1C1D21]/95 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link href={user.role === 'STUDENT' ? '/student' : user.role === 'FACULTY' ? '/faculty' : '/admin'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-[#6C5939]/20 group-hover:scale-105 transition-transform">
              CR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#1B1C19] dark:text-white tracking-tight group-hover:text-[#6C5939] transition-colors">ClassRadar</span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] dark:bg-white/10 text-[#6C5939] dark:text-[#E8EAED]">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#4C463C] dark:text-[#A3AAB5] flex items-center gap-1">
                <span>{user.name}</span>
                <span className="opacity-40">•</span>
                <span className="uppercase text-[10px] text-[#6C5939] dark:text-[#E8EAED] font-bold">{user.role}</span>
                {user.department && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="hidden sm:inline text-[#7E766B] dark:text-white/60 font-medium">{user.department}</span>
                  </>
                )}
              </p>
            </div>
          </Link>
        </div>

        {/* Laptop/Desktop Navigation Bar with Jitter Micro-Interactions */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#F0EEE9] dark:bg-white/10 p-1.5 rounded-full border border-[#CFC5B8]/60 dark:border-white/10 shadow-sm">
          {desktopNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isActive
                    ? 'bg-white dark:bg-[#6C5939] text-[#1B1C19] dark:text-white shadow-sm font-extrabold scale-[1.04]'
                    : 'text-[#3E3A33] dark:text-white/80 hover:text-[#1B1C19] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {/* Jitter Shimmer light sweep on hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full" />
                <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                <span className="relative z-10 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Hub */}
        <div className="flex items-center gap-2">
          {/* Curricular Status Pill for Laptop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0EEE9] dark:bg-white/10 border border-[#CFC5B8]/40 dark:border-white/10 text-xs font-semibold text-[#1B1C19] dark:text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span>Curricular Week 8</span>
          </div>

          {/* Dark / Light Theme Toggle Button */}
          <ThemeToggle />

          <button
            className="relative p-2 rounded-xl text-[#1B1C19] dark:text-white hover:bg-[#F0EEE9] dark:hover:bg-white/10 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6C5939] ring-2 ring-white" />
          </button>

          {/* Sign Out Button with Jitter Micro-Interactions */}
          <JitterHeaderButton
            onClick={logout}
            variant="danger"
            title="Sign Out"
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Sign Out</span>
          </JitterHeaderButton>
        </div>
      </div>
    </header>
  );
}
