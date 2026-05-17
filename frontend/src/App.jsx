import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  BrainCircuit,
  Focus,
  Network,
  Zap,
  Clock
} from 'lucide-react';

import gsap from 'gsap';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import { supabase } from './lib/supabase';

/* ================= RAG ADDITIONS ================= */
import * as pdfjsLib from "pdfjs-dist";
import OpenAI from "openai";

/* OpenAI */
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

/* chunk helper */
const chunkText = (text, size = 1000) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
};

/* ================= UI COMPONENTS (UNCHANGED) ================= */
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

    <h3 className="text-xl font-semibold mb-2 text-white">
      {title}
    </h3>

    <p className="text-slate-300 text-sm leading-relaxed">
      {description}
    </p>
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

    <h4 className="text-purple-400 font-mono text-sm mb-2">
      {model}
    </h4>

    <h3 className="text-lg font-semibold text-white mb-3">
      {purpose}
    </h3>

    <p className="text-slate-400 text-sm">
      {strategy}
    </p>
  </motion.div>
);

export default function App() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(false);

  /* RAG STATES */
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {

    const lenis = new Lenis({ autoRaf: false });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    checkUser();

    return () => lenis.destroy();
  }, []);

  /* ================= AUTH ================= */
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user);
  };

  const signUpUser = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Signup successful!");
  };

  const loginUser = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);

    setCurrentUser(data.user);
    alert("Login successful!");
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  /* ================= STEP 1–3: UPLOAD + EMBEDDINGS ================= */
  const uploadFile = async (event) => {

    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    try {

      const fileName = `${Date.now()}-${file.name}`;

      await supabase.storage
        .from('documents')
        .upload(`files/${fileName}`, file);

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(`files/${fileName}`);

      const fileUrl = data.publicUrl;

      const pdf = await pdfjsLib.getDocument(fileUrl).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ");
      }

      const chunks = chunkText(text, 1000);

      for (let chunk of chunks) {

        const res = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        });

        const vector = res.data[0].embedding;

        await supabase.from("embeddings").insert({
          content: chunk,
          embedding: vector,
        });
      }

      alert("File processed successfully!");

    } catch (err) {
      console.error(err);
      alert("Error processing file");
    }

    setLoading(false);
  };

  /* ================= STEP 4: RAG QUERY ================= */
  const askAI = async () => {

    if (!query) return;

    setAnswer("Thinking...");

    const embed = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryVector = embed.data[0].embedding;

    const { data: matches } = await supabase.rpc("match_documents", {
      query_embedding: queryVector,
      match_threshold: 0.78,
      match_count: 5,
    });

    const context = matches.map(m => m.content).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer strictly using provided context."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${query}`
        }
      ]
    });

    setAnswer(completion.choices[0].message.content);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans">

      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20">

        {/* ================= AUTH ================= */}
        <div className="glass-panel rounded-3xl p-8 mb-16 border border-purple-500/20">

          <h2 className="text-3xl font-bold text-center text-white mb-8">
            OmniLearn Authentication
          </h2>

          <div className="flex flex-col gap-4 items-center mb-8">

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-800 w-full max-w-md"
            />

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-800 w-full max-w-md"
            />

          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={signUpUser} className="bg-green-500 px-6 py-2 rounded-full">Sign Up</button>
            <button onClick={loginUser} className="bg-blue-500 px-6 py-2 rounded-full">Login</button>
            <button onClick={logoutUser} className="bg-red-500 px-6 py-2 rounded-full">Logout</button>
          </div>

          <p className="text-center mt-6 text-slate-300">
            {currentUser ? `Logged in: ${currentUser.email}` : "No user logged in"}
          </p>
        </div>

        {/* ================= UPLOAD ================= */}
        <div className="glass-panel rounded-3xl p-8 mb-20 border border-purple-500/20">

          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Upload Study Materials
          </h2>

          <div className="flex justify-center">
            <input type="file" onChange={uploadFile} />
          </div>

          {loading && (
            <p className="text-center text-yellow-400 mt-4">
              Processing PDF for AI search...
            </p>
          )}
        </div>

        {/* ================= HERO ================= */}
        <motion.section className="text-center py-20">
          <h1 className="text-5xl font-bold text-white">
            Meet <span className="text-purple-400">OmniLearn</span>
          </h1>

          <p className="text-slate-400 mt-6 max-w-2xl mx-auto">
            AI-powered personalized learning system with RAG intelligence.
          </p>
        </motion.section>

        {/* ================= FEATURES ================= */}
        <section className="py-20 grid md:grid-cols-3 gap-6">

          <FeatureCard index={0} icon={BookOpen} title="Curriculum Planner"
            description="Build structured learning paths" />

          <FeatureCard index={1} icon={BrainCircuit} title="AI Tutor"
            description="Context-aware assistant" />

          <FeatureCard index={2} icon={Focus} title="Focus Mode"
            description="Distraction-free learning" />

        </section>

        {/* ================= ARCHITECTURE ================= */}
        <section className="py-20">

          <div className="glass-panel rounded-3xl p-10">

            <h2 className="text-3xl font-bold text-white text-center mb-10">
              Intelligent Architecture
            </h2>

            <div className="grid md:grid-cols-3 gap-6">

              <ModelCard model="Gemma 4" purpose="Learning Engine"
                strategy="Processes knowledge" />

              <ModelCard model="MoE Model" purpose="AI Tutor"
                strategy="Real-time reasoning" />

              <ModelCard model="Edge Model" purpose="Focus Mode"
                strategy="Runs locally" />

            </div>

          </div>
        </section>

        {/* ================= WOW FACTOR ================= */}
        <section className="py-20 text-center">

          <h2 className="text-3xl font-bold text-white mb-10">
            The "Wow" Factor
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-left">

            <div className="glass-panel p-8 border-l-4 border-pink-500">
              <h3 className="text-xl font-bold flex gap-2 items-center">
                <Network /> Hybrid AI System
              </h3>
              <p className="text-slate-400 mt-2">
                Cloud + local AI collaboration
              </p>
            </div>

            <div className="glass-panel p-8 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold flex gap-2 items-center">
                <Clock /> Memory Continuity
              </h3>
              <p className="text-slate-400 mt-2">
                AI remembers uploaded knowledge
              </p>
            </div>

          </div>
        </section>

        {/* ================= RAG Q&A ================= */}
        <div className="glass-panel rounded-3xl p-8 mt-20 border border-purple-500/20">

          <h2 className="text-2xl font-bold text-center mb-4">
            Ask Your Documents (RAG AI)
          </h2>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something..."
            className="w-full p-3 rounded bg-slate-800 text-white"
          />

          <button
            onClick={askAI}
            className="mt-4 bg-purple-600 px-6 py-2 rounded-full"
          >
            Ask AI
          </button>

          {answer && (
            <div className="mt-6 p-4 bg-slate-800 rounded">
              {answer}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}