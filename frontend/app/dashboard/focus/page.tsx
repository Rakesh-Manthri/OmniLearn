'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, CourseListItem } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audioSynth';
import {
  Play, Pause, RotateCcw, Coffee, Headphones, Volume2, Sparkles,
  BookOpen, ChevronRight, FileText, CheckCircle, Clock, Zap, HeartPulse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_CONFIGS = {
  focus: { label: 'Focus Block', duration: 25, color: 'text-primary border-primary/20' },
  shortBreak: { label: 'Short Break', duration: 5, color: 'text-emerald-400 border-emerald-500/20' },
  longBreak: { label: 'Long Break', duration: 15, color: 'text-sky-400 border-sky-500/20' }
};

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Silence', icon: '🔇' },
  { id: 'gamma', label: 'Gamma Beats (Focus)', icon: '🧠' },
  { id: 'alpha', label: 'Alpha Beats (Relax)', icon: '🎧' },
  { id: 'rain', label: 'Soft Rain', icon: '🌧️' }
];

export default function FocusRoomPage() {
  const { user } = useAuth();

  // Courses & Syllabus selection
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [focusTopic, setFocusTopic] = useState<string>('General Study');

  // Stats
  const [stats, setStats] = useState<any>({
    total_sessions: 0,
    completed_sessions: 0,
    total_minutes_studied: 0,
    topics_studied: []
  });

  // Timer States
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active DB Session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Sound States
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [volume, setVolume] = useState<number>(0.5);

  // Notes States
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>('Study Notes');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSaving, setNoteSaving] = useState<boolean>(false);
  const [noteStatus, setNoteStatus] = useState<string>('All clean');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial stats and user courses
  useEffect(() => {
    if (user?.id) {
      loadCourses();
      loadStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load courses
  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getUserCourses(user.id);
      setCourses(data.courses || []);
      if (data.courses?.length > 0) {
        // Auto-select first course
        const first = data.courses[0];
        setSelectedCourseId(first.id);
        setSelectedCourseName(first.course_name);
        fetchModules(first.id);
        fetchNoteForCourse(first.id);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  // Fetch modules for selected course
  const fetchModules = async (courseId: string) => {
    try {
      const data = await api.getCourse(courseId);
      const mods = data.syllabus?.modules || data.modules || [];
      setModules(mods);
      if (mods.length > 0) {
        setSelectedModuleId(mods[0].id || '');
        setFocusTopic(mods[0].title || mods[0].module_title || 'Syllabus Focus');
      }
    } catch (err) {
      console.error('Failed to load course modules:', err);
    }
  };

  // Fetch stats from backend
  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getSessionStats(user.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Switch Course
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const matched = courses.find(c => c.id === courseId);
    if (matched) {
      setSelectedCourseName(matched.course_name);
    }
    fetchModules(courseId);
    fetchNoteForCourse(courseId);
  };

  // Switch Module
  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const matched = modules.find(m => m.id === moduleId);
    if (matched) {
      setFocusTopic(matched.title || matched.module_title);
    }
  };

  // Timer Core logic
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Handle start click
  const handleStartTimer = async () => {
    if (isRunning) return;

    audioSynth.playStartChime();
    setIsRunning(true);
    setSessionStartTime(new Date());

    // Only start a DB focus session if it's a 'focus' block and user is authenticated
    if (mode === 'focus' && user?.id) {
      try {
        const plannedMin = Math.ceil(timeLeft / 60);
        const res = await api.startSession(
          user.id,
          focusTopic,
          selectedCourseName || 'Self Study',
          plannedMin
        );
        if (res && res.session_id) {
          setActiveSessionId(res.session_id);
        }
      } catch (err) {
        console.error('Failed to start DB session:', err);
      }
    }
  };

  // Handle pause click
  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  // Handle reset click
  const handleResetTimer = () => {
    setIsRunning(false);
    const mins = parseInt(customMinutes, 10) || MODE_CONFIGS[mode].duration;
    setTimeLeft(mins * 60);
    setActiveSessionId(null);
    setSessionStartTime(null);
  };

  // Timer finished
  const handleTimerComplete = async () => {
    setIsRunning(false);
    audioSynth.playCompleteChime();

    // End active DB session if present
    if (mode === 'focus' && user?.id && activeSessionId && sessionStartTime) {
      try {
        const elapsedMs = new Date().getTime() - sessionStartTime.getTime();
        const elapsedMins = Math.max(1, Math.round(elapsedMs / 1000 / 60));
        
        await api.endSession(
          user.id,
          activeSessionId,
          elapsedMins,
          `Completed focus session on: ${focusTopic}. Notes saved directly in workspace.`
        );
        setActiveSessionId(null);
        setSessionStartTime(null);
        loadStats(); // refresh statistics!
      } catch (err) {
        console.error('Failed to end DB session:', err);
      }
    }

    // Switch to break automatically
    if (mode === 'focus') {
      setMode('shortBreak');
      setTimeLeft(MODE_CONFIGS.shortBreak.duration * 60);
    } else {
      setMode('focus');
      setTimeLeft(MODE_CONFIGS.focus.duration * 60);
    }
  };

  // Change timer modes
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const mins = MODE_CONFIGS[newMode].duration;
    setCustomMinutes(mins.toString());
    setTimeLeft(mins * 60);
    setActiveSessionId(null);
    setSessionStartTime(null);
  };

  // Handle custom minutes change
  const handleCustomMinutesChange = (val: string) => {
    setCustomMinutes(val);
    const mins = parseInt(val, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 480) {
      setTimeLeft(mins * 60);
    }
  };

  // Sound selection change
  const handleSoundChange = (soundId: string) => {
    setAmbientSound(soundId);
    if (soundId === 'none') {
      audioSynth.stopAmbientNoise();
    } else if (soundId === 'gamma') {
      audioSynth.startBinauralBeats('gamma', volume);
    } else if (soundId === 'alpha') {
      audioSynth.startBinauralBeats('alpha', volume);
    } else if (soundId === 'rain') {
      audioSynth.startRainNoise(volume);
    }
  };

  // Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioSynth.setVolume(newVol);
  };

  // Notes: Fetch notes for selected course from Supabase
  const fetchNoteForCourse = async (courseId: string) => {
    if (!user?.id || !courseId) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setNoteContent(data.content || '');
        setNoteTitle(data.title || 'Study Notes');
        setNoteId(data.id);
      } else {
        setNoteContent('');
        setNoteTitle('Study Notes');
        setNoteId(null);
      }
      setNoteStatus('Synced');
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  // Notes: Autosave logic with debounce
  const triggerAutosave = (newContent: string, newTitle: string) => {
    setNoteContent(newContent);
    setNoteTitle(newTitle);
    setNoteStatus('Typing...');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveNoteToSupabase(newContent, newTitle);
    }, 1500); // 1.5 second debounce
  };

  const saveNoteToSupabase = async (content: string, title: string) => {
    if (!user?.id || !selectedCourseId) return;
    setNoteSaving(true);
    setNoteStatus('Saving...');
    try {
      const notePayload: any = {
        user_id: user.id,
        course_id: selectedCourseId,
        title: title || 'Study Notes',
        content: content,
        updated_at: new Date().toISOString()
      };
      
      if (noteId) {
        notePayload.id = noteId;
      }

      const { data, error } = await supabase
        .from('notes')
        .upsert(notePayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        throw error;
      }
      if (data) {
        setNoteId(data.id);
      }
      setNoteStatus('Saved');
    } catch (err) {
      console.error('Failed to autosave notes:', err);
      setNoteStatus('Save failed');
    } finally {
      setNoteSaving(false);
    }
  };

  // Cleanups
  useEffect(() => {
    return () => {
      audioSynth.stopAmbientNoise();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const progressPercent = (timeLeft / ((parseInt(customMinutes, 10) || 25) * 60)) * 100;
  const strokeDashoffset = 282.6 - (282.6 * progressPercent) / 100;

  const displayMins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const displaySecs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-in max-w-7xl mx-auto w-full">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Focus Room <Zap size={22} className="text-primary fill-primary/10" />
          </h2>
          <p className="text-muted-foreground mt-0.5">Link a course, synthesize ambient sound waves, and log deep work blocks.</p>
        </div>

        {/* Course Linker Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-secondary/35 border border-border/40 rounded-2xl p-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1">
            <BookOpen size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Linking Syllabus:</span>
          </div>

          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="bg-background border border-border/50 text-foreground text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            {courses.length === 0 ? (
              <option value="">No Courses Available</option>
            ) : (
              courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_name}</option>
              ))
            )}
          </select>

          {modules.length > 0 && (
            <select
              value={selectedModuleId}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="bg-background border border-border/50 text-foreground text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium max-w-[200px]"
            >
              {modules.map((m, idx) => (
                <option key={m.id || idx} value={m.id}>{m.title || m.module_title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Pomodoro, Timer state, Sound waves, Stats */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Timer Card */}
          <Card className="border-border/40 bg-card/65 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            <CardContent className="p-8 flex flex-col items-center">
              
              {/* Mode Toggles */}
              <div className="flex rounded-2xl bg-secondary/50 p-1 mb-8 w-full max-w-[340px] border border-border/20">
                {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                      mode === m
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {MODE_CONFIGS[m].label}
                  </button>
                ))}
              </div>

              {/* Topic focus badge */}
              <div className="mb-4">
                <Badge variant="secondary" className="bg-primary/5 border border-primary/20 text-primary px-3.5 py-1 text-sm font-semibold rounded-full gap-1.5">
                  <Sparkles size={12} className="animate-spin-slow" /> {focusTopic}
                </Badge>
              </div>

              {/* Circular SVG Timer */}
              <div className="relative h-64 w-64 flex items-center justify-center mb-8">
                {/* SVG background circle and progress overlay */}
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="90"
                    className="stroke-secondary fill-transparent"
                    strokeWidth="6"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="90"
                    className={`stroke-primary fill-transparent transition-all duration-1000`}
                    strokeWidth="8"
                    strokeDasharray="565.2"
                    strokeDashoffset={565.2 - (565.2 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inside Time text */}
                <div className="flex flex-col items-center z-10">
                  <span className="text-xs tracking-[3px] uppercase text-muted-foreground/80 font-bold mb-1">
                    {mode === 'focus' ? 'Deep Work' : 'Rest Block'}
                  </span>
                  <h1 className="text-6xl font-black tracking-tighter text-foreground font-heading leading-none">
                    {displayMins}:{displaySecs}
                  </h1>
                  
                  {/* Custom minutes setter */}
                  <div className="mt-3 flex items-center gap-1 bg-secondary/40 border border-border/20 rounded-xl px-2 py-0.5 text-xs text-muted-foreground hover:border-border transition-colors">
                    <Clock size={12} />
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => handleCustomMinutesChange(e.target.value)}
                      className="bg-transparent text-center font-bold w-6 border-none focus:outline-none p-0 text-foreground"
                      disabled={isRunning}
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetTimer}
                  className="h-12 w-12 rounded-2xl border-border/50 hover:bg-secondary active:scale-95 transition-all duration-200"
                >
                  <RotateCcw size={18} className="text-muted-foreground" />
                </Button>

                <Button
                  onClick={isRunning ? handlePauseTimer : handleStartTimer}
                  className="h-16 w-32 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all duration-200"
                >
                  {isRunning ? (
                    <><Pause size={18} className="mr-2 fill-current" /> Pause</>
                  ) : (
                    <><Play size={18} className="mr-2 fill-current" /> Focus</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTimerComplete}
                  className="h-12 w-12 rounded-2xl border-border/50 hover:bg-secondary active:scale-95 transition-all duration-200"
                  title="Force skip timer block"
                >
                  <ChevronRight size={18} className="text-muted-foreground" />
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Audio Beats Synthesizer Card */}
          <Card className="border-border/40 bg-card/65 backdrop-blur-xl rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h4 className="font-bold text-base text-foreground flex items-center gap-2 mb-4">
              <Headphones size={18} className="text-primary" /> Integrated Sound Wave Generator
            </h4>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {AMBIENT_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSoundChange(s.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                    ambientSound === s.id
                      ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                      : 'bg-secondary/25 border-border/40 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Volume Control */}
            {ambientSound !== 'none' && (
              <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3 border border-border/10 animate-fade-in">
                <Volume2 size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-primary bg-secondary/50 rounded-lg appearance-none cursor-pointer h-1"
                />
                <span className="text-xs font-bold text-muted-foreground w-8 text-right">{Math.round(volume * 100)}%</span>
              </div>
            )}
          </Card>

          {/* Focus Statistics Grid */}
          <Card className="border-border/40 bg-card/65 backdrop-blur-xl rounded-3xl p-6 shadow-xl relative overflow-hidden flex-1">
            <h4 className="font-bold text-base text-foreground flex items-center gap-2 mb-4">
              <HeartPulse size={18} className="text-primary animate-pulse" /> Focus Workspace Performance
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/35 border border-border/30 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-foreground block">{stats.total_sessions}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-1">Sessions</span>
              </div>
              <div className="bg-secondary/35 border border-border/30 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-foreground block">{stats.completed_sessions}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-1">Completed</span>
              </div>
              <div className="bg-secondary/35 border border-border/30 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-foreground block">{stats.total_minutes_studied}m</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-1">Total Time</span>
              </div>
            </div>

            {stats.topics_studied?.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Focus Subjects:</span>
                <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
                  {stats.topics_studied.map((t: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-secondary/30 text-foreground text-xs font-semibold px-2 py-0.5">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* RIGHT COLUMN: Note Taking Workspace, Autosave status */}
        <div className="lg:col-span-7 flex flex-col">
          
          <Card className="border-border/40 bg-card/65 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[600px]">
            
            {/* Notes Header Panel */}
            <div className="border-b border-border/40 p-5 bg-secondary/10 flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => triggerAutosave(noteContent, e.target.value)}
                  className="bg-transparent font-bold text-lg text-foreground border-none focus:outline-none p-0 w-full"
                  placeholder="Note Title"
                  disabled={!selectedCourseId}
                />
              </div>

              {/* Sync Badge */}
              <div className="shrink-0 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${
                  noteStatus === 'Saved' || noteStatus === 'Synced' 
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' 
                    : noteStatus === 'Saving...' || noteStatus === 'Typing...'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-muted'
                }`} />
                <span className="text-[11px] font-bold text-muted-foreground">{noteStatus}</span>
              </div>
            </div>

            {/* Notes editor */}
            <div className="flex-1 p-6 flex flex-col">
              {selectedCourseId ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => triggerAutosave(e.target.value, noteTitle)}
                  className="flex-1 w-full bg-transparent text-foreground text-base border-none focus:outline-none resize-none leading-relaxed font-normal"
                  placeholder="💡 Start capturing your learning breakthroughs, formulas, concepts, or takeaways... Notes auto-save in real-time."
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <BookOpen size={48} className="text-muted-foreground/30 mb-3" />
                  <h4 className="font-bold text-lg text-foreground">No Course Selected</h4>
                  <p className="text-muted-foreground text-sm max-w-sm mt-1">
                    Generate or select an AI course syllabus at the top left to open your dedicated learning notes canvas.
                  </p>
                </div>
              )}
            </div>

            {/* Notes Markdown tips footer */}
            <div className="border-t border-border/30 p-4 bg-secondary/15 text-xs text-muted-foreground flex items-center justify-between">
              <span>✍️ Pure text notes are fully synced.</span>
              <span>Course-tied storage</span>
            </div>

          </Card>

        </div>

      </div>

    </div>
  );
}
