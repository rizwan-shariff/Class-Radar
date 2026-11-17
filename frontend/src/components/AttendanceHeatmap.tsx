'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface AttendanceHeatmapProps {
  studentName?: string;
  totalDays?: number;
  attendedCount?: number;
  highlightDays?: number[]; // e.g. indices that are present
}

export function AttendanceHeatmap({
  studentName,
  totalDays = 60,
  attendedCount = 48,
  highlightDays,
}: AttendanceHeatmapProps) {
  const [hoveredBox, setHoveredBox] = useState<{
    dayIndex: number;
    date: string;
    fullDate: string;
    isPresent: boolean;
    weekday: string;
    periodSlot: string;
    timeRange: string;
    x: number;
    y: number;
  } | null>(null);

  // Period timeslot schedules matching official college timetable
  const PERIOD_SLOTS = [
    { period: 1, range: '09:00 - 10:00 AM' },
    { period: 2, range: '10:00 - 11:00 AM' },
    { period: 3, range: '11:30 - 12:30 PM' },
    { period: 4, range: '12:30 - 01:30 PM' },
    { period: 5, range: '02:30 - 03:30 PM' },
    { period: 6, range: '03:30 - 04:30 PM' },
    { period: 7, range: '04:30 - 05:00 PM' },
  ];

  // Generate simulated 60-day calendar boxes
  const boxes = React.useMemo(() => {
    const list = [];
    const seed = (studentName || 'seed').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    for (let i = 0; i < totalDays; i++) {
      let isPresent = false;
      if (highlightDays && highlightDays.length > 0) {
        isPresent = highlightDays.includes(i);
      } else {
        const val = ((seed * (i + 13) * 31) % 100);
        const isClassDay = (i % 7) !== 0 && (i % 7) !== 6;
        isPresent = isClassDay && (val < (attendedCount / totalDays) * 115);
      }
      
      const date = new Date(2026, 8, 1); // Start Sept 1, 2026
      date.setDate(date.getDate() + i);

      // Map a consistent period slot
      const slotIndex = ((seed + i) % PERIOD_SLOTS.length);
      const slot = PERIOD_SLOTS[slotIndex]!;

      list.push({
        dayIndex: i,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
        periodSlot: `Period ${slot.period}`,
        timeRange: slot.range,
        isPresent,
      });
    }
    return list;
  }, [studentName, totalDays, attendedCount, highlightDays]);

  const presentTotal = boxes.filter((b) => b.isPresent).length;
  const attendanceRate = Math.round((presentTotal / totalDays) * 100);

  return (
    <div className="space-y-3 relative">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#1B1C19]">
          <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-pulse" />
          <span>Activity & Consistency Map</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#7E766B]">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EFECE6] dark:bg-[#2D3037] border border-[#DDD7CD] dark:border-[#4B5563]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#A0DBB5]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#46A758]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#297C3B]" />
          <span>More</span>
        </div>
      </div>

      {/* Box Heatmap Grid Container */}
      <div className="relative p-3.5 rounded-2xl bg-[#FCFBF9] dark:bg-[#1D1E23] border border-[#E7DFD1] dark:border-[#374151] shadow-inner">
        <div className="flex flex-wrap gap-1.5">
          {boxes.map((box, idx) => {
            let bgClass = 'bg-[#EFECE6] dark:bg-[#2B2E36] border-[#DDD7CD] dark:border-[#3E424C] hover:border-[#6C5939] dark:hover:border-[#60A5FA]';
            if (box.isPresent) {
              const shade = (idx % 3);
              if (shade === 0) bgClass = 'bg-[#30A46C] border-[#297C3B]';
              else if (shade === 1) bgClass = 'bg-[#46A758] border-[#3e934e]';
              else bgClass = 'bg-[#297C3B] border-[#1f5e2d]';
            }

            return (
              <div
                key={idx}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const container = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                  if (container) {
                    setHoveredBox({
                      ...box,
                      x: rect.left - container.left + rect.width / 2,
                      y: rect.top - container.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredBox(null)}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border transition-all duration-150 cursor-pointer ${bgClass} hover:scale-130 hover:z-20`}
              />
            );
          })}
        </div>

        {/* LeetCode / GitHub Style Floating Interactive Tooltip Bubble */}
        {hoveredBox && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 transition-all duration-150 ease-out animate-in fade-in zoom-in-95"
            style={{ left: `${hoveredBox.x}px`, top: `${hoveredBox.y - 6}px` }}
          >
            <div className="bg-[#1E2024]/95 dark:bg-[#2A2D35]/95 backdrop-blur-md text-white rounded-xl py-2 px-3.5 shadow-2xl border border-white/15 text-center min-w-[160px] space-y-1">
              {/* Status Header */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hoveredBox.isPresent ? 'bg-[#34D399] animate-pulse' : 'bg-[#F87171]'
                  }`}
                />
                <span className={hoveredBox.isPresent ? 'text-[#34D399]' : 'text-[#FCA5A5]'}>
                  {hoveredBox.isPresent ? 'Present (Verified)' : 'Absent / Not Logged'}
                </span>
              </div>

              {/* Date & Weekday */}
              <div>
                <p className="text-xs font-extrabold text-[#F3F4F6] whitespace-nowrap">
                  {hoveredBox.date} · {hoveredBox.weekday}
                </p>
              </div>

              {/* Timeslot Banner */}
              <div className="pt-1 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#93C5FD]">
                <Clock className="w-3 h-3 text-[#60A5FA]" />
                <span>{hoveredBox.timeRange}</span>
              </div>

              <div className="text-[10px] text-[#9CA3AF]">
                {hoveredBox.periodSlot}
              </div>

              {/* Tooltip caret arrow pointing down */}
              <div className="w-2 h-2 bg-[#1E2024]/95 dark:bg-[#2A2D35]/95 border-r border-b border-white/15 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#7E766B] px-1">
        <span>{presentTotal} of {totalDays} sessions logged</span>
        <span className="font-semibold text-[#1B1C19]">{attendanceRate}% active presence</span>
      </div>
    </div>
  );
}
