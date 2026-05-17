from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/tutor", tags=["Tutor"])


# ── Request / Response models ──────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    text: str


class TutorChatRequest(BaseModel):
    course_context: str
    current_topic: str
    message: str
    history: Optional[List[ChatMessage]] = None


class TutorChatResponse(BaseModel):
    response: str


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=TutorChatResponse, status_code=status.HTTP_200_OK)
async def tutor_chat(request: TutorChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )

        system_instruction = f"""
You are an elite, empathetic Socratic AI Tutor. Your goal is to deeply teach the student.

CONTEXT RULES:
- Main Course Context: {request.course_context}
- Current Topic being studied: {request.current_topic}

BEHAVIOR RULES:
1. Keep responses concise, engaging, and format them clearly with Markdown.
2. Do not just give answers away. Use the Socratic method; ask guiding questions when appropriate.
3. If the student goes off-topic from {request.current_topic}, gently bring them back to the lesson.
"""

        # Build conversation history as proper Content objects
        contents: List[types.Content] = []
        if request.history:
            for msg in request.history:
                # Gemini expects role "user" or "model" only
                role = msg.role if msg.role in ("user", "model") else "user"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.text)],
                    )
                )

        # FIX: append the new user message as a proper Content object (was raw string before)
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=request.message)],
            )
        )

        # FIX: use async aio client to avoid blocking the event loop
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        return TutorChatResponse(response=response.text)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Tutor conversation failed: {str(e)}",
        )
