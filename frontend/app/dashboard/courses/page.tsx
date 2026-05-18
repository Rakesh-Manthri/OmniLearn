'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api, CourseListItem } from '@/services/api';
import { SyllabusTree } from '@/components/course/SyllabusTree';
import {
  Sparkles, BookOpen, Clock, BarChart3, ChevronRight,
  Loader2, Trash2, RefreshCw, GraduationCap, Save, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
const DURATIONS = [2, 4, 6, 8, 12] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner:     'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  Intermediate: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Advanced:     'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

export default function CourseGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ── Generator state ──────────────────────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Beginner');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Save state ───────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── My Courses library ───────────────────────────────────────────────────────
  const [savedCourses, setSavedCourses] = useState<CourseListItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load library ─────────────────────────────────────────────────────────────
  const loadSavedCourses = useCallback(async () => {
    if (!user?.id) return;
    setLoadingCourses(true);
    try {
      const data = await api.getUserCourses(user.id);
      setSavedCourses(data.courses || []);
    } catch {
      // Silently fail — library is non-critical
    } finally {
      setLoadingCourses(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSavedCourses();
  }, [loadSavedCourses]);

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);
    setActiveCourseId(null);
    try {
      // Pass user_id so the backend auto-saves if the user is logged in
      const syllabus = await api.generateCourse(topic, durationWeeks, difficulty, user?.id);
      setResult(syllabus);
      if (syllabus.course_id) {
        setActiveCourseId(syllabus.course_id);
        setSaveSuccess(true);
        loadSavedCourses(); // Refresh library immediately
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate course. Make sure the backend is running!');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Manual Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id || !result || result.course_id) return;
    setIsSaving(true);
    try {
      const saveRes = await api.saveCourse(
        user.id,
        result.course_name,
        result,
        difficulty,
        durationWeeks,
      );
      setResult({ ...result, course_id: saveRes.course_id });
      setActiveCourseId(saveRes.course_id);
      setSaveSuccess(true);
      loadSavedCourses();
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Load a saved course into viewer ─────────────────────────────────────────
  const handleLoadCourse = async (courseId: string) => {
    if (activeCourseId === courseId) return; // already loaded
    setIsGenerating(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const data = await api.getCourse(courseId);
      setResult({
        course_id: data.id,
        course_name: data.title,
        ...(data.syllabus || {}),
        modules: data.syllabus?.modules || data.modules || [],
      });
      setActiveCourseId(courseId);
      setSaveSuccess(true); // Already in DB
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Delete a saved course ────────────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation(); // Don't trigger card click
    if (!confirm('Delete this course from your library?')) return;
    setDeletingId(courseId);
    try {
      await api.deleteCourse(courseId);
      setSavedCourses(prev => prev.filter(c => c.id !== courseId));
      // If currently viewing this course, clear the viewer
      if (activeCourseId === courseId) {
        setResult(null);
        setActiveCourseId(null);
        setSaveSuccess(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 lg:gap-16 animate-fade-in">

      {/* ── Page Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'hsl(var(--primary)/0.08)',
          borderRadius: '99px',
          padding: '0.35rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'hsl(var(--primary))',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <GraduationCap size={14} />
          AI-Powered Learning
        </div>
        <h2 className="font-heading text-5xl lg:text-6xl font-black mb-5 tracking-tight">
          Course Generator
        </h2>
        <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Enter any topic and let the AI architect a structured learning roadmap tailored to your goals.
        </p>
      </div>

      {/* ── Generation Form ── */}
      <Card className="border-border shadow-md rounded-3xl bg-card">
        <CardContent className="flex flex-col items-center p-8 lg:p-12 gap-8">
          <div style={{
            display: 'flex',
            height: '64px',
            width: '64px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            background: 'hsl(var(--primary)/0.1)',
          }}>
            <Sparkles size={28} className="text-primary" />
          </div>

          {/* Topic Input */}
          <div style={{ display: 'flex', width: '100%', maxWidth: '700px', gap: '0.5rem' }}>
            <Input
              placeholder="e.g. Quantum Computing, Rust Programming, Machine Learning..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={isGenerating}
              className="flex-1 h-14 text-lg rounded-xl px-6 shadow-sm border-border/50"
            />
          </div>

          {/* Options Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            {/* Difficulty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} className="text-muted-foreground" />
              <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                      background: difficulty === d ? 'hsl(var(--primary))' : 'transparent',
                      color: difficulty === d ? 'white' : 'hsl(var(--muted-foreground))',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} className="text-muted-foreground" />
              <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                {DURATIONS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setDurationWeeks(w)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                      background: durationWeeks === w ? 'hsl(var(--primary))' : 'transparent',
                      color: durationWeeks === w ? 'white' : 'hsl(var(--muted-foreground))',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            size="lg"
            className="rounded-xl px-10 h-14 text-lg font-bold mt-4 shadow-sm hover:shadow-md transition-all"
          >
            {isGenerating ? (
              <><Loader2 size={20} className="mr-2 animate-spin" /> Architecting Syllabus...</>
            ) : (
              <><Sparkles size={20} className="mr-2" /> Architect Course</>
            )}
          </Button>

          {error && (
            <div style={{
              background: 'hsl(var(--destructive)/0.08)',
              border: '1px solid hsl(var(--destructive)/0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              color: 'hsl(var(--destructive))',
              fontSize: '0.875rem',
              maxWidth: '560px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Generated Syllabus Viewer ── */}
      {result && result.modules && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Course meta header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                {result.course_name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                {result.target_audience && `${result.target_audience} · `}
                {result.modules.length} modules · {durationWeeks} weeks
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {/* Difficulty badge */}
              <Badge
                variant="outline"
                className={DIFFICULTY_COLORS[result.difficulty_level || difficulty] || DIFFICULTY_COLORS['Beginner']}
              >
                {result.difficulty_level || difficulty}
              </Badge>

              {/* Save / Saved indicator */}
              {saveSuccess || result.course_id ? (
                <Badge
                  variant="outline"
                  style={{
                    background: 'hsl(142 76% 36%/0.1)',
                    color: 'hsl(142 76% 36%)',
                    borderColor: 'hsl(142 76% 36%/0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.75rem',
                  }}
                >
                  <Check size={13} /> Saved to Library
                </Badge>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !user?.id}
                  size="sm"
                  style={{
                    background: 'hsl(142 76% 36%)',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0.375rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isSaving ? (
                    <><Loader2 size={15} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={15} /> Save to Library</>
                  )}
                </Button>
              )}
            </div>
          </div>

          <SyllabusTree
            courseId={result.course_id}
            courseName={result.course_name}
            modules={result.modules}
            onQuizClick={(moduleId) => router.push(`/dashboard/quiz/${moduleId}`)}
          />
        </div>
      )}

      {/* ── My Courses Library ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BookOpen size={20} className="text-primary" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
              My Course Library
            </h3>
            {savedCourses.length > 0 && (
              <span style={{
                background: 'hsl(var(--primary)/0.1)',
                color: 'hsl(var(--primary))',
                borderRadius: '99px',
                padding: '0.15rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {savedCourses.length}
              </span>
            )}
          </div>
          <button
            onClick={loadSavedCourses}
            disabled={loadingCourses}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={13} className={loadingCourses ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Empty state */}
        {savedCourses.length === 0 && !loadingCourses && (
          <Card className="rounded-2xl p-0">
            <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', textAlign: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'hsl(var(--muted))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem',
              }}>
                <GraduationCap size={26} className="text-muted-foreground/50" />
              </div>
              <p style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>No courses yet</p>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: '320px' }}>
                Generate and save your first course above — it'll appear here instantly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loadingCourses && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '76px',
                borderRadius: '14px',
                background: 'hsl(var(--muted)/0.5)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* Course cards */}
        {!loadingCourses && savedCourses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {savedCourses.map((course) => {
              const isActive = activeCourseId === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => handleLoadCourse(course.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: isActive
                      ? '1.5px solid hsl(var(--primary)/0.6)'
                      : '1px solid hsl(var(--border))',
                    background: isActive
                      ? 'hsl(var(--primary)/0.05)'
                      : 'hsl(var(--card))',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? '0 0 0 3px hsl(var(--primary)/0.1)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(var(--primary)/0.3)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(var(--border))';
                  }}
                >
                  {/* Left: Icon + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isActive ? 'hsl(var(--primary)/0.15)' : 'hsl(var(--primary)/0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <BookOpen size={18} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <div>
                      <p style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'hsl(var(--foreground))',
                        marginBottom: '0.15rem',
                      }}>
                        {course.course_name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                          {course.module_count} modules
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground)/0.5)' }}>·</span>
                        <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                          {course.duration_weeks}w
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground)/0.5)' }}>·</span>
                        <Badge
                          variant="outline"
                          style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', lineHeight: 1.4 }}
                          className={DIFFICULTY_COLORS[course.difficulty_level] || DIFFICULTY_COLORS['Beginner']}
                        >
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date + Active indicator + Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {isActive ? (
                      <Check size={16} style={{ color: 'hsl(var(--primary))' }} />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, course.id)}
                      disabled={deletingId === course.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        background: 'transparent',
                        color: 'hsl(var(--muted-foreground))',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--destructive)/0.1)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--destructive))';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--destructive)/0.4)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))';
                      }}
                      title="Delete course"
                    >
                      {deletingId === course.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
