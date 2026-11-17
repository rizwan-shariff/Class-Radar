'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { AttendanceHeatmap } from '@/components/AttendanceHeatmap';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertOctagon,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  X,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function FacultyDashboardPage() {
  const [selectedDate, setSelectedDate] = useState('2026-11-09');
  const [markAbsentOpen, setMarkAbsentOpen] = useState(false);
  const [absentPeriods, setAbsentPeriods] = useState<number[]>([]);
  const [absentReason, setAbsentReason] = useState('');
  const [absentSuccess, setAbsentSuccess] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const { data: slots, isLoading, refetch } = useQuery<Slot[]>({
    queryKey: ['faculty-schedule', selectedDate],
    queryFn: () => api.timetable.me(selectedDate),
  });

  const { data: studentMatrix, isLoading: isMatrixLoading } = useQuery({
    queryKey: ['faculty-student-matrix'],
    queryFn: () => api.attendance.facultyMatrix(),
  });

  const handleTogglePeriod = (period: number) => {
    if (absentPeriods.includes(period)) {
      setAbsentPeriods(absentPeriods.filter((p) => p !== period));
    } else {
      setAbsentPeriods([...absentPeriods, period]);
    }
  };

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (absentPeriods.length === 0) return;

    try {
      await api.absences.create({
        date: selectedDate,
        periods: absentPeriods,
        reason: absentReason || 'Leave',
      });
      setAbsentSuccess(true);
      setTimeout(() => {
        setAbsentSuccess(false);
        setMarkAbsentOpen(false);
        setAbsentPeriods([]);
        setAbsentReason('');
        refetch();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit absence.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[580px] h-[340px] rounded-full bg-[#F9DFB5]/25 blur-[110px]" />
        <div className="absolute -top-20 right-10 w-[420px] h-[280px] rounded-full bg-[#EAE1D4]/40 blur-[90px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Faculty Central Operations · Autumn Term
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Teaching Cadence & Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Science & Engineering Complex / Department of Computer Science & Engineering
          </p>
        </div>

        {/* Right Metric Pills & Controls */}
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

          <div className="px-4 py-2 rounded-full bg-[#F0EEE9] border border-white/80 shadow-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6C5939]" />
            <span className="text-xs font-bold text-[#1B1C19]">
              {slots?.length || 0} Teaching Sessions
            </span>
          </div>

          <button
            onClick={() => setMarkAbsentOpen(true)}
            className="py-2 px-4 rounded-full bg-[#FFDAD6] text-[#BA1A1A] hover:bg-[#ffcdc7] text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Mark Me Absent</span>
          </button>
        </div>
      </section>

      {/* Quick Faculty Action Cards: Asymmetric Liquid Glass Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Mark Me Absent Quick Card */}
        <div
          onClick={() => setMarkAbsentOpen(true)}
          className="group cursor-pointer rounded-3xl bg-white/80 hover:bg-white/95 backdrop-blur-xl p-6 shadow-sm hover:shadow-md border border-[#CFC5B8]/50 transition-all duration-300 relative overflow-hidden flex items-center justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDAD6]/70 text-[#BA1A1A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1B1C19]">Report Absence</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A]">
                  Auto-Substitute
                </span>
              </div>
              <p className="text-xs text-[#4C463C] max-w-sm">
                Report sudden unavailability and instantly trigger zero-clash substitute allocation for your students.
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[#4C463C] group-hover:bg-[#6C5939] group-hover:text-white transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Find Free Room Quick Card */}
        <Link
          href="/rooms"
          className="group cursor-pointer rounded-3xl bg-white/80 hover:bg-white/95 backdrop-blur-xl p-6 shadow-sm hover:shadow-md border border-[#CFC5B8]/50 transition-all duration-300 relative overflow-hidden flex items-center justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1B1C19]">Find Free Room</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                  Instant Radar
                </span>
              </div>
              <p className="text-xs text-[#4C463C] max-w-sm">
                Locate unallocated seminar auditoriums, lecture rooms, and labs for unscheduled reviews or lab setups.
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[#4C463C] group-hover:bg-[#6C5939] group-hover:text-white transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </section>

      {/* Teaching Cadence List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#86724F]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F]">
              Today's Teaching Schedule
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#7E766B]">
            Automated Attendance Beacons Synchronized
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl text-center space-y-3 border border-[#CFC5B8]/50">
            <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-[#1B1C19]">No Lectures Scheduled Today</p>
            <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
              You have no active teaching slots assigned for this date.
            </p>
          </div>
        ) : (
          slots.map((slot, index) => {
            const isSub = slot.isSubstituted;
            const isCanc = slot.isCancelled;

            return (
              <article
                key={slot.id || index}
                className="group rounded-3xl bg-white/90 backdrop-blur-xl p-6 sm:p-7 shadow-sm hover:shadow-md border border-[#CFC5B8]/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6C5939]" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-2">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    {/* Time Rail */}
                    <div className="sm:w-36 flex-shrink-0 flex sm:flex-col items-start justify-between">
                      <span className="text-xl sm:text-2xl font-bold text-[#1B1C19] tracking-tight">
                        Period {slot.period}
                      </span>
                      <span className="text-xs font-medium text-[#7E766B] mt-0.5">
                        Slot #{slot.period} (50 mins)
                      </span>
                      <span className="mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[#6C5939]">
                        Section A
                      </span>
                    </div>

                    {/* Class Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[#1B1C19]">
                          {slot.subjectCode || 'Course'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939] text-[10px] font-bold uppercase">
                          {isSub ? 'Assigned to Substitute' : 'Instructor In-Charge'}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#1B1C19] tracking-tight">
                        {slot.subjectName || 'Subject Title'}
                      </h3>

                      <div className="flex items-center gap-5 flex-wrap text-xs text-[#4C463C] pt-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1B1C19]">
                          <MapPin className="w-4 h-4 text-[#86724F]" />
                          <span>{slot.roomName || 'Assigned Room'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-[#7E766B]">
                          <Users className="w-4 h-4 text-[#86724F]" />
                          <span>Enrolled: 60 Students</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Launch QR Attendance Session */}
                  <div className="flex items-center gap-3 pt-2 lg:pt-0">
                    <Link
                      href={`/faculty/session?slotId=${slot.id || 'slot-1'}`}
                      className="px-5 py-2.5 rounded-full bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Allow & Launch QR Screen</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Student Attendance Matrix & Activity Heatmap Section */}
      <section className="space-y-4 pt-4 border-t border-[#CFC5B8]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#86724F]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F]">
              Enrolled Class Attendance & Heatmap Analytics (Sem: III, Sec: 'F')
            </h2>
          </div>
          <span className="text-xs text-[#7E766B]">
            LeetCode & GitHub Style Activity Presence
          </span>
        </div>

        {isMatrixLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : !studentMatrix || studentMatrix.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center border border-[#CFC5B8]/50 text-xs text-[#7E766B]">
            No enrolled students found in this section.
          </div>
        ) : (
          <div className="space-y-3">
            {studentMatrix.map((st: any) => {
              const isExpanded = expandedStudentId === st.studentId;
              const isSafe = st.percentage >= 75;

              return (
                <div
                  key={st.studentId}
                  className="rounded-3xl bg-white/95 backdrop-blur-xl border border-[#CFC5B8]/60 p-5 shadow-sm transition-all duration-200 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center font-bold text-sm shrink-0">
                        {st.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1B1C19]">{st.studentName}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSafe ? 'bg-[#E7DFD1] text-[#6C5939]' : 'bg-[#FFDAD6] text-[#93000A]'
                            }`}
                          >
                            {st.percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-[#7E766B]">{st.studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-[#1B1C19]">{st.attended} / {st.total}</span>
                        <span className="block text-[10px] text-[#7E766B]">Sessions Attended</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedStudentId(isExpanded ? null : st.studentId)}
                        className="py-1.5 px-3.5 rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-xs font-bold text-[#1B1C19] flex items-center gap-1.5 transition"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-[#6C5939]" />
                        <span>{isExpanded ? 'Hide Heatmap' : 'Inspect Heatmap'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* LeetCode / GitHub Style Box Heatmap for Individual Student */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#CFC5B8]/40 animate-in fade-in duration-200">
                      <div className="mb-2 text-xs font-semibold text-[#4C463C]">
                        60-Day Progress & Lecture Regularity Matrix:
                      </div>
                      <AttendanceHeatmap
                        studentName={st.studentName}
                        totalDays={60}
                        attendedCount={st.attended * 2}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Liquid Glass Modal: Mark Me Absent */}
      {markAbsentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FCF9F4] border border-[#CFC5B8]/80 p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#86724F] uppercase tracking-wider">
                  Faculty Absence Dispatch
                </span>
                <h3 className="text-lg font-bold text-[#1B1C19] mt-0.5">
                  Report Unavailability
                </h3>
              </div>
              <button
                onClick={() => setMarkAbsentOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[#4C463C] hover:bg-[#E5E2DD] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {absentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#1B1C19]">Absence Submitted</h4>
                <p className="text-xs text-[#7E766B]">
                  Your request has been recorded. Substitutes have been dispatched for the selected periods.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAbsence} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-1">
                    Select Periods to Relieve:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                      <button
                        type="button"
                        key={period}
                        onClick={() => handleTogglePeriod(period)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          absentPeriods.includes(period)
                            ? 'bg-[#6C5939] text-white border-[#6C5939]'
                            : 'bg-white text-[#4C463C] border-[#CFC5B8]/70 hover:bg-[#F0EEE9]'
                        }`}
                      >
                        Period {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-1">
                    Reason (Optional note for Dean / HOD):
                  </label>
                  <input
                    type="text"
                    value={absentReason}
                    onChange={(e) => setAbsentReason(e.target.value)}
                    placeholder="e.g. Academic Symposium, sudden sickness..."
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#CFC5B8] text-xs text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMarkAbsentOpen(false)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-[#4C463C] hover:bg-[#F0EEE9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={absentPeriods.length === 0}
                    className="py-2 px-5 rounded-xl bg-[#BA1A1A] hover:bg-[#93000a] text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    Submit Absence & Request Coverage
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
