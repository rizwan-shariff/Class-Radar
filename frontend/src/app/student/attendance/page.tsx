'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, BunkSummaryItem } from '@/lib/api';
import { AttendanceHeatmap } from '@/components/AttendanceHeatmap';
import {
  AlertTriangle,
  CheckCircle,
  Flame,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

export default function StudentAttendancePage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const { data: summary, isLoading, error } = useQuery<BunkSummaryItem[]>({
    queryKey: ['student-attendance-summary'],
    queryFn: () => api.attendance.summary(),
  });

  const { data: attendanceHistory } = useQuery({
    queryKey: ['student-attendance-history'],
    queryFn: () => api.attendance.studentHistory(),
  });

  const overallAvg = summary && summary.length > 0
    ? Math.round(summary.reduce((acc, c) => acc + c.percent, 0) / summary.length)
    : 84;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-[40rem] h-[25rem] rounded-full bg-[#EAE1D4]/40 blur-[120px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Attendance Intelligence & Recovery Matrix
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Subject Attendance & Bunk Predictor
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Real-time tracking of institutional 75% examination compliance with forward bunk calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-[#F0EEE9] border border-white/80 shadow-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6C5939]" />
            <span className="text-xs font-bold text-[#1B1C19]">
              Overall Standing: {overallAvg}%
            </span>
          </div>
        </div>
      </section>

      {/* Grid of Subject Attendance Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F] flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Enrolled Subject Breakdown</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : error || !summary || summary.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-[#CFC5B8]/50">
            <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1B1C19]">No Attendance Records Logged Yet</h3>
            <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
              Scan your instructor's QR token using the mobile camera view to register attendance and unlock predictive bunk statistics.
            </p>
            <div className="pt-2">
              <Link
                href="/student/scan"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-sm"
              >
                <span>Go to Attendance Scanner</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary.map((item) => {
              const isSafe = item.percent >= 75;
              const isExpanded = selectedSubjectId === item.subjectId;

              return (
                <div
                  key={item.subjectId}
                  className="group rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-sm hover:shadow-md border border-[#CFC5B8]/60 transition-all duration-200 flex flex-col justify-between space-y-5 relative overflow-hidden"
                >
                  <div className={`absolute inset-y-0 left-0 w-1.5 ${isSafe ? 'bg-[#6C5939]' : 'bg-[#BA1A1A]'}`} />

                  <div className="space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[#1B1C19]">
                        {item.subjectCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isSafe
                            ? 'bg-[#E7DFD1] text-[#6C5939]'
                            : 'bg-[#FFDAD6] text-[#93000A]'
                        }`}
                      >
                        {isSafe ? 'Above Target' : 'Below 75%'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1B1C19]">
                        {item.subjectName}
                      </h3>
                      <div className="text-xs text-[#7E766B] mt-1">
                        Attended: <span className="font-bold text-[#1B1C19]">{item.attended}</span> of {item.total} classes
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#7E766B]">Standing</span>
                        <span className={isSafe ? 'text-[#6C5939]' : 'text-[#BA1A1A]'}>
                          {item.percent}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#F0EEE9] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSafe ? 'bg-[#6C5939]' : 'bg-[#BA1A1A]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, item.percent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bunk Forecast Calculation */}
                  <div className="pt-3 border-t border-[#CFC5B8]/40 pl-2 space-y-3">
                    {isSafe ? (
                      <div className="flex items-center gap-2 text-xs text-[#6C5939] font-medium">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>
                          Safe to skip: <strong className="font-bold">{item.canSkip} more</strong> class(es)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#BA1A1A] font-bold">
                        <Flame className="w-4 h-4 shrink-0" />
                        <span>
                          Must attend next <strong className="font-extrabold">{item.mustAttend}</strong> class(es) to recover 75%
                        </span>
                      </div>
                    )}

                    {/* Heatmap Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(isExpanded ? null : item.subjectId)}
                      className="w-full py-2 px-3 rounded-2xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-[#1B1C19] text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-[#6C5939]" />
                        <span>{isExpanded ? 'Hide Activity Heatmap' : 'View Attendance Heatmap'}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* LeetCode / GitHub style Heatmap Box Matrix Hydrated with Real API Records */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-[#CFC5B8]/30 animate-in fade-in duration-200">
                        <AttendanceHeatmap
                          studentName={item.subjectCode}
                          records={(attendanceHistory || [])
                            .filter((r: any) => !r.session?.slot?.subjectId || r.session?.slot?.subjectId === item.subjectId)
                            .map((r: any) => ({
                              date: r.markedAt,
                              status: r.status,
                              period: r.session?.slot?.period,
                              subjectCode: r.session?.slot?.subject?.code || item.subjectCode,
                            }))}
                          totalDays={60}
                          attendedCount={item.attended}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
