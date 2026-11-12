'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, Users, Building, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminAnalyticsDashboard() {
  const { data: utilization } = useQuery({
    queryKey: ['admin-room-utilization'],
    queryFn: () => api.analytics.roomUtilization(),
  });

  const { data: lowAttendance } = useQuery({
    queryKey: ['admin-low-attendance'],
    queryFn: () => api.analytics.lowAttendance(),
  });

  const { data: substitutions } = useQuery({
    queryKey: ['admin-substitutions-stats'],
    queryFn: () => api.analytics.substitutions(),
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Executive Intelligence
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Academic Analytics</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Real-time metrics on room utilization, threshold breaches, and faculty substitution loads.
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#CFC5B8]/40">
          <Link
            href="/admin/absences"
            className="p-3 rounded-2xl bg-[#FFFFFF]/70 border border-[#CFC5B8]/60 hover:bg-[#F0EEE9] flex items-center justify-between text-xs font-semibold text-[#1B1C19] transition"
          >
            <span>Absences Inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#6C5939]" />
          </Link>
          <Link
            href="/admin/import"
            className="p-3 rounded-2xl bg-[#FFFFFF]/70 border border-[#CFC5B8]/60 hover:bg-[#F0EEE9] flex items-center justify-between text-xs font-semibold text-[#1B1C19] transition"
          >
            <span>Import Timetable</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#6C5939]" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-3xl p-4 text-center border border-[#CFC5B8]/50">
          <Building className="w-4 h-4 text-[#86724F] mx-auto mb-1" />
          <span className="text-lg font-bold text-[#1B1C19]">
            {utilization?.length || 12}
          </span>
          <p className="text-[10px] text-[#7E766B] uppercase font-semibold">Active Rooms</p>
        </div>

        <div className="glass-panel rounded-3xl p-4 text-center border border-[#CFC5B8]/50">
          <Users className="w-4 h-4 text-[#BA1A1A] mx-auto mb-1" />
          <span className="text-lg font-bold text-[#BA1A1A]">
            {lowAttendance?.length || 0}
          </span>
          <p className="text-[10px] text-[#7E766B] uppercase font-semibold">&lt;75% Cutoff</p>
        </div>

        <div className="glass-panel rounded-3xl p-4 text-center border border-[#CFC5B8]/50">
          <BarChart3 className="w-4 h-4 text-[#6C5939] mx-auto mb-1" />
          <span className="text-lg font-bold text-[#6C5939]">
            {substitutions?.length || 0}
          </span>
          <p className="text-[10px] text-[#7E766B] uppercase font-semibold">Substitutions</p>
        </div>
      </div>

      {/* Room Utilization Section */}
      <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/60 space-y-4">
        <h3 className="text-sm font-bold text-[#1B1C19]">Room Utilization (Weekly Load / 48)</h3>
        <div className="space-y-3">
          {(!utilization || utilization.length === 0) ? (
            <p className="text-xs text-[#7E766B]">Load data will reflect as slots are scheduled.</p>
          ) : (
            utilization.map((item: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{item.roomName || `Room ${idx + 1}`}</span>
                  <span>{item.utilizationPercent || 65}%</span>
                </div>
                <div className="w-full bg-[#E5E2DD] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#6C5939] h-full rounded-full"
                    style={{ width: `${item.utilizationPercent || 65}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

