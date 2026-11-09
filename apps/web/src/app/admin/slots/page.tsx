'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import { Layers, Plus, Trash2, Edit3, ShieldAlert } from 'lucide-react';

export default function AdminSlotEditorPage() {
  const [sectionId, setSectionId] = useState('CSE-3A');
  const todayStr = '2026-11-09';

  const { data: slots, isLoading, refetch } = useQuery<Slot[]>({
    queryKey: ['admin-slots', sectionId, todayStr],
    queryFn: () => api.timetable.section(sectionId, todayStr),
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Curriculum Master
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Slot Editor</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Direct slot assignment and instant clash-prevention controls.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4C463C]">Section:</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="py-1 px-3 rounded-xl bg-[#FFFFFF] border border-[#CFC5B8] text-xs font-bold text-[#1B1C19]"
            >
              <option value="CSE-3A">CSE-3A</option>
              <option value="CSE-3B">CSE-3B</option>
              <option value="ECE-3A">ECE-3A</option>
            </select>
          </div>
          <button
            onClick={() => alert('New slot creator opens here.')}
            className="py-1.5 px-3 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[#7E766B]">
            No timetable slots allocated for section {sectionId}.
          </div>
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="glass-panel rounded-3xl p-4 border border-[#CFC5B8]/50 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#6C5939]">
                  Period {slot.period} (Day {slot.weekday})
                </span>
                <h4 className="text-sm font-bold text-[#1B1C19]">
                  {slot.subjectCode || 'Course'}
                </h4>
                <p className="text-xs text-[#7E766B]">
                  {slot.facultyName || 'Faculty'} • {slot.roomName || 'Room'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => alert('Edit slot dialog')}
                  className="p-2 rounded-xl text-[#4C463C] hover:bg-black/5 transition"
                  title="Edit Slot"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this timetable slot?')) {
                      api.timetable.deleteSlot(slot.id).then(() => refetch());
                    }
                  }}
                  className="p-2 rounded-xl text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition"
                  title="Delete Slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
