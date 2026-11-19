'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, QrCode } from 'lucide-react';

interface JitterActionSlotButtonProps {
  href: string;
  isCancelled?: boolean;
}

/**
 * Jitter "Split Action / Verify Pulse" Interactive Button
 * Inspired by Jitter Button Templates (Split State & Specular Beacon)
 * Features:
 * - Frosted pill container with spring hover expansion
 * - QR Radar beacon indicator that pulses continuously
 * - Smooth kinetic icon slide & arrow kick on hover
 * - Diagonal specular sheen sweep across the button
 */
export function JitterActionSlotButton({ href, isCancelled = false }: JitterActionSlotButtonProps) {
  if (isCancelled) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-2xl bg-surface-container/60 text-secondary/60 text-xs font-semibold cursor-not-allowed select-none border border-outline-variant/30"
      >
        Class Inactive
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#6C5939] dark:bg-[#86724f] text-white text-xs font-bold overflow-hidden shadow-[0_3px_12px_rgba(108,89,57,0.22)] dark:shadow-[0_3px_14px_rgba(0,0,0,0.4)] border border-white/20 select-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 hover:shadow-lg"
    >
      {/* Jitter Diagonal Specular Light Beam */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

      {/* Mini Radar / Beacon Icon */}
      <span className="relative flex items-center justify-center w-5 h-5 rounded-lg bg-white/15 backdrop-blur-md group-hover:bg-white/25 transition-colors">
        <QrCode className="w-3 h-3 text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
      </span>

      {/* Button Label */}
      <span className="relative z-10 font-bold tracking-tight">Scan & Verify</span>

      {/* Kinetic Arrow Slide on Hover */}
      <ArrowRight className="relative z-10 w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1" />
    </Link>
  );
}

