'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { JitterHeaderButton } from '@/components/ui/JitterHeaderButton';
import { useLandingIntro, useScrollReveal, useAnimeCounter } from '@/lib/useAnime';
import {
  Compass,
  ArrowRight,
  QrCode,
  Calendar,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap
} from 'lucide-react';

const HEADLINE_WORDS = [
  'The',
  'Intelligent',
  'System',
  'for',
  'Academic',
  'Attendance',
  '&',
  'Timetables.',
];

export default function LandingPage() {
  const { user } = useAuth();
  const heroRef = useLandingIntro();
  const scrollRef = useScrollReveal();

  const countSecurity = useAnimeCounter(100, '%', 1100);
  const countSeconds = useAnimeCounter(5, ' sec', 900);
  const countBatch = useAnimeCounter(64, '+', 1200);

  return (
    <div
      ref={scrollRef}
      className="min-h-screen bg-surface dark:bg-[#18191C] text-on-surface dark:text-[#E8EAED] selection:bg-secondary-container dark:selection:bg-[#3C5A8A] font-sans antialiased transition-colors duration-300"
    >
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              [data-intro], [data-reveal] {
                opacity: 1 !important;
                transform: none !important;
                clip-path: none !important;
                filter: none !important;
              }
            `,
          }}
        />
      </noscript>

      {/* WRAPPER FOR INTRO HERO ANIMATION */}
      <div ref={heroRef} className="relative w-full">
        {/* 1. MINIMAL FROSTED TOP NAVIGATION */}
        <header className="fixed top-0 left-0 w-full z-50 bg-[#FCF9F4]/95 dark:bg-[#18191C]/95 backdrop-blur-2xl border-b border-[#CFC5B8]/60 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors">
          <div className="h-16 sm:h-20 w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
            {/* Logo & Institute Mark */}
            <Link
              href="/"
              data-intro="header-logo"
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#6C5939] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ring-2 ring-[#6C5939]/20">
                <Compass className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[#1B1C19] dark:text-[#E8EAED] tracking-tight group-hover:text-[#6C5939] transition-colors">
                  ClassRadar
                </span>
                <span className="text-[10px] uppercase text-[#635E53] dark:text-slate-400 tracking-widest font-bold">
                  NIE North Campus
                </span>
              </div>
            </Link>

            {/* Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#4C463C] dark:text-slate-300">
              <a
                href="#features"
                data-intro="header-link"
                className="hover:text-[#1B1C19] dark:hover:text-[#FDD663] transition-colors"
              >
                Features
              </a>
              <a
                href="#architecture"
                data-intro="header-link"
                className="hover:text-[#1B1C19] dark:hover:text-[#FDD663] transition-colors"
              >
                Anti-Proxy System
              </a>
              <a
                href="#rooms"
                data-intro="header-link"
                className="hover:text-[#1B1C19] dark:hover:text-[#FDD663] transition-colors"
              >
                Free Rooms
              </a>
            </nav>

            {/* Action CTAs & Theme Selector */}
            <div data-intro="header-action" className="flex items-center gap-3">
              <ThemeToggle className="scale-95" />

              {user ? (
                <JitterHeaderButton
                  href={
                    user.role === 'STUDENT'
                      ? '/student'
                      : user.role === 'FACULTY'
                      ? '/faculty'
                      : '/admin'
                  }
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Dashboard
                </JitterHeaderButton>
              ) : (
                <JitterHeaderButton
                  href="/login"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Sign In
                </JitterHeaderButton>
              )}
            </div>
          </div>
        </header>

        {/* 2. HERO SECTION WITH CINEMATIC NIE SIGN REVEAL */}
        <section className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-20 sm:pb-28 min-h-[90vh] flex flex-col justify-between">
          {/* Real Campus Photo Background & Cinematic Focal Point */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
            <div
              data-intro="hero-bg"
              className="absolute inset-0 w-full h-full bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url('/nie-north-campus.jpg')`,
                backgroundPosition: '50% 30%',
              }}
            />

            {/* Wave 0 Spotlight Glow over NIE sign anchor */}
            <div
              data-intro="sign-glow"
              className="absolute pointer-events-none rounded-full blur-xl bg-amber-200/40 opacity-0"
              style={{
                left: '51%',
                top: '31%',
                width: '180px',
                height: '80px',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Desktop Scan Line Sweeps across the sign */}
            <div
              data-intro="scanline"
              className="hidden sm:block absolute h-[2px] w-48 bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none opacity-0"
              style={{
                left: '44%',
                top: '30%',
              }}
            />
            <div
              data-intro="scanline"
              className="hidden sm:block absolute h-[2px] w-64 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0"
              style={{
                left: '46%',
                top: '32%',
              }}
            />

            {/* Scrim Overlays */}
            <div
              data-intro="hero-scrim"
              className="absolute inset-0 bg-gradient-to-b from-[#1b1c19]/75 via-[#1b1c19]/50 to-surface dark:to-[#18191C]"
            />
            <div
              data-intro="hero-scrim"
              className="absolute inset-0 bg-gradient-to-t from-surface dark:from-[#18191C] via-surface/85 dark:via-[#18191C]/85 to-transparent"
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center text-center mt-6">
            {/* Pill Badge */}
            <div
              data-intro="hero-badge"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/80 dark:bg-black/60 backdrop-blur-md border border-outline-variant/30 dark:border-white/10 shadow-sm mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary dark:bg-[#FDD663] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wider text-on-surface dark:text-white uppercase">
                NIE NORTH CAMPUS · CSE-3F REAL-TIME ENGINE
              </span>
            </div>

            {/* Main Headline (Splitted words for Anime.js staggered reveal) */}
            <h1
              aria-label="The Intelligent System for Academic Attendance & Timetables."
              className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.12] max-w-4xl drop-shadow-md"
            >
              <span aria-hidden="true" className="inline-flex flex-wrap justify-center gap-x-2.5 sm:gap-x-3.5">
                {HEADLINE_WORDS.map((word, idx) => (
                  <span
                    key={idx}
                    data-intro="hero-word"
                    className="inline-block"
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              data-intro="hero-subtitle"
              className="text-base sm:text-lg text-slate-200 dark:text-slate-300 max-w-2xl mt-5 leading-relaxed drop-shadow"
            >
              Effortless cryptographic rotating QR check-ins, automated attendance threshold radar, weekly section timetables, and live vacant room locator — unified in Sand & Titanium liquid glass.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
              <Link
                href="/login"
                data-intro="hero-cta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] text-sm font-medium shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Launch ClassRadar Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#features"
                data-intro="hero-cta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-lowest/90 dark:bg-white/10 backdrop-blur-xl text-on-surface dark:text-white hover:bg-surface-container-lowest dark:hover:bg-white/20 border border-outline-variant/40 dark:border-white/15 text-sm font-medium transition-all"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Metric Strips (Liquid Glass Cards) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-14 pt-4">
              <div
                data-intro="hero-card"
                className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span ref={countSecurity} className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">
                    100%
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                  Anti-Proxy Security
                </span>
              </div>

              <div
                data-intro="hero-card"
                className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                  <Clock className="w-4 h-4" />
                  <span ref={countSeconds} className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">
                    5 sec
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                  Rotating QR Seeds
                </span>
              </div>

              <div
                data-intro="hero-card"
                className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                  <Users className="w-4 h-4" />
                  <span ref={countBatch} className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">
                    64+
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                  CSE-3F Real Batch
                </span>
              </div>

              <div
                data-intro="hero-card"
                className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">
                    Mon–Fri
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                  Weekday Heatmap
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. CORE THREE PILLARS (SCROLL REVEAL BENTO CARDS) */}
      <section
        id="features"
        data-reveal-group
        className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20"
      >
        <div data-reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary dark:text-[#FDD663] font-semibold mb-1 block">
              Architectural Refinement
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-on-surface dark:text-white">
              Purpose-Built for NIE Campus Life
            </h2>
          </div>
          <p className="text-sm text-secondary dark:text-slate-400 max-w-md">
            Replacing paper registries and WhatsApp timetable PDFs with a single, live academic dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Dynamic QR Check-in */}
          <div
            data-reveal
            className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest dark:bg-white/10 flex items-center justify-center text-primary dark:text-[#FDD663] mb-6 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                Anti-Proxy Rotating QR
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Faculty generate time-locked cryptographically rotating tokens refreshed every 5 seconds. Screenshot sharing and proxy attendance are strictly prevented.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 dark:border-white/10 flex items-center text-xs font-semibold text-primary dark:text-[#FDD663] gap-1.5">
              <span>Dynamic TOTP Security</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Live Weekly Schedule */}
          <div
            data-reveal
            className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest dark:bg-white/10 flex items-center justify-center text-primary dark:text-[#FDD663] mb-6 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                Class Schedule & Heatmaps
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Pre-configured for CSE-3F with all courses (DDCO, DSA, OS, Maths, Proctor, Python). Personal attendance percentage heatmaps exclude weekends for clean 5-day analytics.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 dark:border-white/10 flex items-center text-xs font-semibold text-primary dark:text-[#FDD663] gap-1.5">
              <span>Section Timetable Sync</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Free Room Finder */}
          <div
            id="rooms"
            data-reveal
            className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest dark:bg-white/10 flex items-center justify-center text-primary dark:text-[#FDD663] mb-6 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                Campus Free Room Radar
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Need an open classroom or laboratory for group discussions, coding practice, or peer study? Radar checks live schedule allocations to pinpoint vacant rooms across the building.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 dark:border-white/10 flex items-center text-xs font-semibold text-primary dark:text-[#FDD663] gap-1.5">
              <span>Real-Time Room Occupancy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION & LOGIN BANNER (SCROLL REVEAL) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <div
          data-reveal
          className="rounded-3xl bg-surface-container-high dark:bg-white/[0.05] border border-outline-variant/40 dark:border-white/10 p-8 sm:p-12 text-center flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-on-surface dark:text-white mb-3">
            Ready to access your dashboard?
          </h3>
          <p className="text-sm text-secondary dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            Sign in with your NIE institutional account (`@nie.ac.in`) or faculty credentials to access today&apos;s schedule and live attendance.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. MINIMAL FOOTER (SCROLL REVEAL) */}
      <footer
        data-reveal
        className="border-t border-outline-variant/40 dark:border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-secondary dark:text-slate-500"
      >
        <p>© 2026 ClassRadar • The National Institute of Engineering, North Campus. All rights reserved.</p>
      </footer>
    </div>
  );
}
