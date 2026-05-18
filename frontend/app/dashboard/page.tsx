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
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      staggerChildren: 0.1,
      delayChildren: 0.05,
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
    { role: 'model', text: "Hello! I am your AI Coach. Whenever you're ready, enter a topic to generate a course, or ask me any question to begin." }
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
              { role: 'model', text: `Welcome back. You are currently exploring "${loadedCourses[0].course_name}". Are we diving back into the material today?` }
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
      setCoachMessages([...currentMessages, { role: 'model', text: "I'm having trouble connecting right now." }]);
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
      className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      {/* ── Left Column (Main Content) ── */}
      <div className="flex flex-col gap-8">
        
        {/* ── Hero Card ── */}
        <motion.div variants={item}>
          {loading ? (
            <Card className="flex items-center justify-center min-h-[300px] border-border shadow-sm rounded-2xl bg-card">
              <Loader2 className="animate-spin text-primary" size={32} />
            </Card>
          ) : latestCourse ? (
            <Card className="border-border shadow-md rounded-3xl bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <CardContent className="p-8 md:p-12 relative z-10">
                <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 font-medium text-sm">
                  Active Roadmap
                </Badge>
                
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                  {latestCourse.course_name}
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  You generated this roadmap with <strong>{latestCourse.module_count} structured modules</strong>. Step into your study zone whenever you are ready.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/courses')}
                    className="rounded-xl px-8 h-14 font-semibold text-base shadow-sm"
                  >
                    <Play size={20} className="mr-2" /> Resume Study Path
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/dashboard/tutor')}
                    className="rounded-xl px-8 h-14 font-semibold text-base bg-background/50 hover:bg-accent"
                  >
                    <Search size={20} className="mr-2" /> Socratic AI Coach
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-md rounded-3xl bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <CardContent className="p-8 md:p-12 relative z-10">
                <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 font-medium text-sm">
                  Welcome to OmniLearn
                </Badge>
                
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                  A blank canvas.
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  Enter any engineering or complex science topic in our Course Generator to architect a custom syllabus.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/courses')}
                    className="rounded-xl px-8 h-14 font-semibold text-base shadow-sm"
                  >
                    <BrainCircuit size={20} className="mr-2" /> Architect Syllabus
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ── Tools Grid ── */}
        <motion.div variants={item}>
          <h3 className="text-2xl font-bold mb-6 text-foreground tracking-tight">
            Your Toolkit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: 'Course Generator', desc: 'Turn any topic into a study path.', href: '/dashboard/courses', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Timer, title: 'Focus Room', desc: 'Immersive deep-work environment.', href: '/dashboard/focus', color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: Search, title: 'AI Guider', desc: 'Search and query across your materials.', href: '/dashboard/tutor', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((tool) => (
              <Card
                key={tool.title}
                className="cursor-pointer rounded-2xl transition-all hover:shadow-md hover:border-primary/30 bg-card border-border shadow-sm group"
                onClick={() => router.push(tool.href)}
              >
                <CardContent className="p-6">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${tool.bg} ${tool.color} group-hover:scale-105 transition-transform`}>
                    <tool.icon size={28} />
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-foreground">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Column (Sidebar AI & Progress) ── */}
      <div className="flex flex-col gap-8">
        
        {/* ── Progress Widget ── */}
        <motion.div variants={item}>
          <Card className="rounded-3xl border-border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Weekly Goal</CardTitle>
              <CardDescription>
                {courses.length > 0 ? 'Consistent progress' : 'Take your first step'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-1000 ease-out" 
                  style={{ width: courses.length > 0 ? '45%' : '0%' }}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold text-muted-foreground">
                <span className="text-foreground">{courses.length > 0 ? '45%' : '0%'}</span>
                <span>{courses.length > 0 ? 'Progress' : 'No hours logged'}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── AI Widget ── */}
        <motion.div variants={item} className="flex flex-col flex-1 min-h-[400px]">
          <Card className="flex flex-1 flex-col rounded-3xl border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Zap size={20} className="text-primary" />
                Gemma Coach
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex flex-1 flex-col p-4">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 mb-4">
                {coachMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === 'model'
                        ? 'rounded-tl-sm bg-secondary text-secondary-foreground mr-8'
                        : 'rounded-tr-sm bg-primary text-primary-foreground ml-8'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {sendingMessage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                    <Loader2 className="animate-spin text-primary" size={16} /> Typing...
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex gap-2 items-center">
                <Input
                  placeholder="Ask a question..."
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCoachMsg()}
                  disabled={sendingMessage}
                  className="flex-1 rounded-xl h-12 bg-background border-border/50"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendCoachMsg}
                  disabled={sendingMessage || !coachInput.trim()}
                  className="rounded-xl h-12 w-12 shadow-sm"
                >
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
