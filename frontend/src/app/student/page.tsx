'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Flame,
  ChevronRight,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const [selectedDate, setSelectedDate] = useState('2026-11-09');
  const queryClient = useQueryClient();
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Listen to realtime changes for student section
  useSocket({
    'timetable:changed': (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['student-timetable'] });
      setLiveToast(`Schedule updated: Slot ${payload?.slotId || ''} (${payload?.change || 'Updated'})`);
      setTimeout(() => setLiveToast(null), 5000);
    },
    'attendance:marked': (payload: any) => {
      setLiveToast(`Attendance marked for ${payload?.subject || 'Class'}!`);
      setTimeout(() => setLiveToast(null), 5000);
    },
  });

  const { data: slots, isLoading, error } = useQuery<Slot[]>({
    queryKey: ['student-timetable', selectedDate],
    queryFn: () => api.timetable.me(selectedDate),
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['student-attendance-summary'],
    queryFn: () => api.attendance.summary(),
  });

  // Calculate high-level attendance metric
  const avgAttendance = attendanceSummary && attendanceSummary.length > 0
    ? Math.round(attendanceSummary.reduce((acc: number, cur: any) => acc + cur.percent, 0) / attendanceSummary.length)
    : 84;

  const lowSubject = attendanceSummary?.find((s: any) => s.percent < 75);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[36rem] h-[36rem] rounded-full bg-[#EAE1D4]/40 blur-[100px] transform -translate-x-1/2" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#F9DFB5]/25 blur-[120px]" />
        <div className="absolute -bottom-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#F0EEE9]/60 blur-[90px]" />
      </div>

      {/* Realtime Toast Notification */}
      {liveToast && (
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-[#6C5939] shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#6C5939]" />
            <p className="text-xs font-semibold text-[#1B1C19]">{liveToast}</p>
          </div>
          <button onClick={() => setLiveToast(null)} className="text-[#7E766B] text-xs font-bold px-2">✕</button>
        </div>
      )}

      {/* Editorial Header Section (Laptop / Desktop Wide) */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
              Undergraduate Engineering · Sem: III, Sec: 'F' (Room 406)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Today's Academic Cadence
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Synchronized with the campus timetable authority and live faculty attendance beacons.
          </p>
        </div>

        {/* Date Selector & Meta Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 border border-[#CFC5B8]/70 py-1.5 px-3.5 rounded-2xl text-xs font-medium text-[#4C463C] shadow-sm">
            <Calendar className="w-4 h-4 text-[#86724F]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-[#1B1C19] cursor-pointer"
            />
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EEE9] border border-white/80 text-xs font-semibold text-[#4C463C]">
            <span className="w-2 h-2 rounded-full bg-[#6C5939]" />
            <span>{slots?.length || 0} Sessions Today</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Responsive Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lectures Timeline (Span 8 on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Teaching Timeline</span>
            </h2>
            <Link
              href="/student/timetable"
              className="text-xs font-semibold text-[#6C5939] hover:underline flex items-center gap-1"
            >
              <span>Full Weekly Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel p-8 rounded-3xl text-center space-y-2 border border-[#FFDAD6]">
              <AlertCircle className="w-10 h-10 text-[#BA1A1A] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1B1C19]">Unable to load schedule</p>
              <p className="text-xs text-[#7E766B]">{(error as any)?.message || 'Check connection'}</p>
            </div>
          ) : !slots || slots.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-3 border border-[#CFC5B8]/50">
              <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-[#1B1C19]">No Classes Scheduled Today</p>
              <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
                You have no scheduled sessions on this date. You can check free study rooms or view weekly timetable below.
              </p>
              <div className="pt-2">
                <Link
                  href="/rooms"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#6C5939] text-white text-xs font-semibold hover:bg-[#554425] transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find an Open Study Room</span>
                </Link>
              </div>
            </div>
          ) : (
            slots.map((slot, index) => {
              const isSub = slot.isSubstituted;
              const isCanc = slot.isCancelled;

              return (
                <article
                  key={slot.id || index}
                  className={`group rounded-3xl p-6 sm:p-7 transition-all duration-300 relative overflow-hidden ${
                    isCanc
                      ? 'bg-[#F6F3EE]/60 backdrop-blur-md opacity-75 ring-1 ring-black/[0.04]'
                      : isSub
                      ? 'bg-white/95 backdrop-blur-2xl shadow-md ring-1 ring-[#8A7653]/40 hover:shadow-lg'
                      : 'bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-md ring-1 ring-black/[0.04]'
                  }`}
                >
                  {/* Active highlight spine */}
                  {!isCanc && (
                    <div className={`absolute inset-y-0 left-0 w-1.5 ${isSub ? 'bg-[#86724F]' : 'bg-[#6C5939]'}`} />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pl-2">
                    {/* Time Rail */}
                    <div className="sm:w-36 flex-shrink-0 flex sm:flex-col items-start justify-between">
                      <span className={`text-xl sm:text-2xl font-bold tracking-tight ${isCanc ? 'line-through text-[#7E766B]' : 'text-[#1B1C19]'}`}>
                        Period {slot.period}
                      </span>
                      <span className="text-xs font-medium text-[#7E766B] mt-0.5">
                        Slot #{slot.period} (50 mins)
                      </span>
                      <span className="mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[#6C5939]">
                        Session {index + 1}
                      </span>
                    </div>

                    {/* Class Details */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[#1B1C19]">
                          {slot.subjectCode || 'Course'}
                        </span>

                        {isCanc ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-[10px] font-bold uppercase tracking-wider">
                            Cancelled
                          </span>
                        ) : isSub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F9DFB5] text-[#554425] text-[10px] font-bold uppercase tracking-wider">
                            Substituted Lecture
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939] text-[10px] font-semibold uppercase">
                            Regular Schedule
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isCanc ? 'text-[#7E766B]' : 'text-[#1B1C19]'}`}>
                        {slot.subjectName || 'Course Subject'}
                      </h3>

                      <div className="flex items-center gap-6 flex-wrap text-xs text-[#4C463C] pt-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-4 h-4 text-[#86724F]" />
                          <span>
                            {isSub && slot.substituteFacultyName ? (
                              <span className="text-[#6C5939] font-bold">
                                {slot.substituteFacultyName} <span className="font-normal text-[#7E766B]">(Substituting)</span>
                              </span>
                            ) : (
                              slot.facultyName || 'Faculty Instructor'
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-semibold text-[#1B1C19]">
                          <MapPin className="w-4 h-4 text-[#86724F]" />
                          <span>{slot.roomName || 'Assigned Room'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0">
                      <Link
                        href="/student/scan"
                        className="px-4 py-2 rounded-full bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                      >
                        <span>Scan & Verify</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Substitution or status footer banner */}
                  {isSub && (
                    <div className="mt-4 pt-3 border-t border-[#CFC5B8]/40 flex items-center gap-2 text-xs text-[#6C5939] font-medium pl-2">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Substitute teacher has been approved by the department. Syllabus topic unchanged.</span>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Right Column: Attendance Overview & Free Rooms Widget (Span 4 on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Attendance Health Gauge Card */}
          <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/60 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
                Institutional Compliance
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939] text-[10px] font-bold uppercase">
                75% Threshold
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] text-white flex flex-col items-center justify-center shadow-md">
                <span className="text-xl font-extrabold leading-none">{avgAttendance}%</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">Average</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1B1C19]">Attendance Standing</h4>
                <p className="text-xs text-[#4C463C]">
                  {avgAttendance >= 75
                    ? 'Safe standing. You satisfy all campus examination criteria.'
                    : 'Attention needed. One or more courses are nearing bunk limit.'}
                </p>
              </div>
            </div>

            {lowSubject && (
              <div className="p-3.5 rounded-2xl bg-[#FFDAD6]/40 border border-[#BA1A1A]/30 flex items-center gap-3">
                <Flame className="w-5 h-5 text-[#BA1A1A] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#BA1A1A]">{lowSubject.subjectCode} at {lowSubject.percent}%</span>
                  <p className="text-[11px] text-[#93000A]">Must attend next {lowSubject.mustAttend || 2} lectures to recover.</p>
                </div>
              </div>
            )}

            <Link
              href="/student/attendance"
              className="w-full py-2.5 rounded-2xl bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-bold text-[#1B1C19] transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-[#6C5939]" />
              <span>Open Bunk Intelligence Calculator</span>
            </Link>
          </div>

          {/* Instant Campus Free Rooms Finder */}
          <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#86724F]" />
                <h3 className="text-sm font-bold text-[#1B1C19]">Campus Room Finder</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-xs text-[#4C463C]">
              Discover currently unoccupied lecture halls and laboratories across North & South academic wings for study or group projects.
            </p>

            <Link
              href="/rooms"
              className="w-full py-2.5 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Explore Live Free Rooms</span>
            </Link>
          </div>

          {/* Quick Academic Reference */}
          <div className="p-5 rounded-2xl bg-[#F0EEE9]/80 border border-[#CFC5B8]/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B1C19]">
              <Layers className="w-4 h-4 text-[#86724F]" />
              <span>Automated Faculty Cover System</span>
            </div>
            <p className="text-[11px] text-[#7E766B] leading-relaxed">
              When faculty mark absences, ClassRadar's AI engine automatically suggests qualified substitutes with zero timetable clashes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
