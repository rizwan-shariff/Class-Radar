'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { Calendar, Clock, MapPin, QrCode, AlertOctagon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FacultyDashboardPage() {
  const [selectedDate, setSelectedDate] = useState('2026-11-09');
  const [markAbsentOpen, setMarkAbsentOpen] = useState(false);
  const [absentPeriods, setAbsentPeriods] = useState<number[]>([]);
  const [absentReason, setAbsentReason] = useState('');
  const [absentSuccess, setAbsentSuccess] = useState(false);

  const { data: slots, isLoading, refetch } = useQuery<Slot[]>({
    queryKey: ['faculty-schedule', selectedDate],
    queryFn: () => api.timetable.me(selectedDate),
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
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
              Faculty Hub
            </span>
            <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Teaching Schedule</h2>
          </div>
          <button
            onClick={() => setMarkAbsentOpen(true)}
            className="py-1.5 px-3 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] hover:bg-[#ffcdc7] text-xs font-bold flex items-center gap-1.5 transition"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Mark Absent</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FFFFFF]/80 border border-[#CFC5B8]/80 py-1.5 px-3 rounded-2xl text-xs font-medium text-[#4C463C] w-fit">
          <Calendar className="w-3.5 h-3.5" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Teaching Slots */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center text-xs text-[#7E766B]">
            No teaching slots scheduled for this date.
          </div>
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="glass-panel rounded-3xl p-5 border border-[#CFC5B8]/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#86724F]/10 text-[#6C5939]">
                  Period {slot.period}
                </span>
                <span className="text-xs font-medium text-[#7E766B] flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {slot.roomName || 'Classroom'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1B1C19]">
                  {slot.subjectCode || 'Course'} — {slot.subjectName || 'Subject Title'}
                </h3>
              </div>

              <div className="pt-2 border-t border-[#CFC5B8]/40 flex items-center justify-between">
                <span className="text-xs text-[#7E766B]">
                  Section: <strong className="text-[#1B1C19]">{slot.sectionId || 'A'}</strong>
                </span>
                <Link
                  href={`/faculty/session?slotId=${slot.id}`}
                  className="py-1.5 px-3 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Launch QR Session</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mark Me Absent Drawer */}
      {markAbsentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel bg-[#FCF9F4] rounded-3xl p-6 shadow-2xl border border-[#CFC5B8] animate-in slide-in-from-bottom-6 duration-200">
            {absentSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#6C5939] mx-auto" />
                <h3 className="text-base font-bold text-[#1B1C19]">Absence Reported</h3>
                <p className="text-xs text-[#7E766B]">
                  The administration was notified and substitute suggestions have been compiled.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAbsence} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#BA1A1A] uppercase tracking-wider">
                    Staff Leave Request
                  </span>
                  <h3 className="text-base font-bold text-[#1B1C19] mt-0.5">
                    Mark Absence on {selectedDate}
                  </h3>
                  <p className="text-xs text-[#7E766B] mt-1">
                    Select the periods you will be unavailable.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-2">
                    Periods to Skip
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                      const isSelected = absentPeriods.includes(period);
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handleTogglePeriod(period)}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            isSelected
                              ? 'bg-[#BA1A1A] text-white border-[#BA1A1A]'
                              : 'bg-[#FFFFFF] text-[#4C463C] border-[#CFC5B8]'
                          }`}
                        >
                          P{period}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={absentReason}
                    onChange={(e) => setAbsentReason(e.target.value)}
                    placeholder="e.g. Medical leave, University conference"
                    className="w-full py-2.5 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8] text-xs text-[#1B1C19] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMarkAbsentOpen(false)}
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#F0EEE9] text-[#4C463C] text-xs font-semibold hover:bg-[#E5E2DD]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={absentPeriods.length === 0}
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#BA1A1A] hover:bg-[#93000a] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Confirm Absence
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
