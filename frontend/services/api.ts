const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ResourceItem {
  title: string;
  url: string;
  source_type: 'video' | 'article' | 'documentation';
  description?: string;
}

export interface CourseListItem {
  id: string;
  course_name: string;
  difficulty_level: string;
  created_at: string;
  duration_weeks: number;
  module_count: number;
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  options: string[];
}

export interface QuizGenerationResponse {
  attempt_id: string;
  module_title: string;
  questions: QuizQuestionItem[];
}

export interface QuizSubmissionResponse {
  attempt_id: string;
  score: number;
  passed: boolean;
  correct_answers: Record<string, number>;
  explanations: Record<string, string>;
  remediation_triggered: boolean;
  new_topics?: { title: string; description: string }[];
}

export const api = {
  // ── Course Generator ──────────────────────────────────────────────────────
  generateCourse: async (topic: string, duration_weeks: number, difficulty: string, user_id?: string) => {
    const res = await fetch(`${BASE_URL}/api/courses/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, duration_weeks, difficulty, user_id })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate course syllabus');
    }
    return res.json();
  },

  fetchResources: async (course_id: string, module_title: string, topics: string[], course_name: string) => {
    const res = await fetch(`${BASE_URL}/api/courses/fetch-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id, module_title, topics, course_name })
    });
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json() as Promise<{ resources: ResourceItem[] }>;
  },

  getCourse: async (courseId: string) => {
    const res = await fetch(`${BASE_URL}/api/courses/${courseId}`);
    if (!res.ok) throw new Error('Failed to retrieve course');
    return res.json();
  },

  getUserCourses: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/courses/user/${userId}`);
    if (!res.ok) throw new Error('Failed to list courses');
    return res.json() as Promise<{ courses: CourseListItem[] }>;
  },

  // ── Embeddings API via Gemini ─────────────────────────────────────────────
  embedTexts: async (texts: string[]) => {
    const res = await fetch(`${BASE_URL}/api/tutor/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });
    if (!res.ok) throw new Error('Failed to generate embeddings');
    return res.json();
  },

  embedAndStore: async (content: string, userId: string, courseId?: string, filename?: string) => {
    const res = await fetch(`${BASE_URL}/api/tutor/embed-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, user_id: userId, course_id: courseId, filename })
    });
    if (!res.ok) throw new Error('Failed to securely embed and store document chunk');
    return res.json();
  },

  // ── AI Tutor / Guider API ─────────────────────────────────────────────────
  chatTutor: async (
    courseContext: string,
    currentTopic: string,
    message: string,
    history: any[],
    userId?: string,
    courseId?: string
  ) => {
    const res = await fetch(`${BASE_URL}/api/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_context: courseContext,
        current_topic: currentTopic,
        message,
        history,
        user_id: userId,
        course_id: courseId
      })
    });
    if (!res.ok) throw new Error('Failed to communicate with AI Tutor');
    return res.json();
  },

  uploadTutorImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/api/tutor/upload-image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to analyze image with Gemini Vision');
    return res.json() as Promise<{ analysis: string }>;
  },

  // ── Quiz Engine API ───────────────────────────────────────────────────────
  generateQuiz: async (moduleId: string, userId: string) => {
    const res = await fetch(`${BASE_URL}/api/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId, user_id: userId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate quiz');
    }
    return res.json() as Promise<QuizGenerationResponse>;
  },

  submitQuiz: async (attemptId: string, answers: Record<string, number>) => {
    const res = await fetch(`${BASE_URL}/api/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: attemptId, answers })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit quiz grading');
    }
    return res.json() as Promise<QuizSubmissionResponse>;
  },

  // ── Focus Room Sessions API ───────────────────────────────────────────────
  startSession: async (userId: string, topic: string, courseName: string, plannedMinutes: number) => {
    const res = await fetch(`${BASE_URL}/api/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        topic,
        course_name: courseName,
        planned_minutes: plannedMinutes
      })
    });
    if (!res.ok) throw new Error('Failed to start focus session');
    return res.json();
  },

  endSession: async (userId: string, sessionId: string, actualMinutes: number, notes: string) => {
    const res = await fetch(`${BASE_URL}/api/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        actual_minutes: actualMinutes,
        notes
      })
    });
    if (!res.ok) throw new Error('Failed to end focus session');
    return res.json();
  },

  getSessionStats: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/sessions/stats/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch session statistics');
    return res.json();
  }
};
