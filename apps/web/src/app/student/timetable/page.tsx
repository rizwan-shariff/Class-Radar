'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState(1);
  const todayStr = '2026-11-09';

  const { data: allSlots, isLoading } = useQuery<Slot[]>({
    queryKey: ['student-weekly-timetable', todayStr],
    queryFn: () => api.timetable.me(todayStr),
  });

  const daySlots = allSlots?.filter((s) => s.weekday === selectedDay) || [];

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Weekly Matrix
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Academic Timetable</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Standard Monday to Saturday 8-period institutional schedule.
        </p>

        {/* Day Selector Tabs */}
        <div className="grid grid-cols-6 gap-1.5 mt-5 bg-[#FFFFFF]/60 p-1.5 rounded-2xl border border-[#CFC5B8]/40">
          {WEEKDAYS.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                selectedDay === day.id
                  ? 'bg-[#6C5939] text-white shadow-sm'
                  : 'text-[#4C463C] hover:bg-black/5'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slots for selected day */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : daySlots.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[#7E766B]">
            No lecture periods configured for this day.
          </div>
        ) : (
          daySlots.map((slot) => (
            <div
              key={slot.id}
              className="glass-panel rounded-3xl p-4 border border-[#CFC5B8]/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#E7DFD1] text-[#6C5939] font-bold text-xs flex items-center justify-center shrink-0">
                  P{slot.period}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1B1C19]">
                    {slot.subjectCode || 'Subject'}
                  </h4>
                  <p className="text-xs text-[#4C463C]">{slot.facultyName || 'Faculty'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#CFC5B8]/60 text-[#1B1C19]">
                  {slot.roomName || 'Room'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
