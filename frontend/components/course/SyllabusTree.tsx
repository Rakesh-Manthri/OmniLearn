'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, BookOpen, Trophy, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceCard } from '@/components/course/ResourceCard';
import { api, ResourceItem } from '@/services/api';

interface SubTopic {
  title: string;
  description: string;
}

interface Module {
  id?: string;
  week_number: number;
  module_title?: string;
  title?: string;
  objectives: string[];
  topics: SubTopic[];
  resources?: ResourceItem[];
  mastery_score?: number;
}

interface SyllabusTreeProps {
  courseId?: string;
  courseName: string;
  modules: Module[];
  onQuizClick?: (moduleId: string, moduleTitle: string) => void;
}

export function SyllabusTree({ courseId, courseName, modules, onQuizClick }: SyllabusTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [loadingResources, setLoadingResources] = useState<Record<number, boolean>>({});
  const [moduleResources, setModuleResources] = useState<Record<number, ResourceItem[]>>({});

  const toggleModule = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const fetchResources = async (index: number, mod: Module) => {
    setLoadingResources(prev => ({ ...prev, [index]: true }));
    try {
      const activeTitle = mod.title || mod.module_title || `Module ${mod.week_number}`;
      const res = await api.fetchResources(
        courseId || '',
        activeTitle,
        mod.topics.map(t => t.title),
        courseName
      );
      setModuleResources(prev => ({ ...prev, [index]: res.resources }));
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoadingResources(prev => ({ ...prev, [index]: false }));
    }
  };

  const getMasteryColor = (score?: number) => {
    if (score === undefined || score === null || score === 0) return 'bg-muted text-muted-foreground';
    if (score >= 0.8) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (score >= 0.5) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  };

  const getMasteryLabel = (score?: number) => {
    if (score === undefined || score === null || score === 0) return 'Not started';
    if (score >= 0.8) return `${Math.round(score * 100)}% Mastered`;
    if (score >= 0.5) return `${Math.round(score * 100)}% In Progress`;
    return `${Math.round(score * 100)}% Needs Review`;
  };

  return (
    <div className="flex flex-col gap-3">
      {modules.map((mod, index) => {
        const isOpen = expanded[index] ?? false;
        const resources = mod.resources || moduleResources[index] || [];
        const activeTitle = mod.title || mod.module_title || `Module ${mod.week_number}`;

        return (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card/50 overflow-hidden transition-all duration-200"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(index)}
              className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                W{mod.week_number}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{activeTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  {mod.topics.length} topics · {mod.objectives.length} objectives
                </p>
              </div>
              <Badge variant="outline" className={`shrink-0 ${getMasteryColor(mod.mastery_score)}`}>
                <Trophy size={12} className="mr-1" />
                {getMasteryLabel(mod.mastery_score)}
              </Badge>
              {isOpen ? (
                <ChevronDown size={20} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight size={20} className="shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* Expanded Content */}
            {isOpen && (
              <div className="border-t border-border px-5 pb-5">
                {/* Objectives */}
                <div className="mt-4 mb-4">
                  <h5 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <Target size={14} />
                    Objectives
                  </h5>
                  <ul className="space-y-1.5">
                    {mod.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Topics */}
                <div className="mb-4">
                  <h5 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <BookOpen size={14} />
                    Topics
                  </h5>
                  <div className="grid gap-2">
                    {mod.topics.map((topic, i) => (
                      <div key={i} className="rounded-xl bg-muted/50 p-3">
                        <p className="font-medium text-sm text-foreground">{topic.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                {resources.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      📚 Resources
                    </h5>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {resources.map((res, i) => (
                        <ResourceCard key={i} resource={res} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => fetchResources(index, mod)}
                    disabled={loadingResources[index]}
                  >
                    {loadingResources[index] ? (
                      <><Loader2 size={14} className="mr-1.5 animate-spin" /> Fetching...</>
                    ) : resources.length > 0 ? (
                      '🔄 Refresh Resources'
                    ) : (
                      '🔍 Fetch Resources'
                    )}
                  </Button>
                  {onQuizClick && mod.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/45"
                      onClick={() => onQuizClick(mod.id!, activeTitle)}
                    >
                      📝 Take Quiz
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
