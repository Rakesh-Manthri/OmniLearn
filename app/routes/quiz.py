"""
Quiz Endpoints — API routing for quiz generation and submission
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any

from app.services.quiz import QuizService, QuizSubmitRequest, QuizSubmitResponse

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])


# ── Request Models ─────────────────────────────────────────────────────────────

class QuizGenerateRequest(BaseModel):
    module_id: str
    user_id: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_quiz(request: QuizGenerateRequest):
    """Generate a rigorous MCQ quiz for a specific module."""
    if not request.module_id.strip():
        raise HTTPException(status_code=400, detail="module_id cannot be empty.")
    if not request.user_id.strip():
        raise HTTPException(status_code=400, detail="user_id cannot be empty.")

    try:
        quiz = await QuizService.generate_quiz_for_module(
            module_id=request.module_id,
            user_id=request.user_id
        )
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")


@router.post("/submit", response_model=QuizSubmitResponse, status_code=status.HTTP_200_OK)
async def submit_quiz(request: QuizSubmitRequest):
    """Grade a submitted quiz and trigger remediation loop if mastery failed."""
    if not request.attempt_id.strip():
        raise HTTPException(status_code=400, detail="attempt_id cannot be empty.")

    try:
        response = await QuizService.grade_and_process_quiz(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")
