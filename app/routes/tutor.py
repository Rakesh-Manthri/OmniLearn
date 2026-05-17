import base64
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.services.rag import RAGService

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
    user_id: Optional[str] = None
    course_id: Optional[str] = None


class EmbedRequest(BaseModel):
    texts: List[str]


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]


class StoreEmbeddingRequest(BaseModel):
    content: str
    user_id: str
    course_id: Optional[str] = None
    filename: Optional[str] = None


class TutorChatResponse(BaseModel):
    response: str
    context_used: Optional[str] = None


# ── Endpoints ───────────────────────────────────────────────────────────────────

@router.post("/embed", response_model=EmbedResponse, status_code=status.HTTP_200_OK)
async def generate_embeddings(request: EmbedRequest):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    
    try:
        embeddings = []
        for text in request.texts:
            embedding = await RAGService.get_embedding(text)
            embeddings.append(embedding)
            
        return EmbedResponse(embeddings=embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@router.post("/embed-store", status_code=status.HTTP_201_CREATED)
async def store_chunk_embedding(request: StoreEmbeddingRequest):
    """Securely generate embedding on the backend and persist to Supabase."""
    success = await RAGService.embed_and_store(
        text=request.content,
        user_id=request.user_id,
        course_id=request.course_id,
        filename=request.filename or "",
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to store embedding in database.")
    return {"status": "success"}


@router.post("/chat", response_model=TutorChatResponse, status_code=status.HTTP_200_OK)
async def tutor_chat(request: TutorChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        # Perform backend-side RAG search if user_id is provided
        context_used = ""
        course_context = request.course_context
        
        if request.user_id:
            matches = await RAGService.semantic_search(
                query=request.message,
                user_id=request.user_id,
                course_id=request.course_id,
                threshold=0.7,
                limit=4,
            )
            if matches:
                context_used = RAGService.build_context(matches)
                course_context = f"{course_context}\n\n[Retrieved File Context]:\n{context_used}"

        client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )

        system_instruction = f"""
You are an elite, empathetic Socratic AI Tutor. Your goal is to deeply teach the student.

CONTEXT RULES:
- Main Course Context: {course_context}
- Current Topic being studied: {request.current_topic}

BEHAVIOR RULES:
1. Keep responses concise, engaging, and format them clearly with Markdown.
2. Do not just give answers away. Use the Socratic method; ask guiding questions when appropriate.
3. If the student goes off-topic from {request.current_topic}, gently bring them back to the lesson.
4. Utilize any retrieved file context supplied above to ground your answers.
"""

        # Build conversation history as proper Content objects
        contents: List[types.Content] = []
        if request.history:
            for msg in request.history:
                role = msg.role if msg.role in ("user", "model") else "user"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.text)],
                    )
                )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=request.message)],
            )
        )

        # Generate response using async aio client
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        return TutorChatResponse(
            response=response.text,
            context_used=context_used if context_used else None
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Tutor conversation failed: {str(e)}",
        )


@router.post("/upload-image", status_code=status.HTTP_200_OK)
async def upload_image(file: UploadFile = File(...)):
    """Accepts an image, sends to Gemini Vision API, and returns description/analysis."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    
    contents = await file.read()
    # Read MIME type
    mime_type = file.content_type or "image/png"
    
    try:
        client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )
        
        # Analyze using the default gemini model (multimodal support)
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=contents, mime_type=mime_type),
                "Analyze this educational image, diagram, or homework problem. Extract all visible text, equations, and thoroughly explain what is depicted."
            ]
        )
        
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Multimodal image analysis failed: {str(e)}"
        )
