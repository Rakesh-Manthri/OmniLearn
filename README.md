# Gemma Edu-Agent Backend

FastAPI backend for the AI-powered learning platform with three core features:
- **Syllabus Generator** — Structured course roadmap via Gemini AI
- **AI Tutor** — Socratic conversational tutor with session history
- **Study Room** — Focus session tracking (Pomodoro-style)

## Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
# Copy .env and fill in your Gemini API key
# GEMINI_API_KEY=your_key_here

# 4. Run the server
uvicorn app.main:app --reload
```

## API Endpoints

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/generate` | Generate a structured course syllabus |

**Request body:**
```json
{
  "topic": "Python Programming",
  "duration_weeks": 4,
  "difficulty": "Beginner"
}
```
`difficulty` must be one of: `Beginner`, `Intermediate`, `Advanced`

---

### AI Tutor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tutor/chat` | Chat with the Socratic AI tutor |

**Request body:**
```json
{
  "course_context": "Python Programming for Beginners",
  "current_topic": "Lists and Loops",
  "message": "What is a for loop?",
  "history": [
    { "role": "user", "text": "Hello" },
    { "role": "model", "text": "Hi! What would you like to learn today?" }
  ]
}
```

---

### Study Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/start` | Start a focus session |
| POST | `/api/sessions/end` | End a session and log actual time |
| GET | `/api/sessions/history/{user_id}` | Get all sessions for a user |
| GET | `/api/sessions/stats/{user_id}` | Get study statistics for a user |

**Start session body:**
```json
{
  "user_id": "student_01",
  "topic": "Lists and Loops",
  "course_name": "Python Programming",
  "planned_minutes": 25
}
```

**End session body:**
```json
{
  "user_id": "student_01",
  "session_id": "uuid-from-start-response",
  "actual_minutes": 23,
  "notes": "Covered for loops and list comprehensions"
}
```

---

## Interactive Docs

Visit `http://localhost:8000/docs` after starting the server for the full Swagger UI.

## Notes

- Study sessions are stored **in-memory** — they reset when the server restarts. Replace `_sessions` dict in `app/routes/session.py` with a database (SQLite/PostgreSQL) for persistence.
- Never commit your `.env` file. It is listed in `.gitignore`.
