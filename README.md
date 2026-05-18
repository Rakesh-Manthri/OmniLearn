# 🌌 OmniLearn — Unified AI Learning Workspace

[![Framework - FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Frontend - Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Database - Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![AI Orchestration - Gemma](https://img.shields.io/badge/AI--Orchestration-Gemma%20%26%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/gemma)

**OmniLearn** is an immersive, high-fidelity online learning dashboard designed to eliminate cognitive friction, tool fragmentation, and the "paradox of choice" for modern autonomous students. It merges a curriculum planner, an active agentic tutor, a local privacy-first focus room, and an offline voice coach into a single context-aware environment that preserves the user's flow state.

This project was built for the **Gemma 4 Impact Challenge** under the *"Future of Education"* track.

---

## 🏗️ Monorepo Architecture & Folder Structure

To completely eliminate package conflicts, port collisions, and execution overlaps, the repository is architected into clean, decoupled workspaces for the frontend and the backend:

```
OmniLearn/
├── frontend/               # Next.js 15 Frontend Web App
│   ├── app/                # App Router (Dashboard, Focus Room, AI Tutor, Quizzes, Voice Coach)
│   │   ├── dashboard/      # Primary dashboard workspaces
│   │   │   ├── courses/    # AI Course Generator & Course Library Viewer
│   │   │   ├── focus/      # Glassmorphic Focus Room with Binaural Beat synthethizers
│   │   │   ├── tutor/      # Socratic AI Tutor & pgvector RAG chatbot interface
│   │   │   ├── voice/      # Experimental Voice Coach (oral explanation transcriber)
│   │   │   └── quiz/       # Interactive Mastery Quizzes
│   ├── components/         # Premium design components (SyllabusTree, Shadcn UI buttons, inputs)
│   ├── context/            # Global context stores (AuthContext.tsx)
│   ├── services/           # Api integration client (api.ts)
│   └── package.json        # Frontend Node dependencies
│
├── app/                    # FastAPI Async Python Backend
│   ├── routes/             # API Endpoints (course.py, tutor.py, session.py, quiz.py)
│   ├── services/           # Heavy orchestrators (gemma.py, rag.py, quiz.py)
│   ├── config.py           # Project Environment variables & Secrets config
│   └── main.py             # FastAPI Server Entrypoint
│
├── .gitignore              # Project-wide monorepo gitignore
└── README.md               # Visual Documentation
```

---

## 🌟 Premium Core Workspace Modules

### 1. 🎓 AI Course Generator
*   **Intelligent Syllabus Architecture**: Enter any topic (e.g., *Quantum Computing*, *Rust Programming*) and choose your difficulty level and course duration.
*   **Dual-Model Speed Optimization**: Driven primarily by **Gemma 4 (31B)** logic with a lightning-fast, high-capacity fallback to **Gemini 1.5 Flash** to maintain immediate responsiveness during traffic spikes.
*   **Agentic Resource Fetcher**: Dynamically fetches genuine, non-placeholder learning resources (YouTube videos, scholarly articles, and technical documentation) using the YouTube Data API with curated search fallbacks.

### 2. 🤖 Socratic AI Guider & pgvector RAG
*   **Socratic Pedagogy Engine**: Instead of giving dry, copy-pasted answers, the AI tutor operates strictly on Socratic learning methodologies, responding with progressive, guiding questions to steer your critical thinking.
*   **Multi-Format Note Embeddings**: Securely upload custom course notes (PDFs/Images) or choose module topics. The notes are chunked, embedded using Google's `text-embedding-004`, and stored in a Supabase PostgreSQL database using the `pgvector` extension.
*   **Contextual Cosine Similarity**: Retrieves the exact reference chunks relevant to your chat message in real time to ground answers with maximum accuracy.

### 3. 🎯 Adaptive Mastery Quizzes (Auto-Remediation)
*   **Mastery Threshold Validation**: Dynamically generates targeted multi-question quizzes based on your course modules.
*   **Dynamic Syllabus Mutation**: If your score falls below a **70% mastery threshold**, the backend `quiz.py` engine automatically calls Gemma to isolate your weak areas and dynamically mutate your syllabus—inserting specialized remedial sub-topics into your database in real time.

### 4. 🧘 Glassmorphic Focus Room
*   **Procedural Audio Synthesizer**: A Pomodoro timer integrated with a Web Audio API system. Procedurally mixes **Gamma/Alpha Binaural Beats** and ambient rain frequencies directly inside your browser—completely offline, without downloading external MP3s.
*   **Markdown Notes Canvas**: A premium floating text editor that automatically saves your thoughts and code snippets directly to the Supabase database.

### 5. 🎙️ Voice Coach (Feynman Technique)
*   **Oral Explanation Orb**: An experimental verbal workspace featuring an animated, responsive SVG particle orb that pulses in sync with your speech.
*   **Native Transcription**: Transcribes your spoken concepts locally via the browser's Web Speech API and reads back Gemma's responses using high-quality Speech Synthesis.

---

## 🔒 Security & Database Integration (RLS & RPCs)

To safeguard user data while maintaining maximum read/write performance, the database architecture implements standard PostgreSQL **Row-Level Security (RLS)** in tandem with **`SECURITY DEFINER` Stored Procedures (RPCs)**:

*   **Secure Insert Operations**: Permissive policies allow anonymous writes while enforcing strict foreign key constraints pointing to user profiles.
*   **RPC Read/Delete Operations**:
    *   `get_user_courses(p_user_id)`: Fetches a user's course library with aggregated module counts in a single optimized database join query, bypassing client-side SELECT RLS locks.
    *   `get_course_by_id(p_course_id)`: Queries and aggregates a course along with all associated module rows into a nested JSON structure in one roundtrip.
    *   `delete_course_cascade(p_course_id)`: Implements high-performance administrative cascading deletes for courses and modules safely.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: Next.js 15 (App Router)
*   **Library**: React 19 (TypeScript)
*   **Styling**: Tailwind CSS v4 + Shadcn UI (Glassmorphic, custom dark-mode colors)
*   **Audio**: Native Web Audio API (`AudioContext`)
*   **Voice**: Web Speech API (`webkitSpeechRecognition`)

### Backend
*   **Framework**: FastAPI (Python 3.12+)
*   **AI Orchestration**: Google GenAI SDK (`gemini-embedding-2` for RAG, `gemma-4-31b-it` for logic)
*   **Database**: Supabase (PostgreSQL with `pgvector` extension)

---

## 🏃‍♂️ How to Run Locally

### 1. Database Setup (Supabase)
1. Create a Supabase project and enable `pgvector`.
2. Set up your environment variables:
   *   **Frontend Env (`frontend/.env.local`)**:
       ```env
       NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
       NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
       NEXT_PUBLIC_API_URL=http://localhost:8000
       ```
   *   **Backend Env (`.env` in root)**:
       ```env
       GEMINI_API_KEY=your-google-gemini-key
       SUPABASE_URL=https://your-supabase-project.supabase.co
       SUPABASE_ANON_KEY=your-anon-key
       YOUTUBE_API_KEY=your-youtube-data-api-key
       ```

### 2. Run the FastAPI Backend
```powershell
# Navigate to the workspace root
cd c:\Projects\OmniLearn

# Activate the virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the reload server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
👉 Interactive API Docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### 3. Run the Next.js Frontend
```powershell
# Open a new terminal and navigate to the frontend directory
cd c:\Projects\OmniLearn\frontend

# Install node dependencies
npm install

# Start the development server
npm run dev
```
👉 Open **[http://localhost:3000](http://localhost:3000)** in your browser!
