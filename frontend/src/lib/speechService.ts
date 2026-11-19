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
  private static retryCount: number = 0;
  private static maxRetries: number = 2;
  private static isUserIntentionallyListening: boolean = false;

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

    // Stop ongoing operations
    SpeechService.stopSpeaking();
    SpeechService.isUserIntentionallyListening = true;
    SpeechService.retryCount = 0;
    SpeechService.lastTranscript = '';

    return SpeechService.initRecognition(callbacks);
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

      // continuous = true prevents immediate cut-off while user thinks or speaks slowly
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      // Use generic en-US or navigator language
      recognition.lang = 'en-US';

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
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const candidate = (finalTranscript || interimTranscript).trim();
        if (candidate) {
          SpeechService.lastTranscript = candidate;
        }

        if (finalTranscript.trim()) {
          // Received completed phrase!
          callbacks.onResult?.(finalTranscript.trim(), true);
          SpeechService.stopListening();
        } else if (interimTranscript.trim()) {
          callbacks.onResult?.(interimTranscript.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        console.warn('SpeechRecognition error:', errType);

        if (errType === 'no-speech') {
          // If we had gathered some speech, deliver it!
          if (SpeechService.lastTranscript.trim()) {
            callbacks.onResult?.(SpeechService.lastTranscript.trim(), true);
            SpeechService.stopListening();
            return;
          }

          // If the browser simply timed out waiting for audio without receiving data yet,
          // automatically retry once if the user is still in listening state
          if (SpeechService.isUserIntentionallyListening && SpeechService.retryCount < SpeechService.maxRetries) {
            SpeechService.retryCount++;
            setTimeout(() => {
              if (SpeechService.isUserIntentionallyListening) {
                SpeechService.initRecognition(callbacks);
              }
            }, 250);
            return;
          }

          callbacks.onError?.('No voice input received. Check your system microphone settings or type your question below.');
          return;
        }

        if (errType === 'not-allowed') {
          callbacks.onError?.('Microphone access was blocked. Please click the icon in your address bar to allow microphone access.');
          return;
        }

        if (errType === 'audio-capture') {
          callbacks.onError?.('No working microphone found on your device.');
          return;
        }

        if (errType === 'aborted') {
          // 'aborted' occurs normally when recognition is stopped or when sending a query.
          // Do not treat as an error.
          return;
        }

        if (errType === 'network') {
          callbacks.onError?.('Speech recognition network error. Please verify your internet connection.');
          return;
        }

        callbacks.onError?.(`Speech recognition error: ${errType}`);
      };

      recognition.onend = () => {
        // If recognition closed and we have an unfinalized transcript
        if (SpeechService.isUserIntentionallyListening && SpeechService.lastTranscript.trim()) {
          callbacks.onResult?.(SpeechService.lastTranscript.trim(), true);
          SpeechService.stopListening();
        } else if (SpeechService.isUserIntentionallyListening && SpeechService.retryCount < SpeechService.maxRetries) {
          SpeechService.retryCount++;
          setTimeout(() => {
            if (SpeechService.isUserIntentionallyListening) {
              SpeechService.initRecognition(callbacks);
            }
          }, 250);
        } else {
          SpeechService.isUserIntentionallyListening = false;
          callbacks.onEnd?.();
        }
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
