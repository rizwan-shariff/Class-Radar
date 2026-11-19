'use client';

import { useEffect, useRef } from 'react';
import { animate, createTimeline, stagger, utils } from 'animejs';

/**
 * Cinematic One-Time Intro Animation for the Landing Page
 * Storyboard:
 * Wave 0 — 0ms: Focus spotlight locked on NIE North Sign (51% 31%)
 * Wave 1 — 0-450ms: Sign wakes up (blur 14->0, brightness 0.4->1, scanline sweeps)
 * Wave 2 — 350-1100ms: Camera pull-back (circle radius 7%->85%, scale 2.2->1.05, scrims fade in)
 * Wave 3 — 300-900ms: Header elements slide down + fade (logo -> nav links -> actions)
 * Wave 4 — 750ms: Pill badge fades + scales in
 * Wave 5 — 850-1400ms: H1 reveals word-by-word with clip-path & translateY
 * Wave 6 — 1250ms: Subtitle fade-up 18px
 * Wave 7 — 1400ms: CTA buttons pop in
 * Wave 8 — 1500-2100ms: Four metric cards rise with stagger
 * Wave 9 — 2200ms+: Settle, remove will-change, badge keeps subtle breath
 */
export function useLandingIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const allIntro = root.querySelectorAll('[data-intro]');
      allIntro.forEach((el) => {
        utils.set(el, {
          opacity: 1,
          transform: 'none',
          clipPath: 'none',
          filter: 'none',
        });
      });
      return;
    }

    const isMobile = window.innerWidth < 640;
    const baseDuration = isMobile ? 550 : 700;

    const bgEl = root.querySelector<HTMLElement>('[data-intro="hero-bg"]');
    const glowEl = root.querySelector<HTMLElement>('[data-intro="sign-glow"]');
    const scanlines = root.querySelectorAll<HTMLElement>('[data-intro="scanline"]');
    const scrims = root.querySelectorAll<HTMLElement>('[data-intro="hero-scrim"]');
    const headerLogo = root.querySelector<HTMLElement>('[data-intro="header-logo"]');
    const headerLinks = root.querySelectorAll<HTMLElement>('[data-intro="header-link"]');
    const headerAction = root.querySelector<HTMLElement>('[data-intro="header-action"]');
    const heroBadge = root.querySelector<HTMLElement>('[data-intro="hero-badge"]');
    const heroWords = root.querySelectorAll<HTMLElement>('[data-intro="hero-word"]');
    const heroSubtitle = root.querySelector<HTMLElement>('[data-intro="hero-subtitle"]');
    const heroCtas = root.querySelectorAll<HTMLElement>('[data-intro="hero-cta"]');
    const heroCards = root.querySelectorAll<HTMLElement>('[data-intro="hero-card"]');

    const animatedElements = [
      bgEl,
      glowEl,
      ...Array.from(scanlines),
      ...Array.from(scrims),
      headerLogo,
      ...Array.from(headerLinks),
      headerAction,
      heroBadge,
      ...Array.from(heroWords),
      heroSubtitle,
      ...Array.from(heroCtas),
      ...Array.from(heroCards),
    ].filter((el): el is HTMLElement => Boolean(el));

    animatedElements.forEach((el) => {
      el.style.willChange = 'opacity, transform, clip-path, filter';
    });

    const tl = createTimeline({
      defaults: {
        ease: 'out(3)',
        duration: baseDuration,
      },
      onComplete: () => {
        animatedElements.forEach((el) => {
          el.style.willChange = 'auto';
        });
      },
    });

    // Wave 0 & 1: Sign Wakeup
    if (bgEl) {
      tl.add(
        bgEl,
        {
          filter: ['blur(14px) brightness(0.4)', 'blur(0px) brightness(1)'],
          duration: isMobile ? 350 : 450,
          ease: 'out(2)',
        },
        0
      );
    }

    if (glowEl) {
      tl.add(
        glowEl,
        {
          opacity: [0, 0.9, 0],
          scale: [0.8, 1.4],
          duration: 450,
          ease: 'out(2)',
        },
        0
      );
    }

    if (!isMobile && scanlines.length > 0) {
      tl.add(
        scanlines,
        {
          opacity: [0, 0.9, 0],
          translateX: ['-100%', '200%'],
          duration: 500,
          delay: stagger(100),
          ease: 'inOut(2)',
        },
        50
      );
    }

    // Wave 2: Camera pull-back
    if (bgEl) {
      tl.add(
        bgEl,
        {
          clipPath: ['circle(7% at 51% 31%)', 'circle(85% at 51% 31%)'],
          scale: [2.2, 1.05],
          duration: isMobile ? 650 : 850,
          ease: 'inOut(3)',
        },
        isMobile ? 250 : 350
      );
    }

    if (scrims.length > 0) {
      tl.add(
        scrims,
        {
          opacity: [0, 1],
          duration: isMobile ? 500 : 700,
          ease: 'out(2)',
        },
        isMobile ? 300 : 400
      );
    }

    // Wave 3: Header cascade
    const headerItems = [headerLogo, ...Array.from(headerLinks), headerAction].filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (headerItems.length > 0) {
      tl.add(
        headerItems,
        {
          opacity: [0, 1],
          translateY: [-16, 0],
          delay: stagger(isMobile ? 45 : 70),
          duration: isMobile ? 450 : 600,
          ease: 'out(3)',
        },
        isMobile ? 250 : 300
      );
    }

    // Wave 4: Hero Badge
    if (heroBadge) {
      tl.add(
        heroBadge,
        {
          opacity: [0, 1],
          scale: [0.92, 1],
          duration: isMobile ? 450 : 600,
          ease: 'out(3)',
        },
        isMobile ? 600 : 750
      );
    }

    // Wave 5: H1 Word-by-word reveal
    if (heroWords.length > 0) {
      tl.add(
        heroWords,
        {
          opacity: [0, 1],
          clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
          translateY: [isMobile ? 16 : 24, 0],
          delay: stagger(isMobile ? 35 : 55),
          duration: isMobile ? 450 : 600,
          ease: 'out(3)',
        },
        isMobile ? 700 : 850
      );
    }

    // Wave 6: Subtitle fade-up
    if (heroSubtitle) {
      tl.add(
        heroSubtitle,
        {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: isMobile ? 450 : 600,
          ease: 'out(3)',
        },
        isMobile ? 1000 : 1250
      );
    }

    // Wave 7: CTA Buttons
    if (heroCtas.length > 0) {
      tl.add(
        heroCtas,
        {
          opacity: [0, 1],
          scale: [0.94, 1],
          translateY: [14, 0],
          delay: stagger(isMobile ? 60 : 90),
          duration: isMobile ? 450 : 600,
          ease: 'out(3)',
        },
        isMobile ? 1150 : 1400
      );
    }

    // Wave 8: Metric glass cards
    if (heroCards.length > 0) {
      tl.add(
        heroCards,
        {
          opacity: [0, 1],
          translateY: [24, 0],
          scale: [0.96, 1],
          delay: stagger(isMobile ? 55 : 80),
          duration: isMobile ? 500 : 650,
          ease: 'out(3)',
        },
        isMobile ? 1250 : 1500
      );
    }

    return () => {
      tl.pause();
    };
  }, []);

  return containerRef;
}

/**
 * Scroll reveal hook using IntersectionObserver and Anime.js v4
 * Reveals below-the-fold sections once when scrolled into view
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const revealItems = container.querySelectorAll<HTMLElement>('[data-reveal]');
      revealItems.forEach((el) => {
        utils.set(el, { opacity: 1, transform: 'none' });
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targets = entry.target.hasAttribute('data-reveal')
              ? [entry.target as HTMLElement]
              : Array.from(entry.target.querySelectorAll<HTMLElement>('[data-reveal]'));

            if (targets.length > 0) {
              animate(targets, {
                opacity: [0, 1],
                translateY: [32, 0],
                delay: stagger(90),
                duration: 650,
                ease: 'out(3)',
              });
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const observeTargets = container.querySelectorAll<HTMLElement>('[data-reveal-group], [data-reveal]');
    observeTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}

/**
 * Animated counter that counts up smoothly using Anime.js v4
 */
export function useAnimeCounter(targetValue: number, suffix: string = '', duration = 1100) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!nodeRef.current) return;
    const targetObj = { val: 0 };

    animate(targetObj, {
      val: targetValue,
      round: 1,
      duration,
      ease: 'out(3)',
      onUpdate: () => {
        if (nodeRef.current) {
          nodeRef.current.innerText = `${targetObj.val}${suffix}`;
        }
      },
    });
  }, [targetValue, duration, suffix]);

  return nodeRef;
}
