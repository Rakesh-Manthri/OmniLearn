import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Focus, Network, Zap, Clock } from 'lucide-react';
import gsap from 'gsap';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const FeatureCard = ({ title, icon: Icon, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    className="glass-panel rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300"
  >
    <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30">
      <Icon className="text-purple-400 w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const ModelCard = ({ model, purpose, strategy }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <h4 className="text-purple-400 font-mono text-sm mb-2">{model}</h4>
    <h3 className="text-lg font-semibold text-white mb-3">{purpose}</h3>
    <p className="text-slate-400 text-sm">{strategy}</p>
  </motion.div>
);

export default function App() {
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

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 selection:bg-purple-500/30 font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20">
        
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-sm text-purple-300 mb-8 border-purple-500/30">
            <Zap className="w-4 h-4" />
            <span>Gemma 4 Impact Challenge • Future of Education</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
            Meet <span className="gradient-text">OmniLearn</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            An all-in-one personalized environment for autonomous learners. Merging curriculum planning, an active agentic tutor, and a privacy-first focus room to preserve your flow state.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-slate-200 transition-colors">
              Start Learning
            </button>
            <button className="glass-panel px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors text-white">
              View Architecture
            </button>
          </div>
        </motion.section>

        {/* Core Features */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Core Modules</h2>
            <p className="text-slate-400">Everything you need to deeply master a topic in one unified workspace.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
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
        <section className="py-20 relative">
          <div className="glass-panel rounded-3xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Intelligent Gemma 4 Architecture</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Cleanly splitting the workload among specialized models to maximize efficiency and minimize infrastructure overhead.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ModelCard 
                model="Gemma 4 31B Dense"
                purpose="Syllabus Mapping & Ingestion"
                strategy="Leverages the massive 256K context window to ingest large textbooks and produce structured, hallucination-free weekly curricula."
              />
              <ModelCard 
                model="Gemma 4 26B A4B MoE"
                purpose="The AI Guider (Tutor)"
                strategy="Utilizes high-speed token generation for real-time, fluid conversations and rapid native function calling."
              />
              <ModelCard 
                model="Gemma 4 E4B / E2B"
                purpose="Focus Room Companion"
                strategy="Runs entirely client-side via WebGPU/LiteRT-LM. Processes local inputs with zero network latency and strict privacy."
              />
            </div>
          </div>
        </section>

        {/* Wow Factor */}
        <section className="py-20 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-white">The "Wow" Factor</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-pink-500">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
                <Network className="text-pink-400" />
                True Hybrid Architecture
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Seamlessly balances serverless cloud computation for massive 256K context mapping with local edge deployment for zero-latency, private voice companion interactions.
              </p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-yellow-500">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
                <Clock className="text-yellow-400" />
                Contextual Continuity
              </h3>
              <p className="text-slate-400 leading-relaxed">
                The AI Tutor possesses long-term contextual memory of the student's exact learning progress, completely eliminating the need to re-prompt or switch apps.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
