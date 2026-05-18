'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  ArrowRight, 
  BookOpen, 
  BrainCircuit, 
  Focus, 
  Zap, 
  ChevronRight, 
  Clock, 
  GraduationCap,
  Terminal,
  Layers,
  ShieldCheck,
  Globe2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SIMULATIONS = {
  quantum: {
    title: "Quantum Superposition",
    steps: [
      {
        speaker: "tutor",
        text: "Imagine you're holding a coin. In classical physics, it is either heads or tails. In quantum physics, before you look, in what state is the coin?"
      },
      {
        speaker: "choices",
        options: [
          { text: "It is in both heads and tails at the same time.", nextIndex: 2 },
          { text: "It is in neither state.", nextIndex: 3 }
        ]
      },
      {
        speaker: "tutor",
        text: "Spot on! That is superposition. Now, the moment you open your hand to look at the coin, what happens to this dual-state?"
      },
      {
        speaker: "tutor",
        text: "Actually, it is not empty! It exists as a mathematical blend of both possibilities until observed. But what happens once we look at it?"
      },
      {
        speaker: "choices",
        options: [
          { text: "It collapses into one single reality (heads or tails).", nextIndex: 4 },
          { text: "It stays in superposition forever.", nextIndex: 5 }
        ]
      },
      {
        speaker: "tutor",
        text: "Outstanding. You just defined Quantum Measurement Collapse. That is the core of quantum computational speed! Ready to generate your curriculum?"
      },
      {
        speaker: "tutor",
        text: "If it stayed in superposition, we could never extract a classical answer! In reality, observing it forces a collapse. Ready to begin your path?"
      }
    ]
  },
  ai: {
    title: "Neural Networks",
    steps: [
      {
        speaker: "tutor",
        text: "How do humans learn? Usually, we see an example, make a guess, get feedback, and adjust our thinking. How do you think a computer does this?"
      },
      {
        speaker: "choices",
        options: [
          { text: "By shifting mathematical weights based on error.", nextIndex: 2 },
          { text: "By memorizing every single possible image or text.", nextIndex: 3 }
        ]
      },
      {
        speaker: "tutor",
        text: "Exactly. That adjustment is called Backpropagation. But how does it know how much to adjust the weights?"
      },
      {
        speaker: "tutor",
        text: "Memorization fails when it sees something new! Instead, it adjusts mathematical weights to find general patterns. But how does it know how much to adjust?"
      },
      {
        speaker: "choices",
        options: [
          { text: "It measures the size of its mistake (the Loss Function).", nextIndex: 4 },
          { text: "It guesses a random value every time.", nextIndex: 5 }
        ]
      },
      {
        speaker: "tutor",
        text: "Perfect! By calculating the gradient of the loss, it slides down towards zero error. You are ready to start planning your AI syllabus!"
      },
      {
        speaker: "tutor",
        text: "Random guessing would take infinite time! It mathematically calculates the size of its mistake (Loss) to adjust precisely. Ready to begin?"
      }
    ]
  }
};

export default function LandingPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  
  const [showLogin, setShowLogin] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [activeTab, setActiveTab] = useState<'quantum' | 'ai'>('quantum');
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (document.documentElement.classList.contains('light-theme')) {
      setIsLightMode(true);
    }
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLightMode]);

  useEffect(() => {
    const sim = SIMULATIONS[activeTab];
    setHistory([sim.steps[0]]);
    setCurrentStep(0);
  }, [activeTab]);

  const handleChoice = (option: any) => {
    const sim = SIMULATIONS[activeTab];
    const nextIdx = option.nextIndex;
    
    const userMessage = { speaker: "user", text: option.text };
    const tutorNextMessage = sim.steps[nextIdx];
    
    setHistory(prev => [...prev, userMessage, tutorNextMessage]);
    
    const nextStepIndex = nextIdx + 1;
    if (nextStepIndex < sim.steps.length) {
      const immediateNext = sim.steps[nextStepIndex];
      if (immediateNext && immediateNext.speaker === "choices") {
        setTimeout(() => {
          setHistory(prev => [...prev, immediateNext]);
        }, 600);
      }
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return;
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) { alert(error.message); return; }
        alert('Signup successful! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) { alert(error.message); return; }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading || user) return null;

  return (
    <div className="relative min-h-screen bg-background text-foreground font-body transition-colors duration-500 overflow-x-hidden selection:bg-primary/30 antialiased selection:text-primary-foreground">
      
      {/* ── Background Mesh Blobs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent blur-[140px] dark:from-primary/20 animate-float" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-transparent blur-[140px] dark:bg-cyan-500/10" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>

      {/* ── Fixed Premium Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          <div className="flex items-center gap-3 font-heading text-xl font-bold tracking-tight group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-600 text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent font-extrabold tracking-wide text-2xl">
              OmniLearn
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/30 backdrop-blur-sm hover:border-primary/40 hover:bg-secondary/60 transition-all duration-300 shadow-sm text-foreground"
            >
              {isLightMode ? <Moon size={18} className="text-violet-500" /> : <Sun size={18} className="text-amber-400" />}
            </button>
            <Button 
              onClick={() => setShowLogin(true)}
              className="rounded-xl px-5 font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-violet-600 text-white border-0"
            >
              Initialize Workspace
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
        
        {/* ── Hero & Socratic Interactive Dialogue ── */}
        <section className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center py-8 lg:py-16 min-h-[80vh]">
          
          {/* Left Columns: Headline & Core Purpose */}
          <div className="lg:col-span-6 flex flex-col items-start text-left lg:pr-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm text-xs text-primary font-bold mb-6 tracking-wide shadow-inner"
            >
              <Zap size={13} className="text-amber-500 animate-pulse fill-amber-500" />
              <span>FUTURE OF EDUCATION • POWERED BY GEMMA 4</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight font-heading leading-[1.1] mb-6">
              Never be given<br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                an answer again.
              </span>
            </h1>

            <p className="text-md sm:text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-8 max-w-xl">
              OmniLearn bridges the gap between raw data and true mastery. Built on advanced agentic retrieval, it converts static context into guided discovery loops, structured syllabi, and local focus blocks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                size="lg"
                onClick={() => setShowLogin(true)}
                className="rounded-xl px-8 py-6 text-md font-bold group shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-primary to-violet-600 text-white transition-all w-full sm:w-auto"
              >
                Launch Workspace
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById('mechanics');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl px-8 py-6 text-md font-bold border-border bg-secondary/20 hover:bg-secondary/50 backdrop-blur-sm transition-all w-full sm:w-auto"
              >
                Explore Architecture
              </Button>
            </div>
          </div>

          {/* Right Columns: Premium Interactive Sandbox Terminal */}
          <div className="lg:col-span-6 flex flex-col justify-center w-full">
            <div className="border border-border/80 rounded-3xl shadow-2xl relative overflow-hidden bg-card/40 backdrop-blur-xl p-1.5 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              {/* Inner Dashboard Layer */}
              <div className="bg-background/40 border border-border/40 rounded-[22px] p-5 md:p-6 backdrop-blur-sm">
                
                {/* Header Control Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-destructive/70 block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/70 block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/70 block" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase pl-2 flex items-center gap-1.5">
                      <Terminal size={12} className="text-primary" />
                      Socratic_Sandbox.sh
                    </span>
                  </div>
                  
                  {/* Subject Dynamic Switchers */}
                  <div className="flex p-0.5 rounded-xl bg-secondary/50 border border-border/60 backdrop-blur-sm self-start sm:self-auto">
                    <button 
                      onClick={() => setActiveTab('quantum')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'quantum' ? 'bg-background text-foreground border border-border/40 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Quantum Physics
                    </button>
                    <button 
                      onClick={() => setActiveTab('ai')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'ai' ? 'bg-background text-foreground border border-border/40 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Neural Networks
                    </button>
                  </div>
                </div>

                {/* Simulated Conversation Pipeline */}
                <div className="h-[260px] overflow-y-auto pr-1 space-y-4 mb-6 flex flex-col scrollbar-thin scroll-smooth">
                  <AnimatePresence initial={false}>
                    {history.map((msg, index) => {
                      if (msg.speaker === "choices") return null;
                      const isTutor = msg.speaker === 'tutor';
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex max-w-[88%] flex-col rounded-2xl p-4 text-sm font-medium leading-relaxed border ${
                            isTutor 
                              ? 'bg-secondary/30 border-border/50 text-foreground self-start rounded-tl-none shadow-sm' 
                              : 'bg-gradient-to-br from-primary to-violet-600 border-primary/20 text-white self-end rounded-tr-none shadow-md shadow-primary/5'
                          }`}
                        >
                          <div className={`text-[10px] uppercase tracking-wider opacity-60 mb-1 font-extrabold font-mono ${isTutor ? 'text-primary' : 'text-white'}`}>
                            {isTutor ? 'Gemma-4 Agent' : 'Student'}
                          </div>
                          <div className="text-xs sm:text-sm font-sans tracking-wide">{msg.text}</div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Interaction & Option Triggers */}
                <div className="border-t border-border/60 pt-4 min-h-[92px] flex items-center justify-center">
                  {(() => {
                    const lastMsg = history[history.length - 1];
                    if (lastMsg && lastMsg.speaker === "choices") {
                      return (
                        <div className="flex flex-col gap-2.5 w-full">
                          {lastMsg.options.map((opt: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleChoice(opt)}
                              className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/10 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center justify-between group shadow-inner"
                            >
                              <span className="pr-4 text-foreground/90 font-medium group-hover:text-primary transition-colors">{opt.text}</span>
                              <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          ))}
                        </div>
                      );
                    }
                    if (history.length >= 5) {
                      return (
                        <Button 
                          onClick={() => setShowLogin(true)}
                          className="w-full rounded-xl py-6 font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-violet-600 hover:opacity-95 text-white border-0 shadow-lg shadow-primary/10 tracking-wide"
                        >
                          <GraduationCap size={18} className="animate-bounce" />
                          Unlock Premium Learning Workspace
                        </Button>
                      );
                    }
                    return (
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 font-mono italic opacity-80">
                        <Clock size={12} className="animate-spin text-primary" />
                        Awaiting conceptual processing weights...
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* ── Architectural Mechanics Showcase ── */}
        <section id="mechanics" className="py-24 border-t border-border/30 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-heading tracking-tight mb-4">
              Designed for Flow. <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Engineered for Mastery.</span>
            </h2>
            <p className="text-md sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              We cleanly divide technical workflows among specialized local edge and cloud pipelines to protect study privacy and guarantee real-time latency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Capability Feature Card 1 */}
            <div className="border border-border/60 bg-card/20 backdrop-blur-md p-8 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-3 flex items-center gap-2">
                Curriculum Planner
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/40">31B Dense</span>
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Ingest textbooks, PDFs, and deep learning documentation. Gemma 4 parses context layers to build interactive multi-week modules complete with real-time web-fetched supplementary materials.
              </p>
            </div>

            {/* Capability Feature Card 2 */}
            <div className="border border-border/60 bg-card/20 backdrop-blur-md p-8 rounded-2xl hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <BrainCircuit size={20} />
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-3 flex items-center gap-2">
                Socratic AI Guide
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/40">26B MoE</span>
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Never gives flat answers. The agentic retrieval model uses functional code pipelines and guided questioning to validate user assumptions, deploying dynamic quiz nodes when blockers are met.
              </p>
            </div>

            {/* Capability Feature Card 3 */}
            <div className="border border-border/60 bg-card/20 backdrop-blur-md p-8 rounded-2xl hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Focus size={20} />
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-3 flex items-center gap-2">
                Local Focus Chamber
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">E2B Edge</span>
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                An offline, screen-locked room utilizing client-side WebGPU architectures. Runs voice coaching and keyboard behavioral tracking locally, ensuring zero cloud overhead and total user dataset privacy.
              </p>
            </div>

          </div>

          {/* Core Hackathon Targets Row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-border/30">
            <div className="flex items-center gap-3">
              <Layers size={18} className="text-primary shrink-0" />
              <div className="text-xs font-mono font-bold tracking-wide text-muted-foreground uppercase">Agentic Retreival RAG</div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <div className="text-xs font-mono font-bold tracking-wide text-muted-foreground uppercase">Zero-Data Cloud Leak</div>
            </div>
            <div className="flex items-center gap-3">
              <Globe2 size={18} className="text-violet-500 shrink-0" />
              <div className="text-xs font-mono font-bold tracking-wide text-muted-foreground uppercase">Linguistic Inclusivity</div>
            </div>
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-cyan-500 shrink-0" />
              <div className="text-xs font-mono font-bold tracking-wide text-muted-foreground uppercase">Native Function Calls</div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Premium Footer ── */}
      <footer className="border-t border-border/40 py-12 bg-secondary/10 relative z-10 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-foreground/80 font-heading">OmniLearn © 2026. Custom Constructed for Digital Equity.</p>
          <p className="opacity-70 text-xs font-mono bg-secondary/60 border border-border/40 px-3 py-1 rounded-lg">
            Built for Gemma 4 Impact Challenge • Local WebGPU Client Runtimes
          </p>
        </div>
      </footer>

      {/* ── Auth/Initialization Dialog ── */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-[420px] bg-card/95 border-border backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-2xl md:text-3xl font-black mb-2 tracking-tight">
              {isSignUp ? 'Create Workspace' : 'Initialize Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wide text-muted-foreground uppercase ml-0.5">Email Secure Target</label>
              <Input
                type="email"
                placeholder="developer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="rounded-xl h-11 border-border/80 bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wide text-muted-foreground uppercase ml-0.5">Cryptographic Password</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="rounded-xl h-11 border-border/80 bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleAuth}
                disabled={authLoading}
                className="flex-1 rounded-xl py-5 text-sm font-bold shadow-md bg-gradient-to-r from-primary to-violet-600 text-white transition-all border-0"
              >
                {authLoading ? 'Authorizing Vector Sync...' : (isSignUp ? 'Establish Identity' : 'Mount Drive Engine')}
              </Button>
            </div>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors text-center mt-2 font-mono tracking-wide"
            >
              {isSignUp ? '// Account exists? Initialize here' : "// Missing local keys? Register context"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}