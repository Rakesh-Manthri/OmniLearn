"""
Study Room — Focus Session Tracking
Stores sessions in-memory (no DB required). Sessions reset on server restart.
Swap the `_sessions` dict for a real DB later if needed.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/sessions", tags=["Study Sessions"])

# ── In-memory store ────────────────────────────────────────────────────────────
# Structure: { user_id: [ session, ... ] }
_sessions: Dict[str, List[dict]] = {}


# ── Models ─────────────────────────────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    user_id: str
    topic: str
    course_name: Optional[str] = None
    planned_minutes: int = 25          # default Pomodoro block


class SessionEndRequest(BaseModel):
    user_id: str
    session_id: str
    actual_minutes: Optional[int] = None
    notes: Optional[str] = None


class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    topic: str
    course_name: Optional[str]
    planned_minutes: int
    actual_minutes: Optional[int]
    notes: Optional[str]
    started_at: str
    ended_at: Optional[str]
    status: str                        # "active" | "completed"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_session(user_id: str, session_id: str) -> Optional[dict]:
    for s in _sessions.get(user_id, []):
        if s["session_id"] == session_id:
            return s
    return None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(request: SessionStartRequest):
    if not request.user_id.strip():
        raise HTTPException(status_code=400, detail="user_id cannot be empty.")
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="topic cannot be empty.")
    if request.planned_minutes < 1 or request.planned_minutes > 480:
        raise HTTPException(status_code=400, detail="planned_minutes must be between 1 and 480.")

    session = {
        "session_id": str(uuid4()),
        "user_id": request.user_id,
        "topic": request.topic,
        "course_name": request.course_name,
        "planned_minutes": request.planned_minutes,
        "actual_minutes": None,
        "notes": None,
        "started_at": _now_iso(),
        "ended_at": None,
        "status": "active",
    }

    _sessions.setdefault(request.user_id, []).append(session)
    return SessionResponse(**session)


@router.post("/end", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def end_session(request: SessionEndRequest):
    session = _find_session(request.user_id, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed.")

    session["ended_at"] = _now_iso()
    session["status"] = "completed"
    session["actual_minutes"] = request.actual_minutes
    session["notes"] = request.notes
    return SessionResponse(**session)


@router.get("/history/{user_id}", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
async def get_history(user_id: str):
    user_sessions = _sessions.get(user_id, [])
    # Return most recent first
    return [SessionResponse(**s) for s in reversed(user_sessions)]


@router.get("/stats/{user_id}", status_code=status.HTTP_200_OK)
async def get_stats(user_id: str):
    user_sessions = _sessions.get(user_id, [])
    completed = [s for s in user_sessions if s["status"] == "completed"]
    total_minutes = sum(s["actual_minutes"] or 0 for s in completed)
    topics_studied = list({s["topic"] for s in completed})

    return {
        "user_id": user_id,
        "total_sessions": len(user_sessions),
        "completed_sessions": len(completed),
        "total_minutes_studied": total_minutes,
        "topics_studied": topics_studied,
    }
