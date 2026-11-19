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

  public static async requestMicPermission(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream immediately once granted
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err: any) {
        console.warn('Microphone permission request failed:', err);
        return false;
      }
    }
    return true;
  }

  public static async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    if (!SpeechService.isRecognitionSupported()) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    // Stop previous sessions & speech synthesis
    SpeechService.stopListening();
    SpeechService.stopSpeaking();
    SpeechService.lastTranscript = '';

    // Proactively check/request mic access
    const permGranted = await SpeechService.requestMicPermission();
    if (!permGranted) {
      callbacks.onError?.('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      return false;
    }

    try {
      const win = window as any;
      const SpeechRecognitionClass =
        win.SpeechRecognition ||
        win.webkitSpeechRecognition ||
        win.mozSpeechRecognition ||
        win.msSpeechRecognition;

      const recognition = new SpeechRecognitionClass();

      // Continuous = false allows mobile and desktop to cleanly emit final results
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

      recognition.onstart = () => {
        callbacks.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const candidate = (finalTranscript || interimTranscript).trim();
        if (candidate) {
          SpeechService.lastTranscript = candidate;
        }

        callbacks.onResult?.(candidate, !!finalTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          // If we had recorded some transcript before the silence timeout, treat as end instead of error
          if (SpeechService.lastTranscript) {
            callbacks.onResult?.(SpeechService.lastTranscript, true);
            return;
          }
          callbacks.onError?.('No speech was detected. Please try speaking closer to the microphone.');
          return;
        }

        if (event.error === 'not-allowed') {
          callbacks.onError?.('Microphone access blocked. Click the lock/tune icon in your browser URL bar to allow microphone.');
          return;
        }

        if (event.error === 'audio-capture') {
          callbacks.onError?.('No microphone input detected. Please ensure your microphone is plugged in.');
          return;
        }

        if (event.error === 'network') {
          callbacks.onError?.('Speech recognition network error. Please check your internet connection.');
          return;
        }

        callbacks.onError?.(`Speech recognition error (${event.error}).`);
      };

      recognition.onend = () => {
        // If recognition ended and we have a transcript that hasn't fired final result yet
        if (SpeechService.lastTranscript) {
          callbacks.onResult?.(SpeechService.lastTranscript, true);
        }
        SpeechService.recognitionInstance = null;
        callbacks.onEnd?.();
      };

      SpeechService.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      callbacks.onError?.(err?.message || 'Failed to start speech recognition.');
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
