'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import { Users, XCircle, RotateCcw, CheckCircle2, Copy, Check } from 'lucide-react';

function SessionContent() {
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId') || 'CS301-SLOT-1';
  const todayStr = '2026-11-09';

  const [sessionId, setSessionId] = useState<string>('session-live-01');
  const [token, setToken] = useState<string>('classradar-jwt-token-alpha');
  const [countdown, setCountdown] = useState(10);
  const [presentCount, setPresentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(60);
  const [isClosed, setIsClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize or start session
  useEffect(() => {
    async function start() {
      try {
        const session = await api.attendance.startSession({
          slotId,
          date: todayStr,
        });
        if (session && session.id) {
          setSessionId(session.id);
          fetchToken(session.id);
        }
      } catch (err: any) {
        // Fallback live rotating mock token
        generateNewToken();
      }
    }
    start();
  }, [slotId, todayStr]);

  const generateNewToken = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const mockSignedToken = `CR-QR-${slotId}-${Date.now()}-${randomSuffix}`;
    setToken(mockSignedToken);
    setCountdown(10);
  };

  const fetchToken = async (activeSessionId: string) => {
    try {
      const res = await api.attendance.getToken(activeSessionId);
      if (res && res.token) {
        setToken(res.token);
        setCountdown(10);
      } else {
        generateNewToken();
      }
    } catch (err) {
      generateNewToken();
    }
  };

  // 10-second rotation timer
  useEffect(() => {
    if (isClosed) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (sessionId && !sessionId.startsWith('session-live')) {
            fetchToken(sessionId);
          } else {
            generateNewToken();
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, isClosed]);

  // Socket.IO for live student scan counter
  const { joinSession } = useSocket({
    'attendance:count': (payload: any) => {
      if (payload.sessionId === sessionId) {
        setPresentCount(payload.present);
        if (payload.total) setTotalCount(payload.total);
      }
    },
  });

  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId);
    }
  }, [sessionId]);

  const handleCloseSession = async () => {
    if (sessionId) {
      try {
        await api.attendance.closeSession(sessionId);
      } catch (e) {
        // ignore
      }
    }
    setIsClosed(true);
  };

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick increment for local demonstration
  const handleSimulateScan = () => {
    setPresentCount((c) => Math.min(totalCount, c + 1));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Session Header */}
      <div className="glass-panel rounded-3xl p-6 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
            Live Attendance Engine
          </span>
          <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Rotating QR Session</h2>
          <p className="text-xs text-[#4C463C] mt-0.5">Slot: {slotId}</p>
        </div>

        {/* Live Attendance Counter */}
        <div className="flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-[#E7DFD1] text-[#6C5939]">
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold">
            {presentCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Main QR Display */}
      <div className="glass-panel rounded-3xl p-8 border border-[#CFC5B8]/60 flex flex-col items-center justify-center space-y-5 text-center">
        {isClosed ? (
          <div className="py-12 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-[#6C5939] mx-auto opacity-80" />
            <h3 className="text-lg font-bold text-[#1B1C19]">Session Finalized</h3>
            <p className="text-xs text-[#7E766B] max-w-xs mx-auto">
              This attendance session has been locked. All remaining students without a scan record have been marked absent.
            </p>
          </div>
        ) : (
          <>
            {/* High-Contrast Crisp QR Card */}
            <div className="relative flex items-center justify-center p-6 bg-white rounded-3xl shadow-xl border border-[#CFC5B8]/60">
              <QRCodeSVG
                value={token || 'classradar-session'}
                size={230}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Rotation Countdown */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4C463C]">
              <RotateCcw className="w-4 h-4 animate-spin text-[#6C5939]" />
              <span>
                Token rotates in <strong className="text-[#6C5939] font-mono text-sm">{countdown}s</strong>
              </span>
            </div>

            {/* Token Quick-Copy Box for testing scanner across tabs */}
            <div className="w-full bg-[#FFFFFF]/80 border border-[#CFC5B8]/70 rounded-2xl p-3 flex items-center justify-between text-left">
              <div className="truncate mr-2">
                <span className="text-[10px] font-bold text-[#7E766B] uppercase block">
                  Active Token Payload
                </span>
                <span className="text-xs font-mono text-[#1B1C19] truncate block max-w-xs">
                  {token}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                className="py-1.5 px-3 rounded-xl bg-[#F0EEE9] hover:bg-[#E5E2DD] text-xs font-semibold text-[#1B1C19] flex items-center gap-1 shrink-0 transition"
                title="Copy token to test in Student Scanner"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#6C5939]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSimulateScan}
                className="py-2 px-4 rounded-2xl bg-[#E7DFD1] hover:bg-[#ded4c3] text-[#6C5939] text-xs font-bold transition"
              >
                +1 Simulate Scan
              </button>
              <button
                type="button"
                onClick={handleCloseSession}
                className="py-2 px-4 rounded-2xl bg-[#BA1A1A] hover:bg-[#93000a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Finalize Session</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FacultyQRSessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7E766B]">Loading QR session...</div>}>
      <SessionContent />
    </Suspense>
  );
}
