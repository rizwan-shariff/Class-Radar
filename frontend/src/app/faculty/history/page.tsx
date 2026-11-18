'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  History,
  Users,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function FacultyHistoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Invalidate in real-time when any attendance session is marked or finalized
  useSocket({
    'attendance:finalized': () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-sessions-history'] });
    },
    'attendance:marked': () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-sessions-history'] });
    },
  });

  const { data: pastSessions, isLoading, error } = useQuery({
    queryKey: ['faculty-sessions-history'],
    queryFn: () => api.attendance.getFacultySessionsHistory(),
  });

  // Extract unique subjects for filtering
  const subjectsList = React.useMemo(() => {
    if (!pastSessions) return [];
    const set = new Set<string>();
    pastSessions.forEach((s: any) => {
      if (s.subjectCode) set.add(s.subjectCode);
    });
    return Array.from(set);
  }, [pastSessions]);

  // Filtered session list
  const filteredSessions = React.useMemo(() => {
    if (!pastSessions) return [];
    return pastSessions.filter((s: any) => {
      const matchesSearch =
        (s.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.subjectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.roomName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sectionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.records || []).some((r: any) =>
          (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.studentEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSubject = filterSubject === 'ALL' || s.subjectCode === filterSubject;
      return matchesSearch && matchesSubject;
    });
  }, [pastSessions, searchTerm, filterSubject]);

  const totalSessionsCount = pastSessions?.length || 0;
  const totalStudentsVerified = pastSessions?.reduce((acc: number, s: any) => acc + (s.totalVerified || 0), 0) || 0;

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
              Attendance Ledger & Verification Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Session Attendance History
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Complete historical audit trail of conducted QR sessions, student scan timestamps, and absence rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-[#F0EEE9] border border-white/80 shadow-sm flex items-center gap-2 text-xs font-bold text-[#1B1C19]">
            <History className="w-4 h-4 text-[#6C5939]" />
            <span>{totalSessionsCount} Sessions Archived</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-[#E7DFD1] border border-white/80 shadow-sm flex items-center gap-2 text-xs font-bold text-[#6C5939]">
            <Users className="w-4 h-4 text-[#6C5939]" />
            <span>{totalStudentsVerified} Total Scans</span>
          </div>
        </div>
      </section>

      {/* Controls: Search, Filter & Quick Stats */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-[#CFC5B8]/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E766B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course, student name, email, or room..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F0EEE9]/70 border border-[#CFC5B8]/50 text-xs text-[#1B1C19] placeholder:text-[#7E766B] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E766B] hover:text-[#1B1C19]"
            >
              Clear
            </button>
          )}
        </div>

        {subjectsList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-[#7E766B] flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#6C5939]" /> Filter:
            </span>
            <button
              onClick={() => setFilterSubject('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                filterSubject === 'ALL'
                  ? 'bg-[#6C5939] text-white shadow-sm'
                  : 'bg-[#F0EEE9] text-[#4C463C] hover:bg-[#E5E2DD]'
              }`}
            >
              All
            </button>
            {subjectsList.map((code) => (
              <button
                key={code}
                onClick={() => setFilterSubject(code)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                  filterSubject === code
                    ? 'bg-[#6C5939] text-white shadow-sm'
                    : 'bg-[#F0EEE9] text-[#4C463C] hover:bg-[#E5E2DD]'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Sessions History List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : error || !pastSessions || pastSessions.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-[#CFC5B8]/50 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1B1C19]">No Attendance Sessions Conducted Yet</h3>
            <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
              When you launch and finalize live QR attendance sessions for your classes, their detailed verification history will be permanently logged here.
            </p>
            <div className="pt-2">
              <Link
                href="/faculty/session"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6C5939] text-white text-xs font-bold shadow-md hover:bg-[#53442a] transition"
              >
                <span>Launch Active QR Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center border border-[#CFC5B8]/50 text-xs text-[#7E766B]">
            No attendance sessions match your search or filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session: any) => {
              const isExpanded = expandedSessionId === session.sessionId;
              const dateFormatted = new Date(session.startedAt || session.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeFormatted = new Date(session.startedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const closedFormatted = session.closedAt
                ? new Date(session.closedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <div
                  key={session.sessionId}
                  className="rounded-3xl bg-white/95 backdrop-blur-xl border border-[#CFC5B8]/60 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F0EEE9] text-[#6C5939] flex items-center justify-center font-bold text-base shrink-0 border border-[#CFC5B8]/40 shadow-inner">
                        <FileSpreadsheet className="w-6 h-6 text-[#6C5939]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-[#1B1C19]">
                            {session.subjectCode} · {session.subjectName}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              session.status === 'CLOSED'
                                ? 'bg-[#E7DFD1] text-[#6C5939]'
                                : 'bg-[#D2E4FF] text-[#004A77]'
                            }`}
                          >
                            {session.status === 'CLOSED' ? 'FINALIZED' : 'ACTIVE LIVE'}
                          </span>
                        </div>
                        <p className="text-xs text-[#7E766B] mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{dateFormatted} at {timeFormatted}</span>
                          <span className="opacity-40">•</span>
                          <span>{session.roomName}</span>
                          <span className="opacity-40">•</span>
                          <span>Section {session.sectionName}</span>
                          {session.period && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="font-semibold text-[#86724F]">Period {session.period}</span>
                            </>
                          )}
                          {closedFormatted && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="text-[#86724F]">Locked at {closedFormatted}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#30A46C] bg-[#E7F6ED] px-3 py-1.5 rounded-xl border border-[#30A46C]/20">
                          {session.totalVerified} Present
                        </span>
                        <span className="text-xs font-bold text-[#BA1A1A] bg-[#FFDAD6] px-3 py-1.5 rounded-xl border border-[#BA1A1A]/20">
                          {session.totalAbsent} Absent
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
                        className="py-2 px-4 rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-xs font-bold text-[#1B1C19] flex items-center gap-1.5 transition"
                      >
                        <Users className="w-3.5 h-3.5 text-[#6C5939]" />
                        <span>{isExpanded ? 'Hide Records' : 'View Student Roster'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Student Attendance Records breakdown */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-[#CFC5B8]/40 animate-in fade-in duration-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-[#4C463C]">
                        <span>Full Student Attendance Roll ({session.records?.length || 0} Students)</span>
                        <span className="text-[11px] text-[#7E766B]">
                          Session ID: <code className="bg-[#F0EEE9] px-1.5 py-0.5 rounded text-[10px]">{session.sessionId}</code>
                        </span>
                      </div>

                      {(!session.records || session.records.length === 0) ? (
                        <div className="text-xs text-[#7E766B] py-4 text-center bg-[#FCFBF9] rounded-2xl border border-[#CFC5B8]/30">
                          No individual records logged for this session.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {session.records.map((rec: any, idx: number) => {
                            const isPresent = rec.status === 'PRESENT';
                            const recTime = rec.markedAt
                              ? new Date(rec.markedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—';

                            return (
                              <div
                                key={rec.studentId || idx}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                                  isPresent
                                    ? 'bg-[#FCFBF9] border-[#CFC5B8]/60 shadow-sm'
                                    : 'bg-[#FFF8F7] border-[#FFDAD6]'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <div className="font-bold text-[#1B1C19] truncate">
                                    {rec.studentName}
                                  </div>
                                  <div className="text-[11px] text-[#7E766B] truncate">
                                    {rec.studentEmail}
                                  </div>
                                  <div className="text-[10px] text-[#86724F]">
                                    Method: {rec.method || (isPresent ? 'SCAN' : 'SYSTEM')}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                      isPresent
                                        ? 'bg-[#E7DFD1] text-[#6C5939]'
                                        : 'bg-[#FFDAD6] text-[#93000A]'
                                    }`}
                                  >
                                    {isPresent ? 'PRESENT' : 'ABSENT'}
                                  </span>
                                  <span className="block text-[10px] text-[#7E766B] mt-1">
                                    {isPresent ? recTime : 'Missed'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

