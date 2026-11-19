// Web Speech Recognition and Synthesis Wrapper for ClassRadar

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechService {
  private static recognitionInstance: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isMuted: boolean = false;

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
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

  public static startListening(callbacks: SpeechRecognitionCallbacks): boolean {
    if (!SpeechService.isRecognitionSupported()) {
      callbacks.onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      SpeechService.stopListening();
      SpeechService.stopSpeaking();

      const win = window as any;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        callbacks.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        callbacks.onResult?.(transcript, !!finalTranscript);
      };

      recognition.onerror = (event: any) => {
        const errorMsg = event.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : event.error === 'no-speech'
          ? 'No speech detected.'
          : `Speech recognition error: ${event.error}`;
        callbacks.onError?.(errorMsg);
      };

      recognition.onend = () => {
        SpeechService.recognitionInstance = null;
        callbacks.onEnd?.();
      };

      SpeechService.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onError?.(err?.message || 'Failed to start speech recognition');
      return false;
    }
  }

  public static stopListening(): void {
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
    if (SpeechService.isMuted || !SpeechService.isSynthesisSupported() || !SpeechService.synth) {
      onEnd?.();
      return;
    }

    try {
      SpeechService.stopSpeaking();

      // Clean speech text (strip markdown symbols like *, #, `)
      const cleanText = text
        .replace(/[*_#`[\]()]/g, ' ')
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

      // Pick a clean natural sounding voice if available
      const voices = SpeechService.synth.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang === 'en-US') && !v.name.includes('Zira')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = () => {
        onEnd?.();
      };

      SpeechService.synth.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  public static stopSpeaking(): void {
    if (SpeechService.synth && typeof window !== 'undefined') {
      try {
        SpeechService.synth.cancel();
      } catch {
        // ignore
      }
    }
  }
}
