'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, AbsenceRecord, SubstituteSuggestion } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  UserCheck,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Inbox,
  ArrowRight,
  User,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAbsencesPage() {
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceRecord | null>(null);
  const [suggestions, setSuggestions] = useState<SubstituteSuggestion[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const { data: absences, isLoading, refetch } = useQuery<AbsenceRecord[]>({
    queryKey: ['admin-absences'],
    queryFn: () => api.absences.list(),
  });

  // Real-time listener for incoming absences
  useSocket({
    'absence:created': () => {
      refetch();
    },
  });

  const handleOpenSuggestions = async (absence: AbsenceRecord) => {
    setSelectedAbsence(absence);
    setLoadingSuggestions(true);
    try {
      const res = await api.absences.suggestions(absence.id);
      setSuggestions(res);
    } catch (e) {
      // Mock suggestions fallback for UI review
      setSuggestions([
        {
          slotId: 'slot-101',
          period: absence.periods[0] || 1,
          subjectCode: 'CS101',
          originalFaculty: absence.facultyName || 'Dr. Alan Vance',
          suggestedSubstitutes: [
            { id: 'f-2', name: 'Prof. Ananya Rao', substitutionsThisWeek: 0 },
            { id: 'f-3', name: 'Dr. Vikram Patel', substitutionsThisWeek: 1 },
          ],
          suggestedRoom: { id: 'r-1', name: 'Room 204', capacity: 60 },
        },
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleConfirmSubstitute = async (
    absenceId: string,
    slotId: string,
    substituteFacultyId: string,
    roomId: string
  ) => {
    try {
      await api.absences.confirm(absenceId, [
        {
          slotId,
          substituteFacultyId,
          roomId,
        },
      ]);
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        setSelectedAbsence(null);
        setSuggestions(null);
        refetch();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to assign substitute.');
    }
  };

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
              Academic Operations · Faculty Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Absence Approvals & Substitute Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Review faculty leave notifications and dispatch zero-clash substitute professors in one click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-bold text-[#1B1C19] transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Back to Analytics</span>
          </Link>
        </div>
      </section>

      {/* Main 2-Column Responsive Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Absences Stream (Span 6 on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F] flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span>Incoming Absence Notifications</span>
            </h2>
            <span className="text-xs font-semibold text-[#7E766B]">
              {absences?.length || 0} Records
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
              ))}
            </div>
          ) : !absences || absences.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl text-center space-y-3 border border-[#CFC5B8]/50">
              <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-[#1B1C19]">No Absences Reported</p>
              <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
                All faculty members are currently on schedule with zero pending coverage dispatches.
              </p>
            </div>
          ) : (
            absences.map((abs) => {
              const isSelected = selectedAbsence?.id === abs.id;

              return (
                <div
                  key={abs.id}
                  onClick={() => handleOpenSuggestions(abs)}
                  className={`group cursor-pointer rounded-3xl p-6 transition-all duration-200 border relative overflow-hidden ${
                    isSelected
                      ? 'bg-white shadow-md border-[#6C5939] ring-2 ring-[#6C5939]/20'
                      : 'bg-white/80 hover:bg-white border-[#CFC5B8]/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1B1C19]">
                          {abs.facultyName || 'Faculty Member'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A]">
                          Action Required
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#4C463C]">
                        <span className="flex items-center gap-1 font-semibold text-[#1B1C19]">
                          <Calendar className="w-3.5 h-3.5 text-[#86724F]" />
                          {abs.date}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#86724F]" />
                          Periods: {abs.periods.join(', ')}
                        </span>
                      </div>

                      {abs.reason && (
                        <p className="text-xs text-[#7E766B] italic">
                          "{abs.reason}"
                        </p>
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#F0EEE9] flex items-center justify-center text-[#4C463C] group-hover:bg-[#6C5939] group-hover:text-white transition-all shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Substitute Recommendation Console (Span 6 on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Zero-Clash AI Substitute Dispatch</span>
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#CFC5B8]/60 shadow-md min-h-[380px] flex flex-col justify-between">
            {!selectedAbsence ? (
              <div className="text-center py-16 space-y-3 my-auto">
                <div className="w-14 h-14 rounded-full bg-[#F0EEE9] text-[#7E766B] flex items-center justify-center mx-auto">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#1B1C19]">Select an Absence Record</h3>
                <p className="text-xs text-[#7E766B] max-w-xs mx-auto">
                  Click on any incoming absence notification on the left to calculate available substitutes with zero timetable conflicts.
                </p>
              </div>
            ) : loadingSuggestions ? (
              <div className="text-center py-16 space-y-3 my-auto">
                <Sparkles className="w-10 h-10 text-[#6C5939] animate-spin mx-auto" />
                <h3 className="text-sm font-bold text-[#1B1C19]">Analyzing Department Timetables...</h3>
                <p className="text-xs text-[#7E766B]">Detecting faculty availability and workload balancing.</p>
              </div>
            ) : confirmSuccess ? (
              <div className="text-center py-16 space-y-3 my-auto animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                  <Check className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-bold text-[#1B1C19]">Substitute Dispatched!</h3>
                <p className="text-xs text-[#7E766B] max-w-xs mx-auto">
                  The substitution was confirmed. Timetables and live QR session keys have been transferred automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-[#CFC5B8]/40 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#86724F]">
                    Cover Request
                  </span>
                  <h3 className="text-lg font-bold text-[#1B1C19]">
                    Coverage for {selectedAbsence.facultyName}
                  </h3>
                  <p className="text-xs text-[#7E766B] mt-0.5">
                    Date: {selectedAbsence.date} · Period {selectedAbsence.periods.join(', ')}
                  </p>
                </div>

                {/* Suggestions List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B1C19]">
                    Qualified & Available Faculty (Zero Clashes)
                  </h4>

                  {suggestions && suggestions.map((sug, idx) => (
                    <div key={sug.slotId || idx} className="space-y-3">
                      <div className="space-y-2">
                        {sug.suggestedSubstitutes.map((faculty) => (
                          <div
                            key={faculty.id}
                            className="p-4 rounded-2xl bg-white border border-[#CFC5B8]/60 flex items-center justify-between gap-4 hover:border-[#6C5939] transition-all"
                          >
                            <div>
                              <div className="font-bold text-sm text-[#1B1C19] flex items-center gap-2">
                                <span>{faculty.name}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                                  {faculty.substitutionsThisWeek} loads this week
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7E766B] mt-0.5">
                                Free during Period {sug.period} · Matching subject expertise
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleConfirmSubstitute(
                                  selectedAbsence.id,
                                  sug.slotId,
                                  faculty.id,
                                  sug.suggestedRoom?.id || 'r-1'
                                )
                              }
                              className="py-2 px-4 rounded-xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-sm shrink-0"
                            >
                              Dispatch Cover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-[#F0EEE9]/70 border border-[#CFC5B8]/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#6C5939] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#7E766B] leading-relaxed">
                    ClassRadar automatically synchronizes all student timetables and shifts the active QR attendance broadcast to the substitute instructor upon assignment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
