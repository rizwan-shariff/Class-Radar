'use client';

import React from 'react';

interface VoiceWaveformProps {
  isSpeaking: boolean;
  isListening: boolean;
}

/**
 * Animated dynamic waveform indicator for voice recognition and AI speech synthesis.
 * Transitions dynamically between:
 * - Idle: gentle harmonic breathing
 * - Listening: high-frequency reactive soundwave (Red alert pulse)
 * - Speaking: rhythmic audio equalizer bounce (Gold / Titanium tone)
 */
export function VoiceWaveform({ isSpeaking, isListening }: VoiceWaveformProps) {
  const bars = [
    { delay: '0ms', minH: '4px', speakH: '16px', listenH: '20px' },
    { delay: '120ms', minH: '8px', speakH: '24px', listenH: '14px' },
    { delay: '240ms', minH: '12px', speakH: '18px', listenH: '26px' },
    { delay: '80ms', minH: '6px', speakH: '22px', listenH: '16px' },
    { delay: '200ms', minH: '10px', speakH: '14px', listenH: '22px' },
  ];

  const stateClass = isListening
    ? 'bg-red-500'
    : isSpeaking
    ? 'bg-amber-400 dark:bg-[#D4AF37]'
    : 'bg-[#6C5939]/40 dark:bg-white/30';

  return (
    <div className="flex items-center gap-1 h-7 px-1.5 py-1">
      {bars.map((bar, idx) => (
        <span
          key={idx}
          className={`w-1 rounded-full transition-all duration-200 ${stateClass}`}
          style={{
            height: isListening
              ? bar.listenH
              : isSpeaking
              ? bar.speakH
              : bar.minH,
            animation: isListening || isSpeaking
              ? `waveformPulse 0.6s ease-in-out infinite alternate ${bar.delay}`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

