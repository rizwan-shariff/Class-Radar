'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SpeechService } from '@/lib/speechService';
import { RoleIntentHandler, ChatMessage } from '@/lib/roleIntentHandler';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  Radio,
  Minimize2,
  Maximize2
} from 'lucide-react';

export function ChatbotWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check speech recognition support once on mount
  useEffect(() => {
    setMicSupported(SpeechService.isRecognitionSupported());
    setIsMuted(SpeechService.getMuted());
  }, []);

  // Initialize welcome greeting based on active role
  useEffect(() => {
    if (!user) return;
    if (messages.length === 0 && !hasStarted) {
      setHasStarted(true);
      const roleName = user.role.toLowerCase();
      const initialGreeting: ChatMessage = {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `👋 Hi **${user.name.split(' ')[0]}**! I am your ClassRadar voice assistant for the **${roleName}** portal. You can speak to me or type your questions below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
    }
  }, [user, messages.length, hasStarted]);

  // Scroll to bottom when messages update or interim transcript changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, isOpen]);

  // Cancel speech synthesis if user closes widget or navigates away
  const handleClose = () => {
    SpeechService.stopSpeaking();
    SpeechService.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    setIsOpen(false);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    SpeechService.setMuted(nextMuted);
    if (nextMuted) {
      setIsSpeaking(false);
    }
  };

  const handleSendPrompt = async (text: string) => {
    if (!text.trim()) return;

    // Stop ongoing speech
    SpeechService.stopSpeaking();
    setIsSpeaking(false);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setInterimTranscript('');

    try {
      const result = await RoleIntentHandler.processPrompt(text, user, (route) => {
        router.push(route);
      });

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: result.displayText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: result.route
          ? {
              type: 'NAVIGATE',
              route: result.route,
              label: result.actionLabel || 'Go to page',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak aloud
      if (!isMuted && result.spokenText) {
        setIsSpeaking(true);
        SpeechService.speak(result.spokenText, () => {
          setIsSpeaking(false);
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      if (interimTranscript.trim()) {
        handleSendPrompt(interimTranscript);
      }
      return;
    }

    SpeechService.stopSpeaking();
    setIsSpeaking(false);

    const success = await SpeechService.startListening({
      onStart: () => {
        setIsListening(true);
        setInterimTranscript('');
      },
      onResult: (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal && transcript.trim()) {
          setIsListening(false);
          handleSendPrompt(transcript);
        }
      },
      onError: (errMsg) => {
        setIsListening(false);
        setInterimTranscript('');
        // Add helpful hint if mic blocked
        setMessages((prev) => [
          ...prev,
          {
            id: `err-mic-${Date.now()}`,
            sender: 'assistant',
            text: `⚠️ ${errMsg} You can type your request directly into the chat.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!success) {
      setIsListening(false);
    }
  };

  // Only render widget for authenticated sessions (outside login screen)
  if (!user || pathname === '/login') return null;

  // Role-specific quick chips
  const chips: Array<{ label: string; prompt: string }> = [];
  if (user.role === 'STUDENT') {
    chips.push(
      { label: '📅 Next Class', prompt: 'When is my next class?' },
      { label: '📊 Attendance', prompt: 'Check my attendance' },
      { label: '📷 Scan QR', prompt: 'Open QR scanner' },
      { label: '🔍 Free Rooms', prompt: 'Find free rooms' }
    );
  } else if (user.role === 'FACULTY') {
    chips.push(
      { label: '👨‍🏫 Next Lecture', prompt: 'When is my next lecture?' },
      { label: '📲 Start QR Session', prompt: 'Start attendance session' },
      { label: '📜 History', prompt: 'Attendance history' },
      { label: '🔍 Free Rooms', prompt: 'Find free rooms' }
    );
  } else if (user.role === 'ADMIN') {
    chips.push(
      { label: '📈 Analytics', prompt: 'Show analytics overview' },
      { label: '🛠️ Slot Editor', prompt: 'Open schedule management' },
      { label: '📬 Absences', prompt: 'Show faculty absences' },
      { label: '📂 Import CSV', prompt: 'Open timetable importer' }
    );
  }

  return (
    <>
      {/* ── Floating Launcher Button ───────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          aria-label="Open ClassRadar Voice AI Assistant"
          className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-50 group flex items-center gap-3 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-[#1B1C19] dark:bg-[#FCF9F4] text-white dark:text-[#1B1C19] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-[#6C5939]/20"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-[#E7DFD1] dark:text-[#6C5939] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="hidden sm:inline-block font-semibold text-sm tracking-tight">
            Voice Assistant
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 dark:bg-black/10 text-[#E7DFD1] dark:text-[#6C5939]">
            AI
          </span>
        </button>
      )}

      {/* ── Main Chatbot Window ────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[82vh] h-[600px] flex flex-col rounded-3xl bg-[#FCF9F4]/95 dark:bg-[#1C1D21]/95 backdrop-blur-2xl border border-[#CFC5B8]/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] transition-all animate-in fade-in slide-in-from-bottom-6 duration-300 overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#CFC5B8]/40 dark:border-white/10 bg-white/40 dark:bg-black/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] flex items-center justify-center text-white shadow-sm ring-2 ring-[#6C5939]/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1B1C19] dark:text-[#E8EAED] tracking-tight">
                    ClassRadar AI
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] dark:bg-white/10 text-[#6C5939] dark:text-[#D4AF37]">
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#7E766B] dark:text-white/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Voice & Navigation Active</span>
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute Voice Responses' : 'Mute Voice Responses'}
                aria-label={isMuted ? 'Unmute Voice Responses' : 'Mute Voice Responses'}
                className="p-2 rounded-xl text-[#7E766B] dark:text-white/60 hover:bg-[#EAE8E3] dark:hover:bg-white/10 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-[#6C5939] dark:text-[#D4AF37] animate-bounce' : ''}`} />
                )}
              </button>

              <button
                onClick={handleClose}
                aria-label="Close Assistant"
                className="p-2 rounded-xl text-[#7E766B] dark:text-white/60 hover:bg-[#EAE8E3] dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-4 py-2.5 border-b border-[#CFC5B8]/30 dark:border-white/5 bg-white/20 dark:bg-black/10 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(chip.prompt)}
                className="text-[11px] font-semibold tracking-tight whitespace-nowrap px-3 py-1.5 rounded-full bg-[#EAE8E3] dark:bg-white/5 hover:bg-[#E7DFD1] dark:hover:bg-white/10 text-[#1B1C19] dark:text-[#E8EAED] border border-[#CFC5B8]/40 dark:border-white/10 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-[#6C5939]/10 dark:bg-white/10 flex items-center justify-center text-[#6C5939] dark:text-[#D4AF37] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1B1C19] dark:bg-[#FCF9F4] text-white dark:text-[#1B1C19] rounded-br-xs'
                      : 'bg-white/80 dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED] border border-[#CFC5B8]/40 dark:border-white/10 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Navigation Call-to-Action Link */}
                  {msg.action && msg.action.route && (
                    <div className="mt-2.5 pt-2 border-t border-[#CFC5B8]/30 dark:border-white/10 flex justify-end">
                      <button
                        onClick={() => router.push(msg.action!.route!)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6C5939] dark:text-[#D4AF37] hover:underline"
                      >
                        <span>{msg.action.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right font-medium opacity-60 ${
                      msg.sender === 'user' ? 'text-white/70 dark:text-black/70' : 'text-[#7E766B] dark:text-white/40'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Interim Speech Transcription Bubble */}
            {isListening && (
              <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-xl bg-[#6C5939]/10 dark:bg-white/10 flex items-center justify-center text-[#6C5939] dark:text-[#D4AF37] shrink-0">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
                </div>
                <div className="max-w-[82%] px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-[#25262B]/80 text-[#7E766B] dark:text-white/70 text-xs italic border border-dashed border-[#6C5939]/40">
                  {interimTranscript ? (
                    <span>"{interimTranscript}"</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Listening... Speak your command
                    </span>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Speaking Indicator Status Bar */}
          {isSpeaking && (
            <div className="px-4 py-1.5 bg-[#6C5939]/10 dark:bg-white/5 border-t border-[#CFC5B8]/30 dark:border-white/5 flex items-center justify-between text-[11px] text-[#6C5939] dark:text-[#D4AF37]">
              <div className="flex items-center gap-2 font-medium">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Speaking response aloud...</span>
              </div>
              <button
                onClick={() => {
                  SpeechService.stopSpeaking();
                  setIsSpeaking(false);
                }}
                className="text-[10px] font-bold uppercase underline hover:opacity-80"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input & Microphone Bar */}
          <div className="p-3 bg-white/60 dark:bg-[#1C1D21]/90 border-t border-[#CFC5B8]/40 dark:border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputText);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to your voice...'
                      : `Ask anything about ${user.role.toLowerCase()} portal...`
                  }
                  className="w-full bg-[#EAE8E3]/70 dark:bg-white/5 border border-[#CFC5B8]/40 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1B1C19] dark:text-[#E8EAED] placeholder-[#7E766B] dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 transition-all"
                />
              </div>

              {/* Microphone Button with Pulsing Wave Indicator */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={!micSupported}
                title={
                  !micSupported
                    ? 'Voice recognition not supported in this browser'
                    : isListening
                    ? 'Stop listening'
                    : 'Start speaking (Voice command)'
                }
                className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                    : micSupported
                    ? 'bg-[#EAE8E3] dark:bg-white/10 text-[#1B1C19] dark:text-white hover:bg-[#E7DFD1] active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="absolute inset-0 rounded-2xl border-2 border-red-500 animate-ping opacity-75" />
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                aria-label="Send Message"
                className={`p-2.5 rounded-2xl transition-all ${
                  inputText.trim()
                    ? 'bg-[#6C5939] text-white hover:bg-[#86724F] shadow-sm active:scale-95'
                    : 'bg-[#EAE8E3]/60 dark:bg-white/5 text-[#7E766B]/50 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
