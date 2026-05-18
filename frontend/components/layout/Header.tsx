'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const greetings: Record<string, string> = {
  '/dashboard': "Ready to continue your journey?",
  '/dashboard/courses': "Let's structure your infinite knowledge.",
  '/dashboard/focus': "Eliminate distractions. Enter the flow state.",
  '/dashboard/tutor': "Your personal AI coach is ready to assist.",
};

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="font-heading text-[3rem] font-extrabold tracking-tight leading-tight text-foreground drop-shadow-sm">
          {timeGreeting}, <span className="bg-gradient-to-r from-primary to-accent-tertiary bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="mt-2 text-xl font-medium text-muted-foreground">
          {greetings[pathname] || "Welcome to OmniLearn."}
        </p>
      </div>

      <button
        onClick={signOut}
        title="Click to Logout"
        className="group flex items-center gap-3 rounded-full glass-panel px-6 py-2.5 transition-all duration-300 hover:bg-secondary border border-border/50 hover:shadow-md hover:-translate-y-0.5"
      >
        <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="font-bold pr-1 text-foreground">{displayName}</span>
        <div className="bg-destructive/10 p-1.5 rounded-full text-destructive group-hover:bg-destructive group-hover:text-white transition-colors duration-300">
          <LogOut size={16} />
        </div>
      </button>
    </header>
  );
}
