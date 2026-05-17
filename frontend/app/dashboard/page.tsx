'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  BrainCircuit,
  Timer,
  Search,
  Play,
  Send,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-16 animate-fade-in max-xl:grid-cols-1">
      {/* Left Column */}
      <div className="flex flex-col gap-10">
        {/* Hero Card */}
        <Card className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-card to-card/40 p-0 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]">
          <div className="pointer-events-none absolute -top-1/2 -right-[20%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,rgba(0,0,0,0)_70%)]" />
          <CardContent className="relative z-10 p-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/10 text-primary font-semibold px-4 py-1">
              Currently Focusing
            </Badge>
            <h2 className="font-heading text-5xl font-semibold leading-[1.1] mb-4">
              Quantum Superposition
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-[80%]">
              You're 45 minutes into your deep dive. You've mastered Qubits, now it's time to understand how particles exist in multiple states.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard/focus')}
                className="rounded-xl shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all"
              >
                <Play size={18} fill="currentColor" /> Resume Session
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/dashboard/courses')}
                className="rounded-xl"
              >
                <BookOpen size={18} /> View Roadmap
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div>
          <h3 className="text-xl font-semibold mb-5">Your Toolkit</h3>
          <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-1">
            {[
              { icon: BrainCircuit, title: 'Course Generator', desc: 'Turn any topic into a structured study path instantly.', href: '/dashboard/courses' },
              { icon: Timer, title: 'Focus Room', desc: 'Immersive Pomodoro environment with ambient noise.', href: '/dashboard/focus' },
              { icon: Search, title: 'AI Guider', desc: 'Search across all your materials and get AI answers.', href: '/dashboard/tutor' },
            ].map((tool) => (
              <Card
                key={tool.title}
                className="cursor-pointer rounded-3xl transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-0"
                onClick={() => router.push(tool.href)}
              >
                <CardContent className="p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl glass-panel text-primary">
                    <tool.icon size={24} />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        {/* AI Widget */}
        <Card className="flex flex-1 flex-col rounded-3xl p-0">
          <CardHeader className="px-8 pt-8 pb-0">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap size={20} className="text-accent-tertiary" />
              Gemma Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-8 pt-6">
            <div className="flex-1">
              <div className="glass-panel rounded-xl rounded-tl-[4px] p-4 text-[0.95rem] text-muted-foreground leading-relaxed">
                I noticed you struggled with the concept of entanglement yesterday. Would you like me to find a simpler visual explanation before we move to Superposition?
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Ask a question or request a resource..."
                className="flex-1"
              />
              <Button size="icon" className="rounded-xl w-12">
                <Send size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Widget */}
        <Card className="rounded-3xl p-0">
          <CardContent className="p-8">
            <h3 className="text-base font-semibold mb-2">Weekly Goal</h3>
            <p className="text-sm text-muted-foreground">12 hrs / 18 hrs focused</p>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-primary to-accent-tertiary" />
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>66%</span>
                <span>6 hrs left</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
