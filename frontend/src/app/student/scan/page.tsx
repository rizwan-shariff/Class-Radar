'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  Camera,
  KeyRound,
  StopCircle,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Lock,
  Radio
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentScanPage() {
  const [manualToken, setManualToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [mobileUrl, setMobileUrl] = useState('');

  // Poll for faculty active attendance session authorization
  const { data: sessionAuth, isLoading: isCheckingAuth, refetch: refetchAuth } = useQuery({
    queryKey: ['active-attendance-session'],
    queryFn: () => api.attendance.checkActiveSession(),
    refetchInterval: 5000, // checks every 5s if faculty opened a session
  });

  const isSessionAllowed =
    !isCheckingAuth && sessionAuth?.active === true && Boolean(sessionAuth.session);
  const activeSessionInfo = sessionAuth?.session;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Use local IP so scanning from mobile works immediately
        setMobileUrl(`http://10.120.87.71:3001/student/scan`);
      } else {
        setMobileUrl(window.location.href);
      }
    }
  }, []);

  useEffect(() => {
    if (isSessionAllowed) return;
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) {
        void scannerRef.current.stop();
      }
    } catch {
      // Scanner may already be stopped.
    }
    setIsCameraActive(false);
  }, [isSessionAllowed]);

  const submitToken = async (tokenToSubmit: string) => {
    if (!tokenToSubmit.trim()) return;
    if (!isSessionAllowed) {
      setStatus('error');
      setMessage('Attendance is currently locked. Your faculty instructor has not enabled the attendance session yet.');
      return;
    }

    setStatus('scanning');
    setMessage(null);

    // Stop camera if running
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      setIsCameraActive(false);
    }

    try {
      const res = await api.attendance.scan(tokenToSubmit.trim());
      setStatus('success');
      setMessage(`Attendance successfully verified at ${new Date(res.markedAt).toLocaleTimeString()}`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'QR verification rejected. Session may have expired or is invalid.');
    }
  };

  const startCamera = async () => {
    if (!isSessionAllowed) {
      setStatus('error');
      setMessage('Cannot start camera. Your faculty instructor has not enabled the live attendance session.');
      return;
    }

    try {
      setStatus('idle');
      setMessage(null);
      setIsCameraActive(true);

      // Allow DOM element to mount
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      let cameraConfig: any = "environment";
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear") || c.label.toLowerCase().includes("environment")
          );
          cameraConfig = backCam ? backCam.id : cameras[0].id;
        }
      } catch (e) {
        cameraConfig = "environment";
      }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 20,
          aspectRatio: 1.0,
          disableFlip: false,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Expand scan area to 90% of viewfinder
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.max(200, Math.floor(minEdge * 0.90));
            return { width: qrEdge, height: qrEdge };
          },
        },
        (decodedText) => {
          submitToken(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setIsCameraActive(false);
      setMessage(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in your browser bar.'
          : 'Unable to open camera stream. If on mobile, please check camera permissions.'
      );
      setStatus('error');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitToken(manualToken);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[32rem] h-[32rem] rounded-full bg-[#EAE1D4]/40 blur-[120px]" />
        <div className="absolute bottom-20 left-1/4 w-[30rem] h-[30rem] rounded-full bg-[#F9DFB5]/20 blur-[110px]" />
      </div>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#CFC5B8]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2 h-2 rounded-full ${isSessionAllowed ? 'bg-[#30A46C] animate-pulse' : 'bg-[#BA1A1A]'}`} />
            <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
              {isSessionAllowed ? 'Faculty Permission Granted · Live Session Open' : 'Faculty Permission Required · Locked'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Lecture Attendance Verification
          </h1>
          <p className="text-sm text-[#4C463C] mt-1 max-w-2xl">
            Scan and verify is gated: it activates strictly when your course faculty launches and permits an attendance session from their dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/attendance"
            className="px-4 py-2 rounded-full bg-[#F0EEE9] hover:bg-[#E5E2DD] text-xs font-semibold text-[#1B1C19] transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#6C5939]" />
            <span>View Attendance Stats</span>
          </Link>
        </div>
      </div>

      {/* Permission State Banner */}
      {!isSessionAllowed ? (
        <div className="rounded-3xl bg-[#FFDAD6]/40 border border-[#BA1A1A]/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1B1C19]">
                Attendance Verification is Currently Inactive
              </h3>
              <p className="text-xs text-[#7E766B] mt-0.5">
                Your instructor has not opened the attendance session yet. When the faculty starts the session, this portal unlocks automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchAuth()}
            className="py-2 px-4 rounded-full bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-bold text-[#1B1C19] transition shrink-0"
          >
            Refresh Status
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#E7F5ED] border border-[#30A46C]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#30A46C] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#30A46C] text-white">
                  Live Attendance Allowed
                </span>
                <span className="text-xs font-bold text-[#1B1C19]">
                  {activeSessionInfo?.subjectCode} — {activeSessionInfo?.subjectName}
                </span>
              </div>
              <p className="text-xs text-[#4C463C] mt-1">
                Instructor: <strong>{activeSessionInfo?.facultyName || 'Faculty'}</strong> · Room: <strong>{activeSessionInfo?.roomName || 'Room 406'}</strong>
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#30A46C] bg-white px-3.5 py-1.5 rounded-full border border-[#30A46C]/30 shadow-xs">
            Ready to Verify
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP / LAPTOP PRESENTATION (hidden md:grid) */}
      {/* ========================================================================= */}
      <div className="hidden md:grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Dedicated Mobile Pairing & Instructions (Span 7) */}
        <div className="col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl p-8 border border-[#CFC5B8]/60 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F9DFB5]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center font-bold shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
                  Laptop Interface Mode
                </span>
                <h3 className="text-xl font-bold text-[#1B1C19]">
                  Camera Scanner is Handheld Mobile Only
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#4C463C] leading-relaxed mb-6">
              To prevent accidental proxy check-ins and maintain strict optical angle verification with the instructor's rotating QR token, <strong>camera scanning is strictly designated for handheld mobile devices</strong>.
            </p>

            <div className="bg-[#FFFFFF]/90 rounded-2xl p-6 border border-[#CFC5B8]/50 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
              <div className="p-3 bg-white rounded-2xl border border-[#CFC5B8]/60 shadow-inner shrink-0">
                <QRCodeSVG
                  value={mobileUrl || 'https://classradar.app/student/scan'}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939] text-[11px] font-bold uppercase">
                  <Sparkles className="w-3 h-3" />
                  Instant Mobile Switch
                </div>
                <h4 className="text-base font-bold text-[#1B1C19]">
                  Open on your Phone
                </h4>
                <p className="text-xs text-[#7E766B] leading-normal">
                  Point your smartphone camera at this QR code to seamlessly continue your session on mobile and launch the live camera scanner.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] font-mono text-[#86724F] bg-[#F6F3EE] px-2 py-1 rounded-md border border-[#CFC5B8]/40">
                    {mobileUrl || 'http://10.120.87.71:3001/student/scan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-step guidance */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-[#CFC5B8]/40">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#86724F] uppercase">Step 01</span>
                <p className="text-xs font-bold text-[#1B1C19]">Faculty Permission</p>
                <p className="text-[11px] text-[#7E766B]">Instructor clicks launch on their screen.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#86724F] uppercase">Step 02</span>
                <p className="text-xs font-bold text-[#1B1C19]">Open on Mobile</p>
                <p className="text-[11px] text-[#7E766B]">Use phone back camera to scan podium QR.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#86724F] uppercase">Step 03</span>
                <p className="text-xs font-bold text-[#1B1C19]">Heatmap Updated</p>
                <p className="text-[11px] text-[#7E766B]">Instant update to your and faculty's progress matrix.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Laptop Direct Token Fallback (Span 5) */}
        <div className="col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-7 border border-[#CFC5B8]/60 shadow-lg space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0EEE9] text-[#6C5939] flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86724F]">
                  Laptop Fallback
                </span>
                <h3 className="text-base font-bold text-[#1B1C19]">
                  Token Verification Entry
                </h3>
              </div>
            </div>

            {status === 'success' ? (
              <div className="p-6 rounded-2xl bg-[#E7DFD1]/50 border border-[#6C5939]/30 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#6C5939] text-white flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#1B1C19]">Attendance Confirmed</h4>
                <p className="text-xs text-[#4C463C]">{message}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage(null);
                    setManualToken('');
                  }}
                  className="py-2 px-5 rounded-2xl bg-[#6C5939] text-white text-xs font-semibold hover:bg-[#554425] transition"
                >
                  Verify Another
                </button>
              </div>
            ) : status === 'error' ? (
              <div className="p-6 rounded-2xl bg-[#FFDAD6]/50 border border-[#BA1A1A]/30 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#BA1A1A]">Verification Notice</h4>
                <p className="text-xs text-[#93000A]">{message}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage(null);
                  }}
                  className="py-2 px-5 rounded-2xl bg-[#F0EEE9] text-[#1B1C19] text-xs font-semibold hover:bg-[#E5E2DD] transition"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <p className="text-xs text-[#4C463C]">
                  If you are using a laptop and your instructor has allowed the attendance session, paste the active token below:
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1B1C19]">
                    Cryptographic Session Token / Passcode
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isSessionAllowed}
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder={isSessionAllowed ? "Paste active token..." : "Locked until faculty opens session..."}
                    className="w-full p-3.5 rounded-2xl bg-white border border-[#CFC5B8] text-xs font-mono text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 resize-none disabled:bg-[#F0EEE9]/50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isSessionAllowed || status === 'scanning' || !manualToken.trim()}
                  className="w-full py-3 px-5 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'scanning' ? (
                    <span>Verifying with Campus Authority...</span>
                  ) : !isSessionAllowed ? (
                    <span>Locked: Awaiting Faculty Activation</span>
                  ) : (
                    <>
                      <span>Submit Token for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="p-4 rounded-2xl bg-[#F0EEE9]/70 border border-[#CFC5B8]/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#86724F] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#7E766B] leading-relaxed">
                <strong>Anti-Proxy Security:</strong> Scan and verification requests are cryptographically verified and will only be accepted if your instructor currently has an open session on their podium screen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE PRESENTATION (block md:hidden) - FULL OPTICAL CAMERA SCANNER */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-6">
        {/* Visual Scanner Frame */}
        <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/60 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
          {status === 'success' ? (
            <div className="text-center space-y-3 animate-in zoom-in-95 duration-200 py-6">
              <div className="w-16 h-16 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h3 className="text-base font-bold text-[#1B1C19]">Attendance Confirmed</h3>
              <p className="text-xs text-[#4C463C] max-w-xs mx-auto">{message}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setMessage(null);
                  setManualToken('');
                }}
                className="py-2.5 px-6 rounded-2xl bg-[#6C5939] text-white text-xs font-semibold hover:bg-[#554425] transition"
              >
                Scan Next Session
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="text-center space-y-3 animate-in zoom-in-95 duration-200 py-6">
              <div className="w-16 h-16 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto">
                <AlertCircle className="w-9 h-9" />
              </div>
              <h3 className="text-base font-bold text-[#BA1A1A]">Scan Notice</h3>
              <p className="text-xs text-[#93000A] max-w-xs mx-auto">{message}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setMessage(null);
                }}
                className="py-2.5 px-6 rounded-2xl bg-[#F0EEE9] text-[#1B1C19] text-xs font-semibold hover:bg-[#E5E2DD] transition"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* HTML5 QR Code Mount container */}
              <div
                id="qr-reader-container"
                className={`w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-2 border-[#6C5939]/40 bg-black shadow-lg ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />

              {!isCameraActive && (
                <div className="w-64 h-64 rounded-3xl border-2 border-dashed border-[#6C5939]/60 relative flex flex-col items-center justify-center bg-[#F6F3EE]/60 p-4 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${isSessionAllowed ? 'bg-[#E7DFD1] text-[#6C5939]' : 'bg-[#FFDAD6] text-[#BA1A1A]'} flex items-center justify-center mb-3`}>
                    {isSessionAllowed ? <QrCode className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                  </div>
                  <p className="text-sm font-bold text-[#1B1C19]">
                    {isSessionAllowed ? 'Optical Camera Ready' : 'Scanning Locked'}
                  </p>
                  <p className="text-[11px] text-[#7E766B] mt-1 mb-4">
                    {isSessionAllowed
                      ? 'Tap below to launch your phone camera'
                      : 'Faculty must permit the session first'}
                  </p>
                  <button
                    type="button"
                    disabled={!isSessionAllowed}
                    onClick={startCamera}
                    className="py-2.5 px-5 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isSessionAllowed ? 'Open Camera' : 'Awaiting Faculty'}</span>
                  </button>
                </div>
              )}

              {isCameraActive && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="mt-4 py-2 px-5 rounded-2xl bg-[#BA1A1A] hover:bg-[#93000a] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}

              <p className="text-[11px] text-[#7E766B] mt-4 text-center">
                Cryptographic tokens rotate every 10s. Point phone directly at screen.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Manual Fallback */}
        <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/50">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-[#86724F]" />
            <h3 className="text-xs font-bold text-[#1B1C19] uppercase tracking-wider">
              Manual Token Entry Fallback
            </h3>
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              disabled={!isSessionAllowed}
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder={isSessionAllowed ? "Paste token or passcode..." : "Locked until faculty opens session..."}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8]/80 text-xs text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 disabled:bg-[#F0EEE9]/50"
            />
            <button
              type="submit"
              disabled={!isSessionAllowed || status === 'scanning' || !manualToken}
              className="py-2.5 px-4 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold transition disabled:opacity-50 shrink-0"
            >
              {status === 'scanning' ? 'Verifying...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
