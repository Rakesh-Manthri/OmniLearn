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
import { Button } from '@/components/ui/button';
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
        'relative flex flex-col gap-10 border-r border-border bg-card transition-all duration-400',
        collapsed ? 'w-[90px] px-4 py-10' : 'w-[280px] px-6 py-10'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-10 -right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-all hover:bg-primary hover:text-white hover:border-primary"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className={cn('flex items-center gap-3 overflow-hidden whitespace-nowrap', collapsed && 'justify-center')}>
        <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-accent-tertiary text-white font-bold">
          <Sparkles size={18} />
        </div>
        {!collapsed && (
          <span className="font-heading text-2xl font-bold">OmniLearn</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const NavButton = (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-4 rounded-[14px] px-4 py-3 font-medium text-muted-foreground transition-all overflow-hidden whitespace-nowrap',
                collapsed && 'justify-center px-3',
                isActive && 'bg-primary/8 text-primary',
                !isActive && 'hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon size={20} style={{ minWidth: 20 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return NavButton;
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={onThemeToggle}
          className={cn(
            'flex items-center gap-4 rounded-[14px] px-4 py-3 font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
            collapsed && 'justify-center px-3'
          )}
        >
          {isLightMode ? <Moon size={20} style={{ minWidth: 20 }} /> : <Sun size={20} style={{ minWidth: 20 }} />}
          {!collapsed && <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button
          className={cn(
            'flex items-center gap-4 rounded-[14px] px-4 py-3 font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
            collapsed && 'justify-center px-3'
          )}
        >
          <Settings size={20} style={{ minWidth: 20 }} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
