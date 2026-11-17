'use client';

import React from 'react';

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
  // Generate simulated 60-day calendar boxes (10 columns x 6 rows or 12 cols x 5 rows)
  const boxes = React.useMemo(() => {
    const list = [];
    // Seed deterministically based on studentName or counts
    const seed = (studentName || 'seed').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    for (let i = 0; i < totalDays; i++) {
      let isPresent = false;
      if (highlightDays && highlightDays.length > 0) {
        isPresent = highlightDays.includes(i);
      } else {
        // pseudo-random with high probability of present to reach ~attendedCount
        const val = ((seed * (i + 13) * 31) % 100);
        // exclude weekend breaks (e.g. every 6th or 7th day)
        const isClassDay = (i % 7) !== 0 && (i % 7) !== 6;
        isPresent = isClassDay && (val < (attendedCount / totalDays) * 115);
      }
      
      const date = new Date(2026, 8, 1); // Start Sept 1, 2026
      date.setDate(date.getDate() + i);

      list.push({
        dayIndex: i,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPresent,
      });
    }
    return list;
  }, [studentName, totalDays, attendedCount, highlightDays]);

  const presentTotal = boxes.filter((b) => b.isPresent).length;
  const attendanceRate = Math.round((presentTotal / totalDays) * 100);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#1B1C19]">
          <span className="w-2 h-2 rounded-full bg-[#30A46C]" />
          <span>Activity & Consistency Map</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#7E766B]">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EFECE6] border border-[#DDD7CD]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#A0DBB5]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#46A758]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#297C3B]" />
          <span>More</span>
        </div>
      </div>

      {/* Box Heatmap Grid (Github/Leetcode style: 7 rows for days of week, flex-wrap) */}
      <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#FCFBF9] border border-[#E7DFD1] shadow-inner">
        {boxes.map((box, idx) => {
          let bgClass = 'bg-[#EFECE6] border-[#DDD7CD] hover:border-[#6C5939]';
          if (box.isPresent) {
            // vary greens like GitHub
            const shade = (idx % 3);
            if (shade === 0) bgClass = 'bg-[#30A46C] border-[#297C3B] text-white';
            else if (shade === 1) bgClass = 'bg-[#46A758] border-[#3e934e] text-white';
            else bgClass = 'bg-[#297C3B] border-[#1f5e2d] text-white';
          }

          return (
            <div
              key={idx}
              title={`${box.date}: ${box.isPresent ? 'Present (Attended)' : 'Absent / No Lecture'}`}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border transition-all duration-150 cursor-pointer ${bgClass} hover:scale-125 relative group`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#7E766B] px-1">
        <span>{presentTotal} sessions logged</span>
        <span className="font-semibold text-[#1B1C19]">{attendanceRate}% active presence</span>
      </div>
    </div>
  );
}
