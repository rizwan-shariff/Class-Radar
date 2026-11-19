'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  Users,
  XCircle,
  RotateCcw,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Clock,
  Sparkles,
  Maximize2,
  Tv,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

function SessionContent() {
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId') || 'CS301-SLOT-1';
  const todayStr = '2026-11-09';

  const [sessionId, setSessionId] = useState<string>('session-live-01');
  const [token, setToken] = useState<string>('classradar-jwt-token-alpha');
  const [countdown, setCountdown] = useState(5);
  const [presentCount, setPresentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(60);
  const [isClosed, setIsClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [sessionStarted, setSessionStarted] = useState(false);

  const [verifiedStudents, setVerifiedStudents] = useState<Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    markedAt: string;
  }>>([]);

  // Fetch initial records when session loads
  const loadExistingRecords = async (sid: string) => {
    try {
      const records = await api.attendance.getSessionRecords(sid);
      if (records && Array.isArray(records.records)) {
        setVerifiedStudents(records.records.filter((record) => record.status === 'PRESENT'));
        setPresentCount(records.presentCount);
        setTotalCount(records.totalStudents);
      }
    } catch {
      // ignore
    }
  };

  const launchSession = async () => {
    setSessionError(null);
    setIsClosed(false);
    try {
      const session = await api.attendance.startSession({
        slotId: slotId === 'CS301-SLOT-1' ? undefined : slotId,
        period: selectedPeriod,
        date: todayStr,
      } as any);
      if (session?.id) {
        setSessionId(session.id);
        setSessionStarted(true);
        await fetchToken(session.id);
        await loadExistingRecords(session.id);
      }
    } catch (err: any) {
      setSessionError(err?.message || 'Unable to start attendance session.');
    }
  };

  const generateNewToken = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const mockSignedToken = `CR-QR-${slotId}-${Date.now()}-${randomSuffix}`;
    setToken(mockSignedToken);
    setCountdown(5);
  };

  const fetchToken = async (activeSessionId: string) => {
    try {
      const res = await api.attendance.getToken(activeSessionId);
      if (res && res.token) {
        setToken(res.token);
        setCountdown(5);
      }
    } catch (e) {
      setSessionError('Unable to refresh attendance QR.');
    }
  };

  // 5-second countdown ticker & auto-poll fallback for student verified records
  useEffect(() => {
    if (isClosed) return;

    // Periodically poll DB for latest session turnout in case WebSocket connection pauses
    const pollInterval = setInterval(() => {
      if (sessionId && sessionId !== 'session-live-01') {
        loadExistingRecords(sessionId);
      }
    }, 2500);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (sessionId && sessionId !== 'session-live-01') {
            fetchToken(sessionId);
          } else {
            generateNewToken();
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [sessionId, isClosed]);

  // Real-time live attendance scan counter & live student feed
  const { joinSession } = useSocket({
    'attendance:marked': (payload: any) => {
      setPresentCount((prev) => Math.min(totalCount, prev + 1));
      if (payload) {
        setVerifiedStudents((prev) => {
          const exists = prev.some((s) => s.studentId === payload.studentId);
          if (exists) return prev;
          return [
            {
              studentId: payload.studentId,
              studentName: payload.studentName || 'Verified Student',
              studentEmail: payload.studentEmail || '',
              markedAt: payload.markedAt || new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
    },
  });

  useEffect(() => {
    if (sessionId && sessionId !== 'session-live-01') {
      joinSession(sessionId);
    }
  }, [sessionId, joinSession]);

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to lock and close this attendance session?')) return;
    try {
      if (sessionId && sessionId !== 'session-live-01') {
        await api.attendance.closeSession(sessionId);
      }
    } catch (e) {
      // ignore
    }
    setIsClosed(true);
  };

  const handleCopyToken = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/3 w-[45rem] h-[30rem] rounded-full bg-[#F9DFB5]/25 blur-[120px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Podium Screen Broadcast · Slot {slotId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Cryptographic Attendance Beacon
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Project this screen onto the classroom projector. Tokens dynamically rotate every 5 seconds to invalidate photo sharing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/faculty"
            className="px-4 py-2 rounded-full bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-bold text-[#1B1C19] transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Back to Schedule</span>
          </Link>

          {!isClosed && (
            <button
              onClick={handleCloseSession}
              className="py-2 px-4 rounded-full bg-[#FFDAD6] text-[#BA1A1A] hover:bg-[#ffcdc7] text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>Lock Attendance</span>
            </button>
          )}
        </div>
      </section>

      {/* Live QR Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Massive Projector QR Code Card (Span 7) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-10 border border-[#CFC5B8]/60 shadow-lg text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Specular Edge Rim */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />

          {!sessionStarted ? (
            <div className="py-12 space-y-5 w-full max-w-md">
              <div className="w-16 h-16 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                <QrCode className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-[#1B1C19]">Launch Attendance</h3>
              <p className="text-xs text-[#7E766B]">
                Choose a period and start as many independent attendance sessions as needed.
              </p>
              <label className="block text-left">
                <span className="text-xs font-semibold text-[#4C463C]">Time Slot / Period</span>
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-[#CFC5B8] bg-white px-3 py-2.5 text-sm text-[#1B1C19]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <option key={period} value={period}>Period {period}</option>
                  ))}
                </select>
              </label>
              {sessionError && (
                <p className="text-xs font-semibold text-[#BA1A1A]">{sessionError}</p>
              )}
              <button
                onClick={launchSession}
                className="w-full py-3 rounded-2xl bg-[#6C5939] text-white text-sm font-bold hover:bg-[#554425]"
              >
                Start QR Attendance
              </button>
            </div>
          ) : sessionError ? (
            <div className="py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1B1C19]">Unable to Start Attendance</h3>
              <p className="text-xs text-[#7E766B] max-w-sm mx-auto">{sessionError}</p>
            </div>
          ) : isClosed ? (
            <div className="py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F0EEE9] text-[#7E766B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1B1C19]">Attendance Session Closed</h3>
              <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
                No further check-ins will be accepted. Total verified: {presentCount} students.
              </p>
              <div className="pt-2">
                <Link
                  href="/faculty"
                  className="px-5 py-2.5 rounded-full bg-[#6C5939] text-white text-xs font-bold hover:bg-[#554425] transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full flex flex-col items-center">
              {/* Dynamic Rotating QR Mount */}
              <div className="p-8 bg-white rounded-3xl border-2 border-[#6C5939]/30 shadow-xl relative group">
                <QRCodeSVG
                  value={token}
                  size={320}
                  level="M"
                  includeMargin={true}
                />

                {/* Live pulse overlay */}
                <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-[#6C5939] text-white py-1 px-3 rounded-full text-[10px] font-bold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>LIVE BEACON</span>
                </div>
              </div>

              {/* 10-Second Ticker Gauge */}
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1B1C19]">
                  <span className="flex items-center gap-1.5 text-[#86724F]">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Cryptographic Refresh</span>
                  </span>
                  <span>{countdown}s remaining</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#F0EEE9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6C5939] transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Token Copy Fallback */}
              <div className="w-full max-w-sm pt-2">
                <button
                  onClick={handleCopyToken}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-mono text-[#4C463C] transition flex items-center justify-between shadow-sm"
                >
                  <span className="truncate">{token}</span>
                  <span className="shrink-0 ml-2 font-sans font-bold text-[#6C5939] flex items-center gap-1">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Turnout & Anti-Proxy Security Intel (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Turnout Counter */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#CFC5B8]/60 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#CFC5B8]/40 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
                Realtime Scan Turnout
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939] text-[10px] font-bold uppercase">
                Active Telemetry
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#1B1C19]">
                {presentCount}
              </span>
              <span className="text-sm font-semibold text-[#7E766B]">
                of {totalCount} students verified ({Math.round((presentCount / (totalCount || 1)) * 100)}%)
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#F0EEE9] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6C5939] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(4, (presentCount / (totalCount || 1)) * 100))}%` }}
              />
            </div>

            {/* Live Student Verified Activity List */}
            <div className="pt-2 border-t border-[#CFC5B8]/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#1B1C19]">
                <span className="flex items-center gap-1.5 text-[#86724F]">
                  <CheckCircle2 className="w-4 h-4 text-[#30A46C]" />
                  <span>Live Verified Students</span>
                </span>
                <span className="text-[11px] font-semibold text-[#7E766B]">
                  {verifiedStudents.length} Checked In
                </span>
              </div>

              {verifiedStudents.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F0EEE9]/60 text-center text-xs text-[#7E766B] border border-dashed border-[#CFC5B8]/60">
                  Waiting for students to scan the live QR beacon...
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {verifiedStudents.map((s, idx) => (
                    <div
                      key={s.studentId || idx}
                      className="p-2.5 rounded-xl bg-white border border-[#CFC5B8]/60 flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-300"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#E7DFD1] text-[#6C5939] font-bold text-xs flex items-center justify-center shrink-0">
                          {s.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1B1C19] truncate">{s.studentName}</p>
                          <p className="text-[10px] text-[#7E766B] truncate">{s.studentEmail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#30A46C] font-semibold shrink-0 ml-2">
                        {new Date(s.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security & Anti-Proxy Guidelines */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#CFC5B8]/60 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#6C5939]" />
              <h3 className="text-base font-bold text-[#1B1C19]">Anti-Proxy Architecture</h3>
            </div>

            <ul className="space-y-3 text-xs text-[#4C463C] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5939] mt-1.5 shrink-0" />
                <span><strong>Short-Lived JWTs:</strong> Each QR refreshes every 5 seconds and remains within a 20-second server acceptance window.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5939] mt-1.5 shrink-0" />
                <span><strong>Mobile-Only Scan Enforcement:</strong> Students must scan live from their mobile devices; screenshots sent to remote friends expire before they can be opened.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5939] mt-1.5 shrink-0" />
                <span><strong>Immediate Ledger Sync:</strong> Once verified, attendance registers across student bunk calculators instantly.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FacultySessionPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs font-semibold text-[#7E766B]">
          Initializing live QR attendance beacon...
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
