'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Compass,
  ArrowRight,
  QrCode,
  Calendar,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Building,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface dark:bg-[#18191C] text-on-surface dark:text-[#E8EAED] selection:bg-secondary-container dark:selection:bg-[#3C5A8A] font-sans antialiased transition-colors duration-300">
      
      {/* 1. MINIMAL FROSTED TOP NAVIGATION */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 dark:bg-[#18191C]/80 backdrop-blur-xl border-b border-outline-variant/40 dark:border-white/10 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 sm:h-20 w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          
          {/* Logo & Institute Mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary-container dark:bg-[#6C5939] text-on-primary-container dark:text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-on-primary-container dark:text-white animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-on-surface dark:text-[#E8EAED] tracking-tight">ClassRadar</span>
              <span className="text-[10px] uppercase text-secondary dark:text-slate-400 tracking-widest font-medium">NIE North Campus</span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant dark:text-slate-300">
            <a href="#features" className="hover:text-primary dark:hover:text-[#FDD663] transition-colors">Features</a>
            <a href="#architecture" className="hover:text-primary dark:hover:text-[#FDD663] transition-colors">Anti-Proxy System</a>
            <a href="#rooms" className="hover:text-primary dark:hover:text-[#FDD663] transition-colors">Free Rooms</a>
          </nav>

          {/* Action CTAs & Theme Selector */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle className="scale-95" />

            {user ? (
              <Link
                href={user.role === 'STUDENT' ? '/student' : user.role === 'FACULTY' ? '/faculty' : '/admin'}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] text-xs sm:text-sm font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] text-xs sm:text-sm font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION WITH NIE NORTH CAMPUS LIQUID GLASS BACKGROUND */}
      <section className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-20 sm:pb-28 min-h-[90vh] flex flex-col justify-between">
        
        {/* Real Campus Photo Background Slot */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center scale-105 transform duration-1000"
            style={{ backgroundImage: `url('/nie-north-campus.jpg')` }}
          />
          {/* Subtle Scrim for Contrast & Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b1c19]/70 via-[#1b1c19]/45 to-surface dark:to-[#18191C]" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface dark:from-[#18191C] via-surface/80 dark:via-[#18191C]/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center text-center mt-6">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/80 dark:bg-black/60 backdrop-blur-md border border-outline-variant/30 dark:border-white/10 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-primary dark:bg-[#FDD663] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider text-on-surface dark:text-white uppercase">
              NIE NORTH CAMPUS · CSE-3F REAL-TIME ENGINE
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.12] max-w-4xl drop-shadow-md">
            The Intelligent System for Academic Attendance & Timetables.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-200 dark:text-slate-300 max-w-2xl mt-5 leading-relaxed drop-shadow">
            Effortless cryptographic rotating QR check-ins, automated attendance threshold radar, weekly section timetables, and live vacant room locator — unified in Sand & Titanium liquid glass.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] text-sm font-medium shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch ClassRadar Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-lowest/90 dark:bg-white/10 backdrop-blur-xl text-on-surface dark:text-white hover:bg-surface-container-lowest dark:hover:bg-white/20 border border-outline-variant/40 dark:border-white/15 text-sm font-medium transition-all"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Metric Strips (Liquid Glass Cards) */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-14 pt-4">
            
            <div className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">100%</span>
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                Anti-Proxy Security
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">5 sec</span>
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                Rotating QR Seeds
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">60+</span>
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                CSE-3F Real Batch
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest/85 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-primary dark:text-[#FDD663] mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xl sm:text-2xl font-semibold text-on-surface dark:text-white">Mon–Fri</span>
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary dark:text-slate-400 font-medium">
                Weekday Heatmap
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* 3. CORE THREE PILLARS (LIQUID GLASS BENTO CARDS) */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
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
          <div className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group">
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
          <div className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group">
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
          <div id="rooms" className="rounded-3xl bg-surface-container-low dark:bg-white/[0.04] p-6 sm:p-8 border border-outline-variant/40 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between group">
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

      {/* 4. CALL TO ACTION & LOGIN BANNER */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <div className="rounded-3xl bg-surface-container-high dark:bg-white/[0.05] border border-outline-variant/40 dark:border-white/10 p-8 sm:p-12 text-center flex flex-col items-center">
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

      {/* 5. MINIMAL FOOTER */}
      <footer className="border-t border-outline-variant/40 dark:border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-secondary dark:text-slate-500">
        <p>© 2026 ClassRadar • The National Institute of Engineering, North Campus. All rights reserved.</p>
      </footer>

    </div>
  );
}
