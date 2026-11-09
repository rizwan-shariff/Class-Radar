'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, BunkSummaryItem } from '@/lib/api';
import { AlertTriangle, CheckCircle, Flame, ShieldAlert } from 'lucide-react';

export default function StudentAttendancePage() {
  const { data: summary, isLoading, error } = useQuery<BunkSummaryItem[]>({
    queryKey: ['student-attendance-summary'],
    queryFn: () => api.attendance.summary(),
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Attendance Intelligence
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Bunk Calculator & Stats</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Minimum 75% attendance required. Projections update automatically with each session.
        </p>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : error || !summary || summary.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-[#6C5939] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#1B1C19]">No Attendance Records Yet</h3>
            <p className="text-xs text-[#7E766B]">
              Once you start scanning QR codes in your lecture sessions, your subject statistics and recovery calculations will show here.
            </p>
          </div>
        ) : (
          summary.map((item) => {
            const isSafe = item.percent >= 75;

            return (
              <div
                key={item.subjectId}
                className="glass-panel rounded-3xl p-5 border border-[#CFC5B8]/60 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E766B]">
                      {item.subjectCode}
                    </span>
                    <h3 className="text-base font-bold text-[#1B1C19]">{item.subjectName}</h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-black ${
                        isSafe ? 'text-[#6C5939]' : 'text-[#BA1A1A]'
                      }`}
                    >
                      {item.percent}%
                    </span>
                    <p className="text-[10px] text-[#7E766B]">
                      {item.attended} / {item.total} classes
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E5E2DD] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSafe ? 'bg-[#6C5939]' : 'bg-[#BA1A1A]'
                    }`}
                    style={{ width: `${Math.min(100, item.percent)}%` }}
                  />
                </div>

                {/* Advice Badge */}
                <div
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                    isSafe
                      ? 'bg-[#E7DFD1]/40 text-[#6C5939] border border-[#CFC5B8]/40'
                      : 'bg-[#FFDAD6]/50 text-[#93000A] border border-[#FFDAD6]'
                  }`}
                >
                  {isSafe ? (
                    <>
                      <Flame className="w-4 h-4 shrink-0" />
                      <span>
                        Safe zone: You can safely skip <strong>{item.canSkip}</strong> more {item.canSkip === 1 ? 'class' : 'classes'} and maintain &gt;=75%.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
                      <span>
                        Critical attendance: You must attend the next <strong>{item.mustAttend}</strong> consecutive classes to recover to 75%.
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

