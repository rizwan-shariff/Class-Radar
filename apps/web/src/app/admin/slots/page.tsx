'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Slot } from '@/lib/api';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  ShieldAlert,
  Calendar,
  Building,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSlotEditorPage() {
  const [sectionId, setSectionId] = useState('CSE-3A');
  const todayStr = '2026-11-09';

  const { data: slots, isLoading, refetch } = useQuery<Slot[]>({
    queryKey: ['admin-slots', sectionId, todayStr],
    queryFn: () => api.timetable.section(sectionId, todayStr),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[40rem] h-[25rem] rounded-full bg-[#EAE1D4]/40 blur-[120px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Curriculum Master & Collision Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Section Slot Matrix Editor
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Direct slot assignments, faculty allocations, and real-time clash prevention controls.
          </p>
        </div>

        {/* Section Selector & Add Slot */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 border border-[#CFC5B8]/70 py-1.5 px-3.5 rounded-2xl text-xs font-medium text-[#4C463C] shadow-sm">
            <span className="font-bold text-[#1B1C19]">Active Section:</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-bold text-[#6C5939] cursor-pointer"
            >
              <option value="CSE-3A">CSE-3A</option>
              <option value="CSE-3B">CSE-3B</option>
              <option value="ECE-3A">ECE-3A</option>
            </select>
          </div>

          <button
            onClick={() => alert('New slot creator opens here.')}
            className="py-2 px-4 rounded-full bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Timetable Slot</span>
          </button>
        </div>
      </section>

      {/* Slot Matrix List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#86724F]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F]">
              Current Slots for {sectionId}
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#7E766B]">
            {slots?.length || 0} Slots Configured
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-[#CFC5B8]/50">
            <Layers className="w-10 h-10 text-[#6C5939] mx-auto opacity-70" />
            <h3 className="text-base font-bold text-[#1B1C19]">No Slots Defined for {sectionId}</h3>
            <p className="text-xs text-[#7E766B]">
              Add slots manually or use the CSV bulk importer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="group rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-sm hover:shadow-md border border-[#CFC5B8]/60 transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6C5939]" />

                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                      Period {slot.period}
                    </span>
                    <span className="text-xs font-bold text-[#86724F]">
                      {slot.subjectCode}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1B1C19]">
                    {slot.subjectName || 'Subject Title'}
                  </h3>

                  <div className="space-y-1 text-xs text-[#4C463C] pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#86724F]" />
                      <span>{slot.facultyName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#86724F]" />
                      <span className="font-semibold text-[#1B1C19]">{slot.roomName || 'Room Unset'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#CFC5B8]/40 flex items-center justify-end gap-2 pl-2">
                  <button
                    onClick={() => alert(`Edit slot ${slot.id}`)}
                    className="p-2 rounded-xl text-[#4C463C] hover:bg-[#F0EEE9] transition"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert(`Delete slot ${slot.id}`)}
                    className="p-2 rounded-xl text-[#BA1A1A] hover:bg-[#FFDAD6]/50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
