"""
RAG Service Module — Semantic search & context builder for AI Guider
"""

from typing import List, Optional
from google import genai
from google.genai import types
from app.config import settings
from app.services.supabase_client import get_supabase_client


class RAGService:
    @staticmethod
    def _get_client() -> genai.Client:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )

    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        """Generate vector embedding using gemini-embedding-2."""
        client = RAGService._get_client()
        res = await client.aio.models.embed_content(
            model="models/gemini-embedding-2",
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=1536)
        )
        return res.embeddings[0].values

    @staticmethod
    async def embed_and_store(
        text: str, user_id: str, course_id: Optional[str] = None, filename: str = ""
    ) -> bool:
        """Generate embedding for a text chunk and persist to Supabase."""
        try:
            embedding = await RAGService.get_embedding(text)
            db = get_supabase_client()
            
            db.table("embeddings").insert({
                "user_id": user_id,
                "course_id": course_id,
                "content": text,
                "embedding": embedding,
                "metadata": {"filename": filename} if filename else {},
            }).execute()
            
            return True
        except Exception as e:
            print(f"Failed to embed and store chunk: {e}")
            return False

    @staticmethod
    async def semantic_search(
        query: str, user_id: str, course_id: Optional[str] = None, threshold: float = 0.7, limit: int = 5
    ) -> List[dict]:
        """Perform semantic search using pgvector via match_documents RPC."""
        try:
            query_embedding = await RAGService.get_embedding(query)
            db = get_supabase_client()
            
            params = {
                "query_embedding": query_embedding,
                "match_threshold": threshold,
                "match_count": limit,
            }
            
            res = db.rpc("match_documents", params).execute()
            
            # Filter matches by user_id and optionally course_id in Python if RPC returned broad matches
            matches = []
            for item in res.data or []:
                # Verify match is owned by the current user
                if item.get("user_id") == user_id:
                    if course_id and item.get("course_id") != course_id:
                        continue
                    matches.append(item)
                    
            return matches
        except Exception as e:
            print(f"Semantic search failed: {e}")
            return []

    @staticmethod
    def build_context(matches: List[dict]) -> str:
        """Format retrieved matches into a structured context block for the LLM."""
        if not matches:
            return "No additional course file context available."
            
        context_parts = []
        for i, match in enumerate(matches, 1):
            source = match.get("metadata", {}).get("filename", "Unknown Document")
            content = match.get("content", "").strip()
            context_parts.append(f"--- Document chunk {i} [Source: {source}] ---\n{content}")
            
        return "\n\n".join(context_parts)
