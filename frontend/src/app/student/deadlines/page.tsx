'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, SubmissionDeadline } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  FileCheck2,
  Calendar,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Timer
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDeadlinesPage() {
  const { data: deadlines, isLoading, refetch } = useQuery<SubmissionDeadline[]>({
    queryKey: ['student-deadlines'],
    queryFn: () => api.submissions.listStudent(),
  });

  // Listen to realtime deadline broadcasts from faculty
  useSocket({
    'deadline:finalized': () => {
      refetch();
    },
    'deadline:updated': () => {
      refetch();
    },
  });

  const activeDeadlines = (deadlines || []).filter((d) => d.urgency !== 'EXPIRED');
  const pastDeadlines = (deadlines || []).filter((d) => d.urgency === 'EXPIRED');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#EAE8E3] to-[#F0EEE9] dark:from-[#25262B] dark:to-[#1C1D21] border border-[#CFC5B8]/60 dark:border-white/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#6C5939]/10 dark:bg-white/10 text-[#6C5939] dark:text-[#D4AF37]">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#1B1C19] dark:text-[#E8EAED]">
                Coursework & Submission Deadlines
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7E766B] dark:text-white/60 max-w-2xl">
              Official assignment milestones and project dates finalized by your course professors. Keep track of approaching deadlines with real-time countdown alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-black/20 border border-[#CFC5B8]/40 dark:border-white/10 text-xs text-center font-bold text-[#1B1C19] dark:text-[#E8EAED]">
              <span className="text-base text-[#6C5939] dark:text-[#D4AF37] block">{activeDeadlines.length}</span>
              <span className="text-[10px] text-[#7E766B] dark:text-white/40 uppercase tracking-wider">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Deadlines List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B1C19] dark:text-[#E8EAED] flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#6C5939] dark:text-[#D4AF37]" />
            <span>Active Deadlines ({activeDeadlines.length})</span>
          </h2>
          <span className="text-[11px] text-[#7E766B] dark:text-white/40">Sorted by nearest due date</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-[#CFC5B8]/40 dark:border-white/10 text-xs text-[#7E766B]">
            Loading finalized deadlines...
          </div>
        ) : activeDeadlines.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-white/50 dark:bg-[#25262B]/50 border border-dashed border-[#CFC5B8]/60 dark:border-white/10 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <h3 className="font-bold text-sm text-[#1B1C19] dark:text-[#E8EAED]">All Caught Up!</h3>
            <p className="text-xs text-[#7E766B] dark:text-white/50 max-w-sm mx-auto">
              There are no pending submission deadlines for your section at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDeadlines.map((d) => {
              const isCritical = d.urgency === 'CRITICAL';
              const isUrgent = d.urgency === 'URGENT';

              return (
                <div
                  key={d.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-[#25262B] border shadow-sm space-y-4 transition-all hover:shadow-md ${
                    isCritical
                      ? 'border-red-500/40 ring-2 ring-red-500/10 bg-red-500/[0.02]'
                      : isUrgent
                      ? 'border-amber-500/40 ring-2 ring-amber-500/10 bg-amber-500/[0.02]'
                      : 'border-[#CFC5B8]/60 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#6C5939] dark:text-[#D4AF37]">
                          {d.subject?.code}
                        </span>
                        <span className="text-[10px] text-[#7E766B] dark:text-white/40">•</span>
                        <span className="text-[11px] font-semibold text-[#7E766B] dark:text-white/60">
                          {d.subject?.name}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[#1B1C19] dark:text-[#E8EAED]">{d.title}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                        isCritical
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse'
                          : isUrgent
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-[#EAE8E3] dark:bg-white/10 text-[#6C5939] dark:text-[#D4AF37]'
                      }`}
                    >
                      {d.countdown}
                    </span>
                  </div>

                  {d.description && (
                    <p className="text-xs text-[#7E766B] dark:text-white/70 leading-relaxed bg-[#EAE8E3]/30 dark:bg-white/5 p-3 rounded-2xl border border-[#CFC5B8]/20 dark:border-white/5">
                      {d.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#CFC5B8]/30 dark:border-white/10 flex items-center justify-between text-xs text-[#7E766B] dark:text-white/60">
                    <div className="flex items-center gap-1.5 font-bold text-[#1B1C19] dark:text-[#E8EAED]">
                      <Calendar className="w-3.5 h-3.5 text-[#6C5939] dark:text-[#D4AF37]" />
                      <span>{new Date(d.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#7E766B] dark:text-white/40">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>Prof. {d.faculty?.name || 'Faculty'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Completed Submissions */}
      {pastDeadlines.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7E766B] dark:text-white/40">
            Past Submissions ({pastDeadlines.length})
          </h2>

          <div className="space-y-2">
            {pastDeadlines.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-[#CFC5B8]/30 dark:border-white/5 flex items-center justify-between text-xs opacity-70"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/50">
                    {d.subject?.code}
                  </span>
                  <span className="font-semibold text-[#1B1C19] dark:text-[#E8EAED]">{d.title}</span>
                </div>
                <span className="text-[11px] text-[#7E766B] dark:text-white/40">
                  Ended {new Date(d.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
