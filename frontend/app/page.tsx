'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { BookOpen, BrainCircuit, Focus, Network, Zap, Clock, Sparkles, Lock, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FeatureCard = ({ title, icon: Icon, description, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    className="glass-panel rounded-2xl p-6 hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 border border-border"
  >
    <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-primary/30">
      <Icon className="text-primary w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const ModelCard = ({ model, purpose, strategy }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-card/50 border border-border rounded-xl p-6 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <h4 className="text-primary font-mono text-sm mb-2">{model}</h4>
    <h3 className="text-lg font-semibold text-foreground mb-3">{purpose}</h3>
    <p className="text-muted-foreground text-sm">{strategy}</p>
  </motion.div>
);

export default function LandingPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check initial dark mode from DOM
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
    const lenis = new Lenis({
      autoRaf: false,
    });
    // Synchronize GSAP ticker with Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.destroy();
    };
  }, []);

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

  const scrollToArchitecture = () => {
    const el = document.getElementById('architecture');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30 font-body transition-colors duration-700 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-8 md:px-16 py-6 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 font-heading text-2xl font-bold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-accent-tertiary text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          OmniLearn
        </div>
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="flex h-11 w-11 items-center justify-center rounded-full glass-panel text-foreground transition-all hover:scale-105 hover:border-primary cursor-pointer shadow-sm z-50"
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20 min-h-[70vh] flex flex-col justify-center items-center relative"
        >
          {/* Decorative Floating Badges */}
          <motion.div 
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute left-[5%] top-[20%] hidden lg:flex flex-col gap-2 p-4 glass-panel rounded-2xl border-l-4 border-l-primary shadow-lg animate-float"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="text-primary w-5 h-5" />
              <span className="font-bold text-foreground text-sm">Gemma 4 MoE</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">Active Tutor Guider</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute right-[5%] bottom-[30%] hidden lg:flex flex-col gap-2 p-4 glass-panel rounded-2xl border-l-4 border-l-accent-tertiary shadow-lg animate-float"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="flex items-center gap-2">
              <Focus className="text-accent-tertiary w-5 h-5" />
              <span className="font-bold text-foreground text-sm">Deep Focus</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">Zero-Latency WebGPU</span>
          </motion.div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel text-sm text-primary font-bold mb-8 border-primary/30 shadow-md hover:scale-105 transition-transform cursor-default">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="bg-gradient-to-r from-primary to-accent-secondary bg-clip-text text-transparent">AI-Powered Learning Workspace</span>
          </div>
          <h1 className="text-6xl md:text-[7rem] font-extrabold mb-8 tracking-tighter text-foreground drop-shadow-lg font-heading leading-none">
            Meet <span className="gradient-text relative inline-block">OmniLearn
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-tertiary blur-2xl opacity-20 -z-10 rounded-full"></div>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed mb-14 drop-shadow-sm">
            An all-in-one personalized environment for autonomous learners. Merging curriculum planning, an active agentic tutor, and a privacy-first focus room to preserve your flow state.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 z-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent-secondary to-accent-tertiary rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <Button 
                size="lg"
                className="relative px-12 py-8 rounded-full font-bold text-xl shadow-[var(--shadow-premium)] hover:-translate-y-1 transition-all duration-300 w-full"
                onClick={() => setShowLogin(true)}
              >
                Start Learning
                <Lock className="ml-2 w-5 h-5 opacity-70" />
              </Button>
            </div>
            <Button 
              size="lg"
              variant="outline"
              className="px-12 py-8 rounded-full font-bold text-xl glass-panel hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 border-border hover:-translate-y-1 w-full"
              onClick={scrollToArchitecture}
            >
              View Architecture
            </Button>
          </div>
        </motion.section>

        {/* Core Features */}
        <section className="py-32 border-t border-border/50">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground font-heading tracking-tight">Core Modules</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Everything you need to deeply master a topic in one unified workspace.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              index={0}
              icon={BookOpen}
              title="Course Generator & Curriculum Planner"
              description="Transforms raw user goals or dense reference materials into structured pathways. Ingest massive textbooks and let the system map out chunked, logical, multi-week learning nodes."
            />
            <FeatureCard 
              index={1}
              icon={BrainCircuit}
              title="The Intelligent AI Guider"
              description="An active, always-on mentor attached to your current learning node. It utilizes retrieval-grounded Q&A and native function calling to trigger flashcards, pop-quizzes, and scrape supplementary external knowledge."
            />
            <FeatureCard 
              index={2}
              icon={Focus}
              title="The Focus Room & Study Space"
              description="A minimalist, distraction-free environment. Features native Pomodoro timers and a local offline companion running purely in-browser via WebGPU, ensuring absolute data privacy."
            />
          </div>
        </section>

        {/* Architecture Details */}
        <section id="architecture" className="py-32 relative border-t border-border/50">
          <div className="glass-panel rounded-3xl p-8 md:p-16 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground font-heading tracking-tight">Intelligent AI Architecture</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Cleanly splitting the workload among specialized models to maximize efficiency and minimize infrastructure overhead.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <ModelCard 
                model="Gemma 31B Dense"
                purpose="Syllabus Mapping & Ingestion"
                strategy="Leverages the massive 256K context window to ingest large textbooks and produce structured, hallucination-free weekly curricula."
              />
              <ModelCard 
                model="Gemma 26B MoE"
                purpose="The AI Guider (Tutor)"
                strategy="Utilizes high-speed token generation for real-time, fluid conversations and rapid native function calling."
              />
              <ModelCard 
                model="Gemini / WebGPU"
                purpose="Focus Room Companion"
                strategy="Runs specialized operations locally or via edge networks. Processes user inputs with minimal latency and maximum privacy."
              />
            </div>
          </div>
        </section>

        {/* Wow Factor */}
        <section className="py-32 text-center max-w-5xl mx-auto border-t border-border/50">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-16 text-foreground font-heading tracking-tight">The "Wow" Factor</h2>
          <div className="grid md:grid-cols-2 gap-10 text-left">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-10 rounded-2xl border-l-4 border-l-accent-tertiary shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-foreground font-heading">
                <Network className="text-accent-tertiary w-7 h-7" />
                True Hybrid Architecture
              </h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Seamlessly balances serverless cloud computation for massive 256K context mapping with low-latency edge deployment for real-time interactive companion elements.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-10 rounded-2xl border-l-4 border-l-amber-500 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-foreground font-heading">
                <Clock className="text-amber-500 w-7 h-7" />
                Contextual Continuity
              </h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                The AI Tutor possesses long-term contextual memory of the student's exact learning progress, completely eliminating the need to re-prompt or manually switch apps.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border rounded-3xl p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-3xl font-bold mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
              <Input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="rounded-xl h-12"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="rounded-xl h-12"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleAuth}
                disabled={authLoading}
                className="flex-1 rounded-xl py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
              >
                {authLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
              </Button>
            </div>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-center mt-2"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
