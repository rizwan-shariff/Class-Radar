'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import { Calendar, Clock, MapPin, User, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Toast Notification */}
      {liveToast && (
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-[#6C5939] shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#6C5939]" />
            <p className="text-xs font-semibold text-[#1B1C19]">{liveToast}</p>
          </div>
          <button onClick={() => setLiveToast(null)} className="text-[#7E766B] text-xs">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
              Student Schedule
            </span>
            <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Today's Lectures</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FFFFFF]/80 border border-[#CFC5B8]/80 py-1 px-3 rounded-2xl text-xs font-medium text-[#4C463C]">
            <Calendar className="w-3.5 h-3.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Lectures Timeline List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-panel p-6 rounded-3xl text-center">
            <AlertCircle className="w-8 h-8 text-[#BA1A1A] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1B1C19]">Unable to load schedule</p>
            <p className="text-xs text-[#7E766B] mt-1">{(error as any)?.message || 'Check connection'}</p>
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center">
            <CheckCircle2 className="w-10 h-10 text-[#6C5939] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-[#1B1C19]">No Classes Scheduled</p>
            <p className="text-xs text-[#7E766B] mt-1">You are all clear for this date.</p>
          </div>
        ) : (
          slots.map((slot, index) => {
            const isSub = slot.isSubstituted;
            const isCanc = slot.isCancelled;

            return (
              <div
                key={slot.id || index}
                className={`glass-panel rounded-3xl p-5 border transition-all duration-200 ${
                  isCanc
                    ? 'border-[#FFDAD6] bg-[#FFDAD6]/20 opacity-75'
                    : isSub
                    ? 'border-[#E7DFD1] bg-[#F6F3EE]/80'
                    : 'border-[#CFC5B8]/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#86724F]/10 text-[#6C5939]">
                    Period {slot.period}
                  </span>
                  {isCanc ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A]">
                      Cancelled
                    </span>
                  ) : isSub ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                      Substituted
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#7E766B] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Slot #{slot.period}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#1B1C19]">
                  {slot.subjectCode || 'Course'} — {slot.subjectName || 'Subject Title'}
                </h3>

                <div className="mt-3 pt-3 border-t border-[#CFC5B8]/40 flex items-center justify-between text-xs text-[#4C463C]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#7E766B]" />
                    <span>
                      {isSub && slot.substituteFacultyName
                        ? `${slot.substituteFacultyName} (Substitute)`
                        : slot.facultyName || 'Faculty In-Charge'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7E766B]" />
                    <span className="font-semibold text-[#1B1C19]">
                      {slot.roomName || 'Room 101'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
