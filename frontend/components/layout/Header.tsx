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
        <h1 className="font-heading text-[2.75rem] font-semibold leading-tight">
          {timeGreeting}, {displayName}
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {greetings[pathname] || "Welcome to OmniLearn."}
        </p>
      </div>

      <button
        onClick={signOut}
        title="Click to Logout"
        className="flex items-center gap-3 rounded-full bg-muted/50 px-5 py-2 transition-colors hover:bg-secondary"
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium pr-1">{displayName}</span>
        <LogOut size={16} className="text-muted-foreground" />
      </button>
    </header>
  );
}
