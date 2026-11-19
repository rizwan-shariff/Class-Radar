'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
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
  Users
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
      { label: 'Community Feed', href: '/student/threads', icon: <Users className="w-4 h-4" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-4 h-4" /> },
    ];
  } else if (user.role === 'FACULTY') {
    desktopNav = [
      { label: "Teaching Schedule", href: '/faculty', icon: <Calendar className="w-4 h-4" /> },
      { label: 'QR Attendance Session', href: '/faculty/session', icon: <QrCode className="w-4 h-4" /> },
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
    <header className="sticky top-0 z-40 w-full glass-panel-subtle border-b border-[#CFC5B8]/40 backdrop-blur-2xl bg-[#FCF9F4]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link href={user.role === 'STUDENT' ? '/student' : user.role === 'FACULTY' ? '/faculty' : '/admin'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-[#6C5939]/20 group-hover:scale-105 transition-transform">
              CR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#1B1C19] tracking-tight group-hover:text-[#6C5939] transition-colors">ClassRadar</span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#7E766B] flex items-center gap-1">
                <span>{user.name}</span>
                <span className="opacity-40">•</span>
                <span className="uppercase text-[10px] text-[#86724F] font-semibold">{user.role}</span>
                {user.department && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="hidden sm:inline text-[#7E766B]">{user.department}</span>
                  </>
                )}
              </p>
            </div>
          </Link>
        </div>

        {/* Laptop/Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F0EEE9]/70 p-1.5 rounded-full border border-[#CFC5B8]/40 shadow-inner">
          {desktopNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#6C5939] shadow-sm font-bold scale-[1.02]'
                    : 'text-[#4C463C] hover:text-[#1B1C19] hover:bg-white/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Hub */}
        <div className="flex items-center gap-2">
          {/* Curricular Status Pill for Laptop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0EEE9] border border-white/80 text-xs font-medium text-[#4C463C]">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span>Curricular Week 8</span>
          </div>

          {/* Dark / Light Theme Toggle Button */}
          <ThemeToggle />

          <button
            className="relative p-2 rounded-xl text-[#4C463C] hover:bg-[#F0EEE9] transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6C5939] ring-2 ring-white" />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-[#BA1A1A] hover:bg-[#FFDAD6]/50 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
