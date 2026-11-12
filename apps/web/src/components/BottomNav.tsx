'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, UserCheck, Search, QrCode, BookOpen, Layers, BarChart3, Inbox } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
  }

  let items: NavItem[] = [];

  if (user.role === 'STUDENT') {
    items = [
      { label: "Today", href: '/student', icon: <Calendar className="w-5 h-5" /> },
      { label: 'Weekly', href: '/student/timetable', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Scan', href: '/student/scan', icon: <QrCode className="w-5 h-5" /> },
      { label: 'Attendance', href: '/student/attendance', icon: <UserCheck className="w-5 h-5" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-5 h-5" /> },
    ];
  } else if (user.role === 'FACULTY') {
    items = [
      { label: 'Schedule', href: '/faculty', icon: <Calendar className="w-5 h-5" /> },
      { label: 'QR Session', href: '/faculty/session', icon: <QrCode className="w-5 h-5" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-5 h-5" /> },
    ];
  } else if (user.role === 'ADMIN') {
    items = [
      { label: 'Analytics', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
      { label: 'Absences', href: '/admin/absences', icon: <Inbox className="w-5 h-5" /> },
      { label: 'Slots', href: '/admin/slots', icon: <Layers className="w-5 h-5" /> },
      { label: 'Import', href: '/admin/import', icon: <Calendar className="w-5 h-5" /> },
      { label: 'Free Rooms', href: '/rooms', icon: <Search className="w-5 h-5" /> },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-4 px-4">
      <div className="pointer-events-auto flex items-center justify-around gap-1 max-w-md w-full glass-bottom-nav rounded-3xl py-2 px-3 transition-all duration-200">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-[#6C5939] font-semibold bg-[#86724F]/10 scale-105'
                  : 'text-[#4C463C] hover:text-[#1B1C19] hover:bg-black/5'
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

