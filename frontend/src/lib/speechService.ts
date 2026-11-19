// Robust Web Speech Recognition and Synthesis Wrapper for ClassRadar

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechService {
  private static recognitionInstance: any = null;
  private static isMuted: boolean = false;
  private static lastTranscript: string = '';
  private static isUserIntentionallyListening: boolean = false;
  private static silenceTimer: any = null;
  private static readonly SILENCE_DURATION_MS: number = 4000; // 4 seconds break to submit

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return !!(
      win.SpeechRecognition ||
      win.webkitSpeechRecognition ||
      win.mozSpeechRecognition ||
      win.msSpeechRecognition
    );
  }

  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static setMuted(muted: boolean): void {
    SpeechService.isMuted = muted;
    if (muted) {
      SpeechService.stopSpeaking();
    }
  }

  public static getMuted(): boolean {
    return SpeechService.isMuted;
  }

  public static async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    if (!SpeechService.isRecognitionSupported()) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    // Stop ongoing speech & clear previous timers
    SpeechService.stopSpeaking();
    SpeechService.clearSilenceTimer();
    SpeechService.isUserIntentionallyListening = true;
    SpeechService.lastTranscript = '';

    return SpeechService.initRecognition(callbacks);
  }

  private static clearSilenceTimer(): void {
    if (SpeechService.silenceTimer) {
      clearTimeout(SpeechService.silenceTimer);
      SpeechService.silenceTimer = null;
    }
  }

  private static restartSilenceTimer(callbacks: SpeechRecognitionCallbacks): void {
    SpeechService.clearSilenceTimer();
    // Wait for a 4-second break before finalizing and submitting
    SpeechService.silenceTimer = setTimeout(() => {
      if (SpeechService.isUserIntentionallyListening && SpeechService.lastTranscript.trim()) {
        const textToSubmit = SpeechService.lastTranscript.trim();
        SpeechService.stopListening();
        callbacks.onResult?.(textToSubmit, true);
      }
    }, SpeechService.SILENCE_DURATION_MS);
  }

  private static initRecognition(callbacks: SpeechRecognitionCallbacks): boolean {
    try {
      if (SpeechService.recognitionInstance) {
        try {
          SpeechService.recognitionInstance.abort();
        } catch {
          // ignore
        }
        SpeechService.recognitionInstance = null;
      }

      const win = window as any;
      const SpeechRecognitionClass =
        win.SpeechRecognition ||
        win.webkitSpeechRecognition ||
        win.mozSpeechRecognition ||
        win.msSpeechRecognition;

      const recognition = new SpeechRecognitionClass();

      // Continuous mode keeps the microphone listening continuously until user takes a 4-sec break
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        callbacks.onStart?.();
        // Start silence timer when recognition starts
        SpeechService.restartSilenceTimer(callbacks);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const currentCandidate = (finalTranscript + interimTranscript).trim();
        if (currentCandidate) {
          SpeechService.lastTranscript = currentCandidate;
          // Deliver live candidate (isFinal = false so UI updates live without auto-submitting)
          callbacks.onResult?.(currentCandidate, false);
          // User spoke! Reset the 4-second break timer
          SpeechService.restartSilenceTimer(callbacks);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        console.warn('SpeechRecognition error:', errType);

        if (errType === 'no-speech' || errType === 'aborted') {
          // Normal background pause or manual stop; do not abort user session
          return;
        }

        if (errType === 'not-allowed') {
          SpeechService.clearSilenceTimer();
          callbacks.onError?.('Microphone access was blocked. Please allow microphone permission in your browser address bar.');
          return;
        }

        if (errType === 'audio-capture') {
          SpeechService.clearSilenceTimer();
          callbacks.onError?.('No working microphone found on your device.');
          return;
        }

        if (errType === 'network') {
          // If network glitch occurs but we have captured words, don't crash
          return;
        }
      };

      recognition.onend = () => {
        // If the browser closed recognition automatically but user is still in listening mode,
        // seamlessly revive it unless the 4-second silence timer already decided to submit
        if (SpeechService.isUserIntentionallyListening) {
          try {
            recognition.start();
            return;
          } catch {
            // If restart failed, fallback to submitting if transcript exists
            if (SpeechService.lastTranscript.trim()) {
              callbacks.onResult?.(SpeechService.lastTranscript.trim(), true);
            }
          }
        }
        SpeechService.clearSilenceTimer();
        callbacks.onEnd?.();
      };

      SpeechService.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      console.error('Speech recognition initialization error:', err);
      callbacks.onError?.('Failed to activate voice recognition.');
      return false;
    }
  }

  public static stopListening(): void {
    SpeechService.isUserIntentionallyListening = false;
    SpeechService.clearSilenceTimer();
    if (SpeechService.recognitionInstance) {
      try {
        SpeechService.recognitionInstance.abort();
      } catch {
        // ignore
      }
      SpeechService.recognitionInstance = null;
    }
  }

  public static speak(text: string, onEnd?: () => void): void {
    if (SpeechService.isMuted || !SpeechService.isSynthesisSupported()) {
      onEnd?.();
      return;
    }

    try {
      SpeechService.stopSpeaking();

      // Clean speech text
      const cleanText = text
        .replace(/[*_#`[\]()]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick natural sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.lang.startsWith('en')) &&
          !v.name.includes('Zira')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  public static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}
