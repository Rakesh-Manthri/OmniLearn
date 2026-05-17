'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, Play, Square,
  ShieldCheck, BrainCircuit, Heart, MessageSquareCode, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VoiceMessage {
  role: 'user' | 'model';
  text: string;
}

export default function VoiceCoachPage() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [hasWebGPU, setHasWebGPU] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [history, setHistory] = useState<VoiceMessage[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support on mount
  useEffect(() => {
    // 1. Web Speech API check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setIsSpeaking(false);
        setIsThinking(false);
      };

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      rec.onerror = (event: any) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        // Process transcript if it has contents
        if (transcript.trim()) {
          handleSendVoiceMessage(transcript);
        }
      };

      recognitionRef.current = rec;
    }

    // 2. WebGPU Check
    if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
      setHasWebGPU(true);
    }

    // 3. Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
    }

    return () => {
      stopSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Stop current active text-to-speech audio
  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Speak response out loud
  const speakText = (text: string) => {
    if (!ttsEnabled || !speechSynthRef.current) return;
    stopSpeaking();

    // Remove asterisks or Markdown markers from TTS for cleaner audio reading
    const cleanText = text.replace(/[*_#`\-]/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // slightly faster natural rate
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    activeUtteranceRef.current = utterance;
    speechSynthRef.current.speak(utterance);
  };

  // Listen Mic click
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    stopSpeaking();

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start issue:', e);
      }
    }
  };

  // Process user input voice transcript
  const handleSendVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim()) return;

    const userMsg: VoiceMessage = { role: 'user', text: voiceText };
    const currentHistory = [...history, userMsg];
    setHistory(currentHistory);
    setTranscript('');
    setIsThinking(true);

    try {
      // Send transcript to Socratic Tutor Chat API
      const res = await api.chatTutor(
        'Voice Coach Session',
        'Oral Concept Practice',
        voiceText,
        [],
        user?.id || undefined,
        undefined
      );

      const reply = res.response || 'Let us explore that further together.';
      setIsThinking(false);
      
      setHistory(prev => [...prev, { role: 'model', text: reply }]);
      speakText(reply);
    } catch (err) {
      console.error(err);
      setIsThinking(false);
      const errReply = 'Forgive me, my vector backend connection faltered.';
      setHistory(prev => [...prev, { role: 'model', text: errReply }]);
      speakText(errReply);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center animate-fade-in p-6 bg-gradient-to-b from-background via-background/95 to-secondary/15">
      <div className="max-w-3xl w-full flex flex-col items-center">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
            AI Voice Coach Room <Sparkles size={20} className="text-primary animate-pulse" />
          </h2>
          <p className="text-muted-foreground mt-1.5 max-w-md mx-auto">
            Train your concepts orally. Gemma listens in real-time and speaks back vocally with Socratic feedback.
          </p>
        </div>

        {/* Support Grid Banner */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <Card className="border-border/30 bg-card/45 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className={isSupported ? 'text-emerald-400' : 'text-red-400'} size={24} />
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Web Speech API</span>
              <span className="text-sm font-semibold text-foreground">{isSupported ? 'Operational' : 'Unsupported'}</span>
            </div>
          </Card>

          <Card className="border-border/30 bg-card/45 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
            <BrainCircuit className={hasWebGPU ? 'text-primary' : 'text-muted-foreground/60'} size={24} />
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">WebGPU Hardware</span>
              <span className="text-sm font-semibold text-foreground">{hasWebGPU ? 'Accelerated' : 'Offline / Standard'}</span>
            </div>
          </Card>
        </div>

        {/* Central Orb Workspace */}
        <Card className="w-full border-border/40 bg-card/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          
          {/* Custom animated Voice Orb */}
          <div className="relative h-64 w-64 flex items-center justify-center mb-6">
            
            {/* Visual pulse rings */}
            <div className={`absolute inset-0 rounded-full border border-primary/20 transition-all duration-1000 ${
              isListening ? 'scale-[1.1] opacity-75 animate-ping' : 'scale-100'
            }`} />
            <div className={`absolute inset-4 rounded-full border border-accent/20 transition-all duration-700 ${
              isSpeaking ? 'scale-[1.08] opacity-50 animate-pulse' : 'scale-100'
            }`} />

            {/* Core glowing Orb */}
            <div
              onClick={toggleListening}
              className={`h-40 w-40 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl relative z-10 ${
                isListening
                  ? 'bg-gradient-to-br from-red-500 to-amber-500 scale-[1.05] shadow-red-500/20'
                  : isSpeaking
                  ? 'bg-gradient-to-br from-emerald-500 to-sky-500 scale-[1.02] shadow-emerald-500/20'
                  : isThinking
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse'
                  : 'bg-gradient-to-br from-primary to-accent shadow-primary/25 hover:scale-[1.03]'
              }`}
            >
              {isListening ? (
                <MicOff size={44} className="text-white" />
              ) : (
                <Mic size={44} className="text-white" />
              )}
              
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-2">
                {isListening ? 'Listening' : isSpeaking ? 'Speaking' : isThinking ? 'Thinking' : 'Tap to talk'}
              </span>
            </div>

          </div>

          {/* Interactive Speech Status Readout */}
          <div className="min-h-[50px] px-6 max-w-lg mb-6">
            {transcript ? (
              <p className="text-lg font-medium text-foreground leading-relaxed italic animate-pulse">
                "{transcript}"
              </p>
            ) : isListening ? (
              <p className="text-muted-foreground text-sm">Go ahead, speak to Gemma... ask questions or explain a concept.</p>
            ) : isSpeaking ? (
              <p className="text-primary text-sm font-semibold flex items-center gap-1.5 justify-center">
                <Volume2 size={16} className="animate-bounce" /> Speaking Socratic Lesson
              </p>
            ) : isThinking ? (
              <p className="text-muted-foreground text-sm animate-pulse">Gemma is analyzing concept nodes...</p>
            ) : (
              <p className="text-muted-foreground text-sm">Orally explain quantum physics, coding, or history. Learn by talking!</p>
            )}
          </div>

          {/* TTS Audio Toggle Controls */}
          <div className="flex gap-4 border-t border-border/30 pt-6 w-full justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="rounded-xl px-4 py-2 border-border/50 text-muted-foreground hover:text-foreground"
            >
              {ttsEnabled ? (
                <><Volume2 size={16} className="mr-1.5 text-primary" /> Vocal Replies Enabled</>
              ) : (
                <><VolumeX size={16} className="mr-1.5 text-muted-foreground" /> Vocal Replies Muted</>
              )}
            </Button>

            {isSpeaking && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopSpeaking}
                className="rounded-xl px-4 py-2 border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/30"
              >
                <Square size={14} className="mr-1.5" /> Stop Audio
              </Button>
            )}
          </div>

        </Card>

        {/* Audio Chat Timeline Log */}
        {history.length > 0 && (
          <Card className="w-full border-border/40 bg-card/40 backdrop-blur-md rounded-3xl p-6 shadow-lg">
            <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-1.5">
              <MessageSquareCode size={16} className="text-primary" /> Session Transcript Log
            </h4>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {history.map((h, idx) => (
                <div
                  key={idx}
                  className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    h.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-secondary/60 text-foreground border border-border/40'
                  }`}>
                    {h.text}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
