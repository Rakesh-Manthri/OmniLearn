# OmniLearn — Unified AI Learning Workspace

**OmniLearn** is an immersive, high-fidelity online learning dashboard designed to eliminate cognitive friction, tool fragmentation, and the "paradox of choice" for modern autonomous students. It merges a curriculum planner, an active agentic tutor, and a local privacy-first focus room into a single context-aware environment that preserves the user's flow state.

This project is built for the **Gemma 4 Impact Challenge** under the *"Future of Education"* track.

---

## 🏗️ Folder Architecture

To avoid port, package, and environment conflicts, the repository is split into clean backend and frontend workspaces:

```
OmniLearn/
├── frontend/               # Next.js 15 + React 19 Frontend Web App
│   ├── app/                # Next.js App Router (Dashboard, Focus Room, AI Guider)
│   ├── components/         # Modular React Components (Common, Course, Focus, Guider)
│   ├── context/            # Global Context Stores (AppState, Timer)
│   ├── hooks/              # Custom Hooks (useTimer, useGemmaLocal via WebGPU)
│   ├── next.config.js      # Next.js configurations
│   └── package.json        # Frontend Dependencies
│
├── app/                    # FastAPI Async Python Backend (from origin/backend branch)
│   ├── routes/             # API Endpoints (course.py, tutor.py, session.py)
│   ├── services/           # LLM Orchestrator services (gemma.py via google-genai SDK)
│   └── main.py             # FastAPI Server Entrypoint
│
├── .venv/                  # Python Virtual Environment (ignored)
├── requirements.txt        # Backend dependencies
└── README.md               # You are here
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Modules and CSS Custom Variables
- **Icons**: `lucide-react`

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn (Asynchronous ASGI server)
- **AI Orchestration**: Google GenAI SDK (`google-genai` for model integration)
- **LLM Engine**: Gemma Models (specifically calibrated with custom prompts for Socratic coaching and JSON schema generation)

---

## 🏃‍♂️ How to Run Locally

### 1. Running the Next.js Frontend
To launch the interactive, glassmorphic UI workspace:

```powershell
# Navigate into the frontend workspace
cd frontend

# Install UI dependencies
npm install

# Start the Next.js development server
npm run dev
```
👉 Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 2. Running the FastAPI Backend
To launch the AI orchestration server (when working on the backend branch):

```powershell
# Ensure you are at the workspace root
cd c:\Projects\OmniLearn

# Create a virtual environment (if not already done)
python -m venv .venv

# Activate the virtual environment
# On PowerShell:
.venv\Scripts\Activate.ps1
# On CMD:
.venv\Scripts\activate.bat

# Install backend dependencies
pip install -r requirements.txt

# Run the backend server with hot-reloading
uvicorn app.main:app --reload
```
👉 The API documentation will be available at **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

## 🌟 Immersive Core Workspace Modules

*   **Dashboard View**: The central hub featuring the active focus topic, quick toolkit navigation shortcuts, weekly progress indicators, and an interactive "Gemma Coach" sidebar widget.
*   **Course Generator**: An active ingestion workspace where students upload materials (textbooks, PDFs, transcripts) or paste YouTube links to produce structure-validated, multi-week study roadmaps.
*   **Focus Timer**: A deeply immersive Pomodoro room containing Gamma-Wave / Binaural Beats volume mixers, ambient sounds, and a local edge-powered companion.
*   **AI Guider View**: A full-screen conversational canvas with "Gemma Coach," calibrated dynamically as an elite Socratic tutor that uses targeted questions rather than direct answers to guide student discovery.
