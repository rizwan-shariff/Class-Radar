'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { QrCode, CheckCircle, AlertCircle, Camera, KeyRound, StopCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function StudentScanPage() {
  const [manualToken, setManualToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const submitToken = async (tokenToSubmit: string) => {
    if (!tokenToSubmit.trim()) return;
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

      // Prefer back/environment camera, fallback to user camera if desktop/laptop
      await html5QrCode.start(
        { facingMode: { ideal: 'environment' } },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.floor(minEdge * 0.75);
            return { width: qrEdge, height: qrEdge };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          submitToken(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setIsCameraActive(false);
      setMessage(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in your browser bar.'
          : 'Unable to open camera stream. If using laptop/desktop, verify your webcam is connected or use manual entry below.'
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
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 text-center">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Anti-Proxy Verification
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Scan Lecture QR</h2>
        <p className="text-xs text-[#4C463C] mt-1 max-w-xs mx-auto">
          Scan the rotating cryptographic token displayed on your instructor's screen.
        </p>
      </div>

      {/* Visual Scanner Frame */}
      <div className="glass-panel rounded-3xl p-6 border border-[#CFC5B8]/60 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
        {status === 'success' ? (
          <div className="text-center space-y-3 animate-in zoom-in-95 duration-200 py-6">
            <div className="w-16 h-16 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-base font-bold text-[#1B1C19]">Attendance Recorded!</h3>
            <p className="text-xs text-[#4C463C] max-w-xs mx-auto">{message}</p>
            <button
              onClick={() => {
                setStatus('idle');
                setMessage(null);
                setManualToken('');
              }}
              className="py-2 px-5 rounded-2xl bg-[#6C5939] text-white text-xs font-semibold hover:bg-[#554425] transition"
            >
              Done / Scan Again
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
              className="py-2 px-5 rounded-2xl bg-[#F0EEE9] text-[#1B1C19] text-xs font-semibold hover:bg-[#E5E2DD] transition"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* HTML5 QR Code Mount container */}
            <div
              id="qr-reader-container"
              className={`w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-[#6C5939]/40 bg-black shadow-lg ${
                isCameraActive ? 'block' : 'hidden'
              }`}
            />

            {!isCameraActive && (
              <div className="w-64 h-64 rounded-3xl border-2 border-dashed border-[#6C5939]/60 relative flex flex-col items-center justify-center bg-[#F6F3EE]/60 p-4 text-center">
                <QrCode className="w-14 h-14 text-[#6C5939] opacity-70 mb-3" />
                <p className="text-xs font-semibold text-[#1B1C19]">Live Camera Feed</p>
                <p className="text-[11px] text-[#7E766B] mt-1 mb-4">
                  Tap below to start your webcam or mobile camera
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-2 px-4 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {isCameraActive && (
              <button
                type="button"
                onClick={stopCamera}
                className="mt-4 py-2 px-4 rounded-2xl bg-[#BA1A1A] hover:bg-[#93000a] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            )}

            <p className="text-[11px] text-[#7E766B] mt-4 text-center">
              Cryptographic tokens rotate every 10s. Point directly at the QR code.
            </p>
          </div>
        )}
      </div>

      {/* Manual Code Fallback */}
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
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste raw attendance token or JWT..."
            className="flex-1 py-2.5 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8]/80 text-xs text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
          />
          <button
            type="submit"
            disabled={status === 'scanning' || !manualToken}
            className="py-2.5 px-4 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold transition disabled:opacity-50 shrink-0"
          >
            {status === 'scanning' ? 'Verifying...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
