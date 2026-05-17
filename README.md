# OmniLearn — Unified AI Learning Workspace

**OmniLearn** is an immersive, high-fidelity online learning dashboard designed to eliminate cognitive friction, tool fragmentation, and the "paradox of choice" for modern autonomous students. It merges a curriculum planner, an active agentic tutor, a local privacy-first focus room, and an offline voice coach into a single context-aware environment that preserves the user's flow state.

This project is built for the **Gemma 4 Impact Challenge** under the *"Future of Education"* track.

---

## 🏗️ Architecture & Features

To avoid port, package, and environment conflicts, the repository is split into clean backend and frontend workspaces:

```
OmniLearn/
├── frontend/               # Next.js 15 + React 19 Frontend Web App
│   ├── app/                # App Router (Dashboard, Focus, Guider, Quiz, Voice)
│   ├── components/         # Modular React Components (Tailwind + Shadcn UI)
│   ├── context/            # Global Context Stores (AuthContext)
│   ├── lib/                # Utilities (audioSynth.ts, supabase.ts, utils.ts)
│   └── package.json        # Frontend Dependencies
│
├── app/                    # FastAPI Async Python Backend
│   ├── routes/             # Endpoints (course.py, tutor.py, session.py, quiz.py)
│   ├── services/           # Orchestrators (gemma.py, rag.py, quiz.py)
│   └── main.py             # FastAPI Server Entrypoint
│
└── README.md               # Documentation
```

### 🌟 Core Workspace Modules

1.  **AI Course Generator:** Upload PDFs/images or type topics. Gemma dynamically generates JSON-structured multi-week syllabi, and our *Agentic Resource Fetcher* retrieves real YouTube video links, articles, and docs using the YouTube Data API and curated search fallbacks.
2.  **Socratic AI Guider:** An elite conversational tutor utilizing Supabase `pgvector` RAG. Retrieves specific contextual embeddings from your uploaded course notes or syllabus and replies using strict Socratic pedagogy (asking guiding questions instead of giving flat answers).
3.  **Adaptive Mastery Quizzes:** Test your knowledge. If you fail to achieve a 70% threshold, the backend `quiz.py` engine automatically calls Gemma to mutate your syllabus, inserting remedial sub-topics into your Supabase database in real time.
4.  **Glassmorphic Focus Room:** A Pomodoro timer synchronized with a pure Web Audio API synthesizer. Mix Gamma/Alpha Binaural Beats and ambient rain without downloading external MP3s. Features a robust Markdown notes canvas that auto-saves directly to the Supabase `public.notes` table.
5.  **Voice Coach (Web Speech API):** An experimental workspace (`/dashboard/voice`) featuring an animated, pulsing orb. It listens to you explain concepts orally, transcribes it locally, and reads Gemma's responses out loud using the browser's native `speechSynthesis`.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19 (TypeScript)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Audio**: Native Web Audio API (`AudioContext`)
- **Voice**: Web Speech API (`webkitSpeechRecognition`)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **AI Orchestration**: Google GenAI SDK (`gemini-embedding-2` for RAG, `gemma-4-31b-it` for logic)
- **Database**: Supabase (PostgreSQL with `pgvector` extension)
- **Features**: Semantic Cosine Similarity search, RLS policies, real-time sync

---

## 🏃‍♂️ How to Run Locally

### 1. Database Setup (Supabase)
1. Create a Supabase project and enable `pgvector`.
2. Apply the schema (tables: `profiles`, `courses`, `modules`, `embeddings`, `quiz_attempts`, `focus_sessions`, `notes`).
3. Set your environment variables:
   - `frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
   - `.env` (root): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `YOUTUBE_API_KEY`

### 2. Running the FastAPI Backend
```powershell
# Ensure you are at the workspace root
cd c:\Projects\OmniLearn

# Activate the virtual environment
.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run the backend server with hot-reloading
uvicorn app.main:app --reload
```
👉 API docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

### 3. Running the Next.js Frontend
```powershell
# Navigate into the frontend workspace
cd frontend

# Install UI dependencies
npm install

# Start the Next.js development server
npm run dev
```
👉 Open **[http://localhost:3000](http://localhost:3000)** in your browser.
