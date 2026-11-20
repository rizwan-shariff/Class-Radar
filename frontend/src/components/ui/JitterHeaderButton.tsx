'use client';

import React from 'react';
import Link from 'next/link';

interface JitterHeaderButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  className?: string;
  title?: string;
}

/**
 * Jitter-inspired Micro-Interactive Header Button
 * Features:
 * - Specular liquid-glass diagonal shimmer sweep on hover
 * - Elastic spring physics (scale-96 on press, 1.04 on hover with cubic-bezier spring)
 * - Directional icon kinetic kick on hover
 * - Ambient backdrop blur + border glow
 */
export function JitterHeaderButton({
  href,
  onClick,
  children,
  icon,
  variant = 'primary',
  className = '',
  title,
}: JitterHeaderButtonProps) {
  const baseStyles =
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-medium text-xs sm:text-sm select-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm hover:shadow-md';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles =
      'bg-primary text-on-primary hover:bg-primary-container dark:hover:bg-[#86724f] px-4 py-2 sm:px-5 sm:py-2.5 shadow-[0_2px_10px_rgba(108,89,57,0.25)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-primary/20 dark:border-white/10';
  } else if (variant === 'ghost') {
    variantStyles =
      'bg-surface-container-lowest/90 dark:bg-white/10 backdrop-blur-xl text-on-surface dark:text-white hover:bg-surface-container-lowest dark:hover:bg-white/20 border border-outline-variant/40 dark:border-white/15 px-3.5 py-1.5 sm:px-4 sm:py-2';
  } else if (variant === 'danger') {
    variantStyles =
      'bg-[#FFDAD6]/30 dark:bg-[#BA1A1A]/20 text-[#BA1A1A] dark:text-[#FFB4AB] hover:bg-[#FFDAD6]/60 dark:hover:bg-[#BA1A1A]/35 border border-[#BA1A1A]/20 px-3 py-1.5';
  }

  const content = (
    <>
      {/* Jitter Shimmer Specular Light Beam (sweeps diagonally across the button) */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

      {/* Button Text */}
      <span className="relative z-10 font-semibold tracking-tight">{children}</span>

      {/* Jitter Kinetic Icon with Directional Spring Kick */}
      {icon && (
        <span className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5 group-active:translate-x-0">
          {icon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${variantStyles} ${className}`} title={title}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      title={title}
    >
      {content}
    </button>
  );
}

