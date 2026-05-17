"""
Study Room — Focus Session Tracking
Stores sessions in the Supabase `focus_sessions` table.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/sessions", tags=["Study Sessions"])


# ── Models ─────────────────────────────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    user_id: str
    topic: str
    course_name: Optional[str] = None
    planned_minutes: int = 25


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
    status: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(request: SessionStartRequest):
    if not request.user_id.strip():
        raise HTTPException(status_code=400, detail="user_id cannot be empty.")
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="topic cannot be empty.")
    if request.planned_minutes < 1 or request.planned_minutes > 480:
        raise HTTPException(status_code=400, detail="planned_minutes must be between 1 and 480.")

    client = get_supabase_client()
    
    session_id = str(uuid4())
    started_at = datetime.now(timezone.utc).isoformat()
    
    data = {
        "id": session_id,
        "user_id": request.user_id,
        "topic": request.topic,
        "planned_minutes": request.planned_minutes,
        "status": "active",
        "started_at": started_at
    }
    
    try:
        res = client.table("focus_sessions").insert(data).execute()
        
        return SessionResponse(
            session_id=session_id,
            user_id=request.user_id,
            topic=request.topic,
            course_name=request.course_name,
            planned_minutes=request.planned_minutes,
            actual_minutes=None,
            notes=None,
            started_at=started_at,
            ended_at=None,
            status="active"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")


@router.post("/end", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def end_session(request: SessionEndRequest):
    client = get_supabase_client()
    
    ended_at = datetime.now(timezone.utc).isoformat()
    
    try:
        # Verify session exists
        verify_res = client.table("focus_sessions").select("*").eq("id", request.session_id).eq("user_id", request.user_id).execute()
        if not verify_res.data:
            raise HTTPException(status_code=404, detail="Session not found.")
            
        session = verify_res.data[0]
        if session.get("status") == "completed":
            raise HTTPException(status_code=400, detail="Session already completed.")

        # Update the session
        update_data = {
            "ended_at": ended_at,
            "status": "completed",
            "actual_minutes": request.actual_minutes,
            "notes": request.notes
        }
        
        update_res = client.table("focus_sessions").update(update_data).eq("id", request.session_id).execute()
        
        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to update session.")
            
        updated = update_res.data[0]
        
        return SessionResponse(
            session_id=updated["id"],
            user_id=updated["user_id"],
            topic=updated["topic"],
            course_name=None, # Not stored in db, but that's fine
            planned_minutes=updated["planned_minutes"],
            actual_minutes=updated.get("actual_minutes"),
            notes=updated.get("notes"),
            started_at=updated["started_at"],
            ended_at=updated.get("ended_at"),
            status=updated["status"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


@router.get("/history/{user_id}", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
async def get_history(user_id: str):
    client = get_supabase_client()
    
    try:
        res = client.table("focus_sessions").select("*").eq("user_id", user_id).order("started_at", desc=True).execute()
        
        sessions = []
        for s in res.data:
            sessions.append(
                SessionResponse(
                    session_id=s["id"],
                    user_id=s["user_id"],
                    topic=s["topic"],
                    course_name=None,
                    planned_minutes=s["planned_minutes"],
                    actual_minutes=s.get("actual_minutes"),
                    notes=s.get("notes"),
                    started_at=s["started_at"],
                    ended_at=s.get("ended_at"),
                    status=s["status"]
                )
            )
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/stats/{user_id}", status_code=status.HTTP_200_OK)
async def get_stats(user_id: str):
    client = get_supabase_client()
    
    try:
        res = client.table("focus_sessions").select("*").eq("user_id", user_id).execute()
        
        user_sessions = res.data
        completed = [s for s in user_sessions if s.get("status") == "completed"]
        total_minutes = sum(s.get("actual_minutes") or 0 for s in completed)
        topics_studied = list({s.get("topic") for s in completed if s.get("topic")})

        return {
            "user_id": user_id,
            "total_sessions": len(user_sessions),
            "completed_sessions": len(completed),
            "total_minutes_studied": total_minutes,
            "topics_studied": topics_studied,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")
