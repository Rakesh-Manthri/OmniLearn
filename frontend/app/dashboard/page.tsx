'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  BrainCircuit,
  Timer,
  Search,
  Play,
  Send,
  Zap,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { api, CourseListItem } from '@/services/api';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Gemma Coach chat state
  const [coachInput, setCoachInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<Array<{ role: 'model' | 'user'; text: string }>>([
    { role: 'model', text: "Hello! I am your AI Coach. I notice you haven't started a session yet today. Enter a topic above to generate a course, or ask me any question to begin!" }
  ]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user?.id) {
      api.getUserCourses(user.id)
        .then(res => {
          const loadedCourses = res.courses || [];
          setCourses(loadedCourses);
          if (loadedCourses.length > 0) {
            setCoachMessages([
              { role: 'model', text: `Welcome back! I see you are master-planning "${loadedCourses[0].course_name}". Ready to dive back in or test your understanding with a Socratic dialogue?` }
            ]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleSendCoachMsg = async () => {
    if (!coachInput.trim() || sendingMessage) return;
    const userMsg = { role: 'user' as const, text: coachInput };
    const currentMessages = [...coachMessages, userMsg];
    setCoachMessages(currentMessages);
    setCoachInput('');
    setSendingMessage(true);
    try {
      const history = currentMessages.slice(0, -1);
      const res = await api.chatTutor(
        'Gemma Coach Widget',
        'Study Guidance',
        userMsg.text,
        history,
        user?.id
      );
      setCoachMessages([...currentMessages, { role: 'model', text: res.response }]);
    } catch {
      setCoachMessages([...currentMessages, { role: 'model', text: "I'm having trouble reaching my neural pathways right now. Make sure the backend server is running!" }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const latestCourse = courses[0];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-[2fr_1fr] gap-12 max-xl:grid-cols-1"
    >
      {/* Left Column */}
      <div className="flex flex-col gap-10">
        {/* Hero Card */}
        <motion.div variants={item}>
          {loading ? (
            <Card className="rounded-[2rem] bg-card/60 border-border/60 p-16 flex items-center justify-center min-h-[320px]">
              <Loader2 className="animate-spin text-primary" size={40} />
            </Card>
          ) : latestCourse ? (
            <Card className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/40 p-0 shadow-[var(--shadow-premium)] border-border/60 group">
              <div className="pointer-events-none absolute -top-1/2 -right-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.15)_0%,rgba(0,0,0,0)_70%)] group-hover:scale-110 transition-transform duration-1000 mix-blend-multiply dark:mix-blend-screen" />
              <div className="pointer-events-none absolute -bottom-1/2 -left-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,rgba(0,0,0,0)_70%)] mix-blend-multiply dark:mix-blend-screen" />
              
              <CardContent className="relative z-10 p-12 md:p-16">
                <Badge variant="outline" className="mb-6 border-accent/20 bg-accent/10 text-accent font-bold px-4 py-1.5 shadow-sm">
                  Active Roadmap
                </Badge>
                <h2 className="font-heading text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5 text-foreground drop-shadow-sm">
                  {latestCourse.course_name}
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-[85%] font-medium leading-relaxed">
                  You generated this roadmap with {latestCourse.module_count} structured modules and custom-tailored Socratic paths. Ready to resume?
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/courses')}
                    className="rounded-full px-8 py-7 shadow-[var(--shadow-premium)] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 font-bold text-lg bg-primary text-primary-foreground"
                  >
                    <Play size={20} fill="currentColor" className="mr-2" /> Resume Study Path
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/dashboard/tutor')}
                    className="rounded-full px-8 py-7 glass-panel hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 border-border font-bold text-lg hover:-translate-y-1"
                  >
                    <Search size={20} className="mr-2" /> Socratic AI Coach
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/40 p-0 shadow-[var(--shadow-premium)] border-border/60 group">
              <div className="pointer-events-none absolute -top-1/2 -right-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.15)_0%,rgba(0,0,0,0)_70%)] group-hover:scale-110 transition-transform duration-1000 mix-blend-multiply dark:mix-blend-screen" />
              
              <CardContent className="relative z-10 p-12 md:p-16">
                <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/10 text-primary font-bold px-4 py-1.5 shadow-sm">
                  Welcome to OmniLearn
                </Badge>
                <h2 className="font-heading text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5 text-foreground drop-shadow-sm">
                  No courses generated yet
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-[85%] font-medium leading-relaxed">
                  Enter any engineering or complex science topic in our Course Generator to architect a premium, bespoke Socratic syllabus immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/courses')}
                    className="rounded-full px-8 py-7 shadow-[var(--shadow-premium)] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 font-bold text-lg bg-primary text-primary-foreground"
                  >
                    <BrainCircuit size={20} className="mr-2" /> Create Syllabus
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Tools Grid */}
        <motion.div variants={item}>
          <h3 className="text-2xl font-bold mb-6 font-heading text-foreground">Your Toolkit</h3>
          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            {[
              { icon: BrainCircuit, title: 'Course Generator', desc: 'Turn any topic into a structured study path instantly.', href: '/dashboard/courses', color: 'text-blue-500' },
              { icon: Timer, title: 'Focus Room', desc: 'Immersive Pomodoro environment with ambient noise.', href: '/dashboard/focus', color: 'text-amber-500' },
              { icon: Search, title: 'AI Guider', desc: 'Search across all your materials and get AI answers.', href: '/dashboard/tutor', color: 'text-emerald-500' },
            ].map((tool) => (
              <Card
                key={tool.title}
                className="cursor-pointer rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[var(--shadow-premium)] p-0 group border-border/50 bg-card/50 backdrop-blur-sm"
                onClick={() => router.push(tool.href)}
              >
                <CardContent className="p-8">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl glass-panel ${tool.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon size={26} />
                  </div>
                  <h4 className="text-xl font-bold mb-3 font-heading text-foreground">{tool.title}</h4>
                  <p className="text-[0.95rem] font-medium text-muted-foreground leading-relaxed">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-8">
        {/* AI Widget */}
        <motion.div variants={item} className="flex flex-1">
          <Card className="flex flex-1 flex-col rounded-[2rem] p-0 border-border/50 shadow-lg relative overflow-hidden bg-card/60 backdrop-blur-md min-h-[380px]">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-accent-secondary to-accent-tertiary" />
            <CardHeader className="px-8 pt-8 pb-2">
              <CardTitle className="flex items-center gap-3 text-2xl font-heading font-bold">
                <div className="bg-accent-tertiary/20 p-2 rounded-xl">
                  <Zap size={22} className="text-accent-tertiary" />
                </div>
                Gemma Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-8 pt-4">
              <div className="flex-1 space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {coachMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`glass-panel rounded-2xl p-4 text-[0.95rem] font-medium leading-relaxed shadow-sm ${
                      msg.role === 'model'
                        ? 'rounded-tl-sm border-l-2 border-l-accent-tertiary text-foreground bg-white/40 dark:bg-white/5'
                        : 'rounded-tr-sm border-r-2 border-r-primary text-primary-foreground bg-primary/90 ml-8'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {sendingMessage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin text-accent-tertiary" size={16} /> Thinking...
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3 items-center">
                <Input
                  placeholder="Ask a coach or request guidance..."
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCoachMsg()}
                  disabled={sendingMessage}
                  className="flex-1 rounded-full h-14 px-6 bg-secondary/50 border-border shadow-inner font-medium focus-visible:ring-primary"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendCoachMsg}
                  disabled={sendingMessage || !coachInput.trim()}
                  className="rounded-full h-14 w-14 shadow-md bg-primary hover:bg-primary/90 hover:scale-105 transition-all"
                >
                  <Send size={20} className="text-primary-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Widget */}
        <motion.div variants={item}>
          <Card className="rounded-[2rem] p-0 border-border/50 shadow-lg bg-card/60 backdrop-blur-md">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-3 font-heading">Weekly Goal</h3>
              <p className="text-sm font-medium text-muted-foreground mb-5">
                {courses.length > 0 ? 'Roadmap started' : 'No active roadmaps'}
              </p>
              <div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent-secondary to-accent-tertiary relative transition-all duration-500" 
                    style={{ width: courses.length > 0 ? '45%' : '0%' }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-[2px] animate-pulse" />
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm font-bold text-muted-foreground">
                  <span className="text-primary">{courses.length > 0 ? '45%' : '0%'}</span>
                  <span>{courses.length > 0 ? 'Progress' : 'No hours logged'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
