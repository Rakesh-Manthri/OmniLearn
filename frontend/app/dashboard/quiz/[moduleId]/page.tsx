'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, QuizQuestionItem, QuizSubmissionResponse } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Sparkles, BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params?.moduleId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz data
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  
  // Quiz results
  const [results, setResults] = useState<QuizSubmissionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserAndQuiz = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        setUserId(user.id);
        
        // Generate and fetch quiz questions
        const quizData = await api.generateQuiz(moduleId, user.id);
        setAttemptId(quizData.attempt_id);
        setModuleTitle(quizData.module_title);
        setQuestions(quizData.questions);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to generate quiz. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchUserAndQuiz();
    }
  }, [moduleId]);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (results) return; // Prevent selection after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId.toString()]: optionIdx
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(attemptId, selectedAnswers);
      setResults(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit quiz grading.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResults(null);
    setSelectedAnswers({});
    setLoading(true);
    setError(null);
    
    // Regenerate a fresh quiz
    if (userId && moduleId) {
      api.generateQuiz(moduleId, userId)
        .then(quizData => {
          setAttemptId(quizData.attempt_id);
          setModuleTitle(quizData.module_title);
          setQuestions(quizData.questions);
        })
        .catch(err => {
          setError(err.message || 'Failed to regenerate quiz.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[600px] p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <h2 className="text-xl font-semibold text-foreground">Drafting Quiz Questions...</h2>
          <p className="text-muted-foreground max-w-sm">
            Gemma is tailoring a unique, socratic multiple choice evaluation for your module topics.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[600px] p-6">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5 rounded-3xl p-6 text-center">
          <AlertCircle size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quiz Generation Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.back()} className="rounded-xl px-6">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const isComplete = answeredCount === questions.length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="flex flex-1 flex-col animate-fade-in p-6 bg-gradient-to-b from-background via-background/95 to-secondary/10">
      <div className="max-w-4xl mx-auto w-full flex flex-1 flex-col">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-xl">
            <ArrowLeft size={18} className="mr-1.5" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{moduleTitle}</h2>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                Evaluation
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">Test your concepts and earn course mastery</p>
          </div>
        </div>

        {/* Quiz Body */}
        {!results ? (
          <div className="flex flex-col gap-6">
            {/* Progress Card */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-3xl p-6 shadow-md">
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="text-muted-foreground">Answered questions</span>
                <span>{answeredCount} of {questions.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
            </Card>

            {/* Questions list */}
            {questions.map((q, idx) => (
              <Card key={q.id} className="border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-lg p-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">{q.question}</h3>
                    <div className="grid gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id.toString()] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border transition-all duration-200 text-base font-medium flex items-center justify-between ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-foreground shadow-sm shadow-primary/5 scale-[1.01]'
                                : 'bg-transparent border-border/80 hover:bg-secondary/40 hover:border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Submit Bar */}
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSubmit}
                disabled={!isComplete || submitting}
                className="rounded-2xl px-10 py-6 text-base font-semibold shadow-lg shadow-primary/10 hover:shadow-xl active:scale-95 transition-all"
              >
                {submitting ? 'Evaluating...' : 'Submit Answers'}
              </Button>
            </div>
          </div>
        ) : (
          /* Quiz Results Dashboard */
          <div className="flex flex-col gap-6">
            {/* Score Summary Panel */}
            <Card className={`border-border/40 bg-card/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <h3 className="text-3xl font-extrabold mb-1">
                {results.passed ? '🎉 Module Mastered!' : '📚 Practice Makes Perfect'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {results.passed 
                  ? 'Incredible! You have passed the Socratic mastery threshold for this course module.'
                  : 'You scored below the passing threshold. Let\'s learn from the explanations and try again!'}
              </p>

              <div className="inline-flex flex-col items-center justify-center p-6 rounded-full bg-secondary/60 mb-6 border border-border/30 relative">
                <span className="text-5xl font-black text-foreground">{Math.round(results.score * 100)}%</span>
                <span className="text-xs font-semibold text-muted-foreground mt-1">FINAL SCORE</span>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleRetake} className="rounded-xl px-6 py-5 font-semibold">
                  <RefreshCw size={16} className="mr-2" /> Retake Quiz
                </Button>
                <Button onClick={() => router.push('/dashboard/courses')} className="rounded-xl px-8 py-5 font-semibold shadow-lg">
                  Return to Syllabus
                </Button>
              </div>
            </Card>

            {/* Adaptive Remediation Mutate Card! */}
            {results.remediation_triggered && results.new_topics && (
              <Card className="border-accent/40 bg-accent/5 backdrop-blur-xl rounded-3xl p-6 shadow-lg border relative overflow-hidden animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-md shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Gemma Adaptive Mutation Activated!</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Because you've completed multiple attempts, Gemma has dynamically customized your syllabus with 2 targeted modular sub-topics to bridge your gaps.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      {results.new_topics.map((t, idx) => (
                        <div key={idx} className="bg-secondary/40 border border-border/40 rounded-2xl p-4 flex flex-col">
                          <span className="text-xs font-bold text-accent tracking-wider uppercase mb-1">New Sub-Topic</span>
                          <h4 className="font-bold text-foreground mb-1">{t.title}</h4>
                          <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Graded Review list */}
            {questions.map((q, idx) => {
              const selectedIdx = selectedAnswers[q.id.toString()];
              const correctIdx = results.correct_answers[q.id];
              const explanation = results.explanations[q.id];
              const isCorrect = selectedIdx === correctIdx;

              return (
                <Card key={q.id} className="border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-lg p-6">
                  <div className="flex gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm shrink-0 ${
                      isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-foreground leading-snug">{q.question}</h3>
                        <Badge variant="outline" className={isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>

                      <div className="grid gap-3 mb-4">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedIdx === optIdx;
                          const isCorrectOpt = correctIdx === optIdx;
                          
                          let style = 'border-border/80 text-muted-foreground';
                          if (isSelected) style = 'border-red-500 bg-red-500/5 text-foreground';
                          if (isCorrectOpt) style = 'border-green-500 bg-green-500/10 text-foreground font-semibold scale-[1.005]';

                          return (
                            <div
                              key={optIdx}
                              className={`px-5 py-3.5 rounded-2xl border text-base flex items-center justify-between transition-all ${style}`}
                            >
                              <span>{opt}</span>
                              <div className="shrink-0 ml-4">
                                {isCorrectOpt && <CheckCircle2 size={20} className="text-green-500" />}
                                {!isCorrectOpt && isSelected && <XCircle size={20} className="text-red-500" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Callout */}
                      <div className="bg-secondary/40 border border-border/40 rounded-2xl p-4 flex gap-3">
                        <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Explanation</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-1">{explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
