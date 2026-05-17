"""
GemmaService — AI Course Generation & Agentic Resource Fetching

Uses Google GenAI SDK with:
  • Structured JSON output for syllabus generation
  • Native function calling for live resource search
"""

import json
import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List, Optional
from app.config import settings


# ── Data models ────────────────────────────────────────────────────────────────

class SubTopic(BaseModel):
    title: str
    description: str


class Resource(BaseModel):
    title: str
    url: str
    source_type: str  # "video" | "article" | "documentation"
    description: Optional[str] = None


class CourseModule(BaseModel):
    week_number: int
    module_title: str
    objectives: List[str]
    topics: List[SubTopic]
    resources: Optional[List[Resource]] = None


class GeneratedCourse(BaseModel):
    course_name: str
    target_audience: str
    difficulty_level: str
    modules: List[CourseModule]


# ── Tool declarations for function calling ─────────────────────────────────────

RESOURCE_TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="search_youtube_videos",
            description="Search YouTube for educational videos on a given topic. Returns video titles, URLs, and descriptions.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "query": types.Schema(type="STRING", description="Search query for YouTube videos"),
                    "max_results": types.Schema(type="INTEGER", description="Maximum number of results to return (1-5)"),
                },
                required=["query"],
            ),
        ),
        types.FunctionDeclaration(
            name="search_educational_articles",
            description="Search for educational articles and tutorials on a given topic from the web.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "query": types.Schema(type="STRING", description="Search query for educational articles"),
                    "domain": types.Schema(type="STRING", description="Preferred domain to search (e.g., 'medium.com', 'dev.to')"),
                },
                required=["query"],
            ),
        ),
        types.FunctionDeclaration(
            name="search_documentation",
            description="Search for official documentation and reference materials for a programming topic.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "query": types.Schema(type="STRING", description="Search query for documentation"),
                    "language": types.Schema(type="STRING", description="Programming language or framework name"),
                },
                required=["query"],
            ),
        ),
    ])
]


# ── Function handlers (live HTTP) ──────────────────────────────────────────────

async def _search_youtube_videos(query: str, max_results: int = 3) -> List[dict]:
    """Search YouTube using the real YouTube Data API if key is present."""
    results = []
    
    if settings.YOUTUBE_API_KEY:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                api_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&key={settings.YOUTUBE_API_KEY}&maxResults={max_results}"
                response = await client.get(api_url)
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("items", []):
                        video_id = item["id"]["videoId"]
                        snippet = item["snippet"]
                        results.append({
                            "title": snippet["title"],
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "source_type": "video",
                            "description": snippet.get("description", ""),
                        })
                    return results
            except Exception as e:
                print(f"YouTube API Error: {e}")
                
    # Fallback to direct links if API fails or key is missing
    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
    results.append({
        "title": f"{query} - YouTube Search",
        "url": search_url,
        "source_type": "video",
        "description": f"YouTube search results for: {query}",
    })
    return results


async def _search_educational_articles(query: str, domain: str = "") -> List[dict]:
    """Search for educational articles using curated resource links."""
    results = []
    # Build curated links for known educational platforms
    platforms = [
        ("Medium", f"https://medium.com/search?q={query.replace(' ', '+')}"),
        ("Dev.to", f"https://dev.to/search?q={query.replace(' ', '+')}"),
        ("freeCodeCamp", f"https://www.freecodecamp.org/news/search/?query={query.replace(' ', '+')}"),
        ("GeeksforGeeks", f"https://www.geeksforgeeks.org/search/{query.replace(' ', '-')}/"),
    ]
    for name, url in platforms[:3]:
        if domain and domain.lower() not in name.lower():
            continue
        results.append({
            "title": f"{query} — {name}",
            "url": url,
            "source_type": "article",
            "description": f"Educational articles about {query} on {name}",
        })
    return results if results else [platforms[0]]


async def _search_documentation(query: str, language: str = "") -> List[dict]:
    """Search for official documentation."""
    results = []
    # Map common languages/frameworks to their docs
    doc_sites = {
        "python": f"https://docs.python.org/3/search.html?q={query.replace(' ', '+')}",
        "javascript": f"https://developer.mozilla.org/en-US/search?q={query.replace(' ', '+')}",
        "react": f"https://react.dev/search?q={query.replace(' ', '+')}",
        "nextjs": f"https://nextjs.org/docs?q={query.replace(' ', '+')}",
        "rust": f"https://doc.rust-lang.org/std/?search={query.replace(' ', '+')}",
        "go": f"https://pkg.go.dev/search?q={query.replace(' ', '+')}",
    }
    lang_key = language.lower().strip() if language else ""
    if lang_key in doc_sites:
        results.append({
            "title": f"{query} — {language} Official Docs",
            "url": doc_sites[lang_key],
            "source_type": "documentation",
            "description": f"Official {language} documentation for {query}",
        })
    # Always include a general search fallback
    results.append({
        "title": f"{query} — Documentation Search",
        "url": f"https://devdocs.io/#q={query.replace(' ', '+')}",
        "source_type": "documentation",
        "description": f"Cross-language documentation search for {query}",
    })
    return results


# Map function names to handlers
FUNCTION_HANDLERS = {
    "search_youtube_videos": _search_youtube_videos,
    "search_educational_articles": _search_educational_articles,
    "search_documentation": _search_documentation,
}


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
        """Generate a structured course syllabus using Gemma/Gemini."""
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

    @staticmethod
    async def fetch_resources_for_module(
        course_name: str, module_title: str, topics: List[str]
    ) -> List[Resource]:
        """Use Gemma function calling to fetch live educational resources."""
        client = GemmaService._get_client()

        prompt = f"""
You are an educational resource curator. Find the best learning resources for a student.

Course: {course_name}
Module: {module_title}
Topics to cover: {', '.join(topics)}

Use the available tools to search for:
1. At least 2 YouTube video tutorials
2. At least 2 educational articles
3. At least 1 documentation reference

Call the tools now to fetch resources.
"""

        all_resources: List[Resource] = []

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
            ),
            tools=RESOURCE_TOOLS,
        )

        # Process function calls from the model response
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if part.function_call:
                    fn_name = part.function_call.name
                    fn_args = dict(part.function_call.args) if part.function_call.args else {}
                    handler = FUNCTION_HANDLERS.get(fn_name)
                    if handler:
                        try:
                            results = await handler(**fn_args)
                            for r in results:
                                all_resources.append(Resource(**r))
                        except Exception:
                            pass  # Skip failed function calls gracefully

        # If model didn't call tools, generate fallback resources
        if not all_resources:
            search_query = f"{module_title} {' '.join(topics[:2])}"
            yt = await _search_youtube_videos(search_query)
            articles = await _search_educational_articles(search_query)
            docs = await _search_documentation(search_query)
            for r in yt + articles + docs:
                all_resources.append(Resource(**r))

        return all_resources
