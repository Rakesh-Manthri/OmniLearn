'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api, CourseListItem } from '@/services/api';
import { SyllabusTree } from '@/components/course/SyllabusTree';
import {
  Sparkles, BookOpen, Clock, BarChart3, ChevronRight, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
const DURATIONS = [2, 4, 6, 8, 12] as const;

export default function CourseGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Beginner');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved courses
  const [savedCourses, setSavedCourses] = useState<CourseListItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load user's saved courses on mount
  useEffect(() => {
    if (user?.id) {
      loadSavedCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadSavedCourses = async () => {
    if (!user?.id) return;
    setLoadingCourses(true);
    try {
      const data = await api.getUserCourses(user.id);
      setSavedCourses(data.courses || []);
    } catch {
      // Silently fail — courses list is non-critical
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const syllabus = await api.generateCourse(
        topic, durationWeeks, difficulty, user?.id
      );
      setResult(syllabus);
      // Refresh the saved courses list
      if (user?.id) loadSavedCourses();
    } catch (err: any) {
      setError(err.message || 'Failed to generate course. Make sure the FastAPI backend is running!');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourse = async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCourse(courseId);
      setResult({
        course_id: data.id,
        course_name: data.title,
        ...(data.syllabus || {}),
        modules: data.syllabus?.modules || data.modules || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-12 lg:gap-16 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6 lg:mb-10">
        <h2 className="font-heading text-5xl lg:text-6xl font-black mb-6 tracking-tight">
          AI Course Generator
        </h2>
        <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Enter any topic and let Gemma architect a structured learning roadmap with curated resources.
        </p>
      </div>

      {/* Generation Form */}
      <Card className="border-border shadow-md rounded-3xl bg-card">
        <CardContent className="flex flex-col items-center p-8 lg:p-12 gap-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <Sparkles size={28} className="text-primary" />
          </div>

          {/* Topic Input */}
          <div className="flex w-full max-w-[700px] gap-2">
            <Input
              placeholder="e.g. Quantum Computing, Rust Programming..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={isLoading}
              className="flex-1 h-14 text-lg rounded-xl px-6 shadow-sm border-border/50"
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              <div className="flex rounded-xl border border-border overflow-hidden">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <div className="flex rounded-xl border border-border overflow-hidden">
                {DURATIONS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setDurationWeeks(w)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      durationWeeks === w
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
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
            disabled={isLoading || !topic.trim()}
            size="lg"
            className="rounded-xl px-10 h-14 text-lg font-bold mt-4 shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? (
              <><Loader2 size={20} className="mr-2 animate-spin" /> Architecting Syllabus...</>
            ) : (
              <><Sparkles size={20} className="mr-2" /> Architect Course</>
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-400 text-center max-w-md">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Generated Syllabus Tree */}
      {result && result.modules && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {result.course_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result.target_audience} · {result.difficulty_level} · {result.modules.length} modules
              </p>
            </div>
            {result.course_id && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                ✓ Saved to Database
              </Badge>
            )}
          </div>

          <SyllabusTree
            courseId={result.course_id}
            courseName={result.course_name}
            modules={result.modules}
            onQuizClick={(moduleId) => router.push(`/dashboard/quiz/${moduleId}`)}
          />
        </div>
      )}

      {/* Saved Courses List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">My Courses</h3>
          {loadingCourses && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
        </div>

        {savedCourses.length === 0 && !loadingCourses ? (
          <Card className="rounded-2xl p-0">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <BookOpen size={40} className="text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No courses yet. Generate your first one above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {savedCourses.map((course) => (
              <Card
                key={course.id}
                className="rounded-2xl p-0 cursor-pointer transition-all hover:border-primary/30"
                onClick={() => loadCourse(course.id)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{course.course_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.module_count} modules · {course.duration_weeks} weeks · {course.difficulty_level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(course.created_at).toLocaleDateString()}
                    </span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
