from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List
from app.config import settings


# ── Data models ────────────────────────────────────────────────────────────────

class SubTopic(BaseModel):
    title: str
    description: str


class CourseModule(BaseModel):
    week_number: int
    module_title: str
    objectives: List[str]
    topics: List[SubTopic]


class GeneratedCourse(BaseModel):
    course_name: str
    target_audience: str
    difficulty_level: str
    modules: List[CourseModule]


# ── Service ────────────────────────────────────────────────────────────────────

class GemmaService:
    @staticmethod
    def _get_client() -> genai.Client:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )

    @staticmethod
    async def generate_syllabus(
        topic: str, duration_weeks: int, difficulty: str
    ) -> GeneratedCourse:
        client = GemmaService._get_client()

        prompt = f"""
Act as a university curriculum architect. Design a logically sequential study roadmap.

- Subject: {topic}
- Estimated Duration: {duration_weeks} weeks
- Intended Target Difficulty: {difficulty}

Return only valid JSON. Do not include markdown fences or extra commentary.
The JSON object must have this exact shape:
{{
  "course_name": "string",
  "target_audience": "string",
  "difficulty_level": "string",
  "modules": [
    {{
      "week_number": 1,
      "module_title": "string",
      "objectives": ["string"],
      "topics": [
        {{"title": "string", "description": "string"}}
      ]
    }}
  ]
}}

Create exactly {duration_weeks} modules.
Keep each module concise with 2 objectives and 2 topics.
"""

        # FIX: use async API (aio) to avoid blocking the event loop
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2048,
                temperature=0.4,
            ),
        )

        return GeneratedCourse.model_validate_json(response.text)
