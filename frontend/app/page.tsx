'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  ArrowRight,
  ArrowDown,
  BookOpen, 
  BrainCircuit, 
  Focus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LandingPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  
  const [showLogin, setShowLogin] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
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
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent blur-[160px] dark:from-primary/20 animate-pulse duration-1000" />
      </div>

      {/* ── Fixed Premium Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-transparent bg-background/0 backdrop-blur-sm transition-all duration-300">
        <div className="w-full flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-3 font-heading text-xl font-bold tracking-tight group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-600 text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={18} className="animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/30 backdrop-blur-sm hover:border-primary/40 hover:bg-secondary/60 transition-all duration-300 shadow-sm text-foreground"
            >
              {isLightMode ? <Moon size={18} className="text-violet-500" /> : <Sun size={18} className="text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="relative z-10 w-full flex flex-col items-center">
        
        {/* ── Hero Section (Full Screen) ── */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center max-w-4xl"
          >
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter font-heading leading-none mb-6">
              Omni<span className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">Learn</span>
            </h1>

            <p className="text-lg sm:text-2xl text-muted-foreground font-medium leading-relaxed mb-4 max-w-2xl mx-auto opacity-90">
              The AI-powered learning environment that adapts to you. No rigid boundaries. Just pure, free-flowing knowledge.
            </p>

            <button 
              onClick={() => setShowLogin(true)}
              className="group flex items-center gap-6 mt-16 text-muted-foreground hover:text-foreground transition-all duration-500 outline-none"
            >
              <span className="text-xl md:text-2xl font-light tracking-wider">
                Initialize Workspace
              </span>
              <div className="flex items-center">
                <div className="h-[2px] w-12 bg-muted-foreground/30 group-hover:w-24 group-hover:bg-primary transition-all duration-500 ease-out" />
                <ArrowRight className="w-5 h-5 -ml-1 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 ease-out" />
              </div>
            </button>
            
            <div className="mt-24 opacity-70 flex flex-col items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Scroll down</span>
              <ArrowDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        </section>

        {/* ── Features Description Section ── */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 py-32 flex flex-col gap-32">
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 relative aspect-square max-h-[500px] w-full rounded-[2rem] border border-border/50 bg-gradient-to-br from-card/40 to-background/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
              <BookOpen className="w-32 h-32 text-primary/80 group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="order-1 md:order-2 flex flex-col items-start text-left">
              <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-6">
                Infinite <span className="text-primary">Curriculum</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Break free from static textbooks. OmniLearn dynamically parses context to build interactive modules tailored exclusively to your cognitive rhythm.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="flex flex-col items-start text-left">
              <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-6">
                Socratic <span className="text-purple-500">AI Guide</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                True mastery comes from guided discovery, not flat answers. Our agentic retrieval model uses functional pipelines to challenge your assumptions and build deep understanding.
              </p>
            </div>
            <div className="relative aspect-square max-h-[500px] w-full rounded-[2rem] border border-border/50 bg-gradient-to-bl from-card/40 to-background/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
              <BrainCircuit className="w-32 h-32 text-purple-500/80 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 relative aspect-square max-h-[500px] w-full rounded-[2rem] border border-border/50 bg-gradient-to-br from-card/40 to-background/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
              <Focus className="w-32 h-32 text-cyan-500/80 group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="order-1 md:order-2 flex flex-col items-start text-left">
              <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-6">
                Total <span className="text-cyan-500">Focus Chamber</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                An offline, screen-locked environment running locally. We guarantee zero cloud overhead and absolute privacy for your most intense study sessions.
              </p>
            </div>
          </motion.div>

        </section>

      </main>

      {/* ── Premium Footer ── */}
      <footer className="border-t border-border/20 py-16 bg-background relative z-10 text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Sparkles size={16} />
            <span className="font-heading font-bold tracking-widest text-sm uppercase">OmniLearn</span>
          </div>
          <p className="font-medium text-sm">Engineered for deep learning and digital equity.</p>
        </div>
      </footer>

      {/* ── Auth/Initialization Dialog ── */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-[400px] border-border/40 bg-card/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <DialogHeader className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {isSignUp ? 'Enter your email to get started.' : 'Enter your details to sign in.'}
            </p>
          </DialogHeader>
          
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="h-12 rounded-xl bg-secondary/30 border-border/50 px-4 focus-visible:ring-primary/50 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="h-12 rounded-xl bg-secondary/30 border-border/50 px-4 focus-visible:ring-primary/50 text-base"
              />
            </div>

            <Button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full h-12 rounded-xl font-semibold mt-2 shadow-sm"
            >
              {authLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {authLoading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </Button>
            
            <div className="text-center mt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}