'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BrainCircuit,
  Timer,
  MessageSquare,
  Settings,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Mic,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/courses', icon: BrainCircuit, label: 'Course Gen' },
  { href: '/dashboard/focus', icon: Timer, label: 'Focus Room' },
  { href: '/dashboard/tutor', icon: MessageSquare, label: 'AI Guider' },
  { href: '/dashboard/voice', icon: Mic, label: 'Voice Coach' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isLightMode: boolean;
  onThemeToggle: () => void;
}

export function Sidebar({ collapsed, onToggle, isLightMode, onThemeToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={cn(
        'relative flex flex-col gap-10 border-r border-border/60 bg-card/50 backdrop-blur-md transition-all duration-400 z-40',
        collapsed ? 'w-[90px] px-4 py-10' : 'w-[280px] px-6 py-10'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-10 -right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm text-muted-foreground transition-all hover:bg-primary hover:text-white hover:scale-110"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className={cn('flex items-center gap-3 overflow-hidden whitespace-nowrap', collapsed && 'justify-center')}>
        <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-accent-secondary to-accent-tertiary text-white shadow-md">
          <Sparkles size={20} />
        </div>
        {!collapsed && (
          <span className="font-heading text-2xl font-extrabold tracking-tight">OmniLearn</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const NavButton = (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-4 rounded-xl px-4 py-3.5 font-bold transition-all duration-300 overflow-hidden whitespace-nowrap group',
                collapsed && 'justify-center px-3 py-3.5',
                isActive 
                  ? 'glass-panel text-primary shadow-sm border border-primary/20 bg-primary/10' 
                  : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              )}
            >
              <item.icon size={22} style={{ minWidth: 22 }} className={cn("transition-transform duration-300", !isActive && "group-hover:scale-110")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
                <TooltipContent side="right" className="font-bold">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return NavButton;
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto flex flex-col gap-2.5">
        <button
          onClick={onThemeToggle}
          className={cn(
            'flex items-center gap-4 rounded-xl px-4 py-3.5 font-bold text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground group',
            collapsed && 'justify-center px-3'
          )}
        >
          {isLightMode ? (
            <Moon size={22} style={{ minWidth: 22 }} className="group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <Sun size={22} style={{ minWidth: 22 }} className="group-hover:scale-110 transition-transform duration-300" />
          )}
          {!collapsed && <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button
          className={cn(
            'flex items-center gap-4 rounded-xl px-4 py-3.5 font-bold text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground group',
            collapsed && 'justify-center px-3'
          )}
        >
          <Settings size={22} style={{ minWidth: 22 }} className="group-hover:scale-110 transition-transform duration-300" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
