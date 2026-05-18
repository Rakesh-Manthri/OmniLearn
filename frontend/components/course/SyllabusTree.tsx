'use client';

import React, { useState } from 'react';
import {
  ChevronDown, Trophy, Loader2,
  Youtube, BookText, FileCode2, ExternalLink, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, ResourceItem } from '@/services/api';

interface SubTopic { title: string; description: string; }
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

const ResIcon = ({ type }: { type: string }) => {
  if (type === 'video') return <Youtube size={13} className="text-rose-500" />;
  if (type === 'article') return <BookText size={13} className="text-sky-500" />;
  return <FileCode2 size={13} className="text-amber-500" />;
};

const resTagStyle: Record<string, string> = {
  video: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10',
  article: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/10',
  documentation: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
};
const resTagLabel: Record<string, string> = { video: 'Video', article: 'Article', documentation: 'Docs' };

const masteryConfig = (score?: number) => {
  if (!score) return { label: 'Not started', cls: 'bg-muted text-muted-foreground border-border' };
  if (score >= 0.8) return { label: `${Math.round(score * 100)}% Mastered`, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' };
  if (score >= 0.5) return { label: `${Math.round(score * 100)}% In Progress`, cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' };
  return { label: `${Math.round(score * 100)}% Needs Review`, cls: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' };
};

export function SyllabusTree({ courseId, courseName, modules, onQuizClick }: SyllabusTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [loadingRes, setLoadingRes] = useState<Record<number, boolean>>({});
  const [moduleRes, setModuleRes] = useState<Record<number, ResourceItem[]>>({});

  const toggle = (i: number) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const fetchResources = async (index: number, mod: Module) => {
    setLoadingRes(p => ({ ...p, [index]: true }));
    try {
      const t = mod.title || mod.module_title || `Module ${mod.week_number}`;
      const res = await api.fetchResources(courseId || '', t, mod.topics.map(x => x.title), courseName);
      setModuleRes(p => ({ ...p, [index]: res.resources }));
    } catch (e) { console.error(e); }
    finally { setLoadingRes(p => ({ ...p, [index]: false })); }
  };

  return (
    <div className="flex flex-col gap-3">
      {modules.map((mod, index) => {
        const isOpen = expanded[index] ?? false;
        const resources = mod.resources || moduleRes[index] || [];
        const title = mod.title || mod.module_title || `Module ${mod.week_number}`;
        const mastery = masteryConfig(mod.mastery_score);

        return (
          <div
            key={index}
            className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
              isOpen
                ? 'border-primary/25 shadow-[0_2px_20px_rgba(99,102,241,0.08)] bg-card'
                : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
            }`}
          >
            {/* Colored top strip — only visible when open */}
            <div className={`h-[3px] bg-gradient-to-r from-primary via-accent to-primary/20 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

            {/* ── Accordion header ── */}
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left focus:outline-none group"
            >
              {/* Week pill */}
              <div
                className={`flex flex-col h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none transition-all duration-200 ${
                  isOpen
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(99,102,241,0.35)]'
                    : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">W</span>
                <span className="text-base font-extrabold leading-tight">{mod.week_number}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-foreground truncate leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  {title}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {mod.topics.length} topics · {mod.objectives.length} objectives
                </p>
              </div>

              <Badge variant="outline" className={`shrink-0 hidden sm:flex text-[11px] font-semibold rounded-lg px-2.5 py-1 gap-1 ${mastery.cls}`}>
                <Trophy size={10} />
                {mastery.label}
              </Badge>

              <ChevronDown
                size={16}
                className={`shrink-0 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-muted-foreground'}`}
              />
            </button>

            {/* ── Body ── */}
            {isOpen && (
              <div className="animate-fade-in">
                {/* Top border + slight indent visual */}
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent mx-5" />

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-0 mt-2 mb-2">

                  {/* ═══ LEFT COLUMN ═══ */}
                  <div className="flex flex-col py-4 px-5 gap-6">

                    {/* Objectives */}
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-primary/70 mb-3">
                        Learning Objectives
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {mod.objectives.map((obj, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span
                              className="flex h-[22px] w-[22px] shrink-0 mt-[1px] items-center justify-center rounded-full text-[10px] font-bold bg-primary/10 text-primary"
                            >
                              {i + 1}
                            </span>
                            <p className="text-[13.5px] text-foreground/75 leading-relaxed">{obj}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider between sections */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">topics</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Topics */}
                    <div className="flex flex-col gap-3">
                      {mod.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3.5 transition-colors hover:bg-muted/60"
                        >
                          <p className="text-[13.5px] font-semibold text-foreground leading-snug">{topic.title}</p>
                          <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">{topic.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ═══ VERTICAL DIVIDER ═══ */}
                  <div className="hidden md:block bg-border/70 my-4" />

                  {/* ═══ RIGHT COLUMN ═══ */}
                  <div className="flex flex-col py-4 px-5 gap-4 border-t border-border md:border-t-0">

                    {/* Resources header */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-primary/70">
                        Curated Resources
                      </p>
                      <Button
                        size="sm"
                        onClick={() => fetchResources(index, mod)}
                        disabled={loadingRes[index]}
                        variant={resources.length > 0 ? 'outline' : 'default'}
                        className="h-7 rounded-lg px-3 text-[11px] font-bold"
                      >
                        {loadingRes[index]
                          ? <><Loader2 size={11} className="mr-1.5 animate-spin" />Fetching…</>
                          : resources.length > 0 ? '↺ Refresh' : 'Fetch Resources'
                        }
                      </Button>
                    </div>

                    {/* Empty state */}
                    {resources.length === 0 && !loadingRes[index] && (
                      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 py-10 bg-muted/20 text-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Sparkles size={16} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-[12.5px] text-muted-foreground max-w-[170px] leading-relaxed">
                          Fetch AI-curated videos, articles, and docs for this module
                        </p>
                      </div>
                    )}

                    {/* Resource cards */}
                    {resources.length > 0 && (
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-0.5">
                        {resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-start gap-3 rounded-xl border border-border bg-background p-3.5 transition-all hover:border-primary/25 hover:shadow-sm"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border group-hover:bg-primary/5 transition-colors">
                              <ResIcon type={res.source_type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                  {res.title}
                                </p>
                                <ExternalLink size={11} className="mt-0.5 shrink-0 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                              </div>
                              {res.description && (
                                <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-1">{res.description}</p>
                              )}
                              <span className={`mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${resTagStyle[res.source_type] || 'bg-muted text-muted-foreground'}`}>
                                {resTagLabel[res.source_type] || res.source_type}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Quiz CTA */}
                    {onQuizClick && mod.id && (
                      <div className="mt-auto pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl text-[13px] font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all"
                          onClick={() => onQuizClick(mod.id!, title)}
                        >
                          📝 Take Module Quiz
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom accent line when open */}
                <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent mx-5 mb-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
