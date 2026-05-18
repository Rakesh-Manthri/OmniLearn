"""
GemmaService — AI Course Generation & Agentic Resource Fetching

Uses Google GenAI SDK with:
  • Structured JSON output for syllabus generation
  • Native function calling for live resource search
"""

import json
import httpx
import asyncio
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
    async def _generate_with_fallback(client: genai.Client, contents, config: types.GenerateContentConfig, primary_model_choice: str = None, **kwargs):
        """Execute generation with a prioritized fallback sequence."""
        choice = primary_model_choice or settings.PRIMARY_MODEL_CHOICE
        
        # Primary & secondary Gemma choices
        gemma_32b = settings.MODEL_GEMMA_32B
        gemma_26b = settings.MODEL_GEMMA_26B
        
        # Robust backup sequence of reliable high-speed models
        backups = [
            settings.MODEL_GEMINI_FLASH,     # gemini-2.5-flash
            "gemini-3-flash-preview",
            "gemini-2.0-flash",
            "gemini-2.5-pro"
        ]
        
        if choice == "gemma-32b":
            model_sequence = [gemma_32b, gemma_26b] + backups
        else:
            model_sequence = [gemma_26b, gemma_32b] + backups
            
        last_error = None
        for i, model_name in enumerate(model_sequence):
            try:
                print(f"[MODEL] [TRY] Attempting generation with {model_name}...")
                # Increase timeout to 60 seconds to allow comprehensive syllabuses to generate
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                        **kwargs
                    ),
                    timeout=60.0
                )
                print(f"[MODEL] [OK] {model_name} responded successfully.")
                return response
            except asyncio.TimeoutError:
                print(f"[MODEL] [WARN] {model_name} TIMEOUT. Falling back to next model...")
                last_error = Exception(f"Timeout for {model_name}")
            except Exception as e:
                error_msg = str(e)
                print(f"[MODEL] [WARN] {model_name} failed: {type(e).__name__} - {error_msg}")
                last_error = e
            
            # If not the last model, introduce cooldown sleep before retry to prevent rate-limit cascades
            if i < len(model_sequence) - 1:
                # Detect rate limit (429) or temporary server unavailability (503)
                is_rate_limit = "429" in str(last_error) or "503" in str(last_error) or "UNAVAILABLE" in str(last_error).upper() or "EXHAUSTED" in str(last_error).upper()
                sleep_time = 3.5 if is_rate_limit else 1.5
                print(f"[MODEL] [WAIT] Cooling down for {sleep_time}s to allow API rate pools to drain...")
                await asyncio.sleep(sleep_time)
                
        print(f"[MODEL] [FAIL] All models in fallback sequence failed.")
        raise last_error

    # ── CurricuForge-style prompt builder ──────────────────────────────────────

    @staticmethod
    def _build_prompt(
        skill: str, level: str, semesters: int, hours: int,
        industry: str, goals: str, style: str,
        selected_topics: List[str], notes: str
    ) -> str:
        """Build a rich, structured prompt — mirrors CurricuForge's approach."""
        prompt_parts = [
            f"You are an expert curriculum designer. Create a comprehensive {semesters}-week curriculum for '{skill}' at a {level} level.",
            f"Identify ALL individual modules needed to master '{skill}', then distribute them evenly across {semesters} weeks (2-3 modules per week).",
        ]

        parameters = [f"Weekly Commitment: {hours} hours"]
        if industry:
            parameters.append(f"Industry Focus: {industry}")
        if goals:
            parameters.append(f"Learning Goals: {goals}")
        if style:
            parameters.append(f"Instructional Style: {style}")
        if selected_topics:
            parameters.append(f"Key Topics to Include: {', '.join(selected_topics)}")
        if notes:
            parameters.append(f"Additional Context: {notes}")

        prompt_parts.append("\nParameters:")
        for p in parameters:
            prompt_parts.append(f"- {p}")

        prompt_parts.append(
            "\nYour response MUST follow this EXACT structure for automated parsing. "
            "DO NOT include any conversational text or extra information outside these tags:"
        )

        prompt_parts.append("\n<<OVERVIEW>>")
        prompt_parts.append("A professional, encouraging summary of the entire curriculum (max 3 sentences).")

        for i in range(1, semesters + 1):
            prompt_parts += [
                f"\n<<SEMESTER {i}>>",
                f"TITLE: (Descriptive theme for week {i})",
                "",
                "COURSE: (Module name)",
                "CREDITS: (Number of credits)",
                "DURATION: (Number of weeks, typically 1)",
                "TOPICS: (At least 5 specific topics, comma separated)",
                "DESCRIPTION: (2-3 sentences explaining what students learn)",
                "",
                "COURSE: (Second module name)",
                "CREDITS: (Number of credits)",
                "DURATION: (Number of weeks, typically 1)",
                "TOPICS: (At least 5 specific topics, comma separated)",
                "DESCRIPTION: (2-3 sentences explaining what students learn)",
            ]

        prompt_parts += [
            "\nRules:",
            "- Each week MUST have 2-3 modules",
            "- Each module MUST have at least 5 specific topics",
            "- Include credits and duration for every module",
            "- Maintain logical progression from foundational to advanced",
            "- Keep the tone educational, professional, and industry-aligned.",
        ]

        return "\n".join(prompt_parts)

    @staticmethod
    def _parse_curriculum_output(
        ai_output: str, topic: str, difficulty: str, duration_weeks: int
    ) -> GeneratedCourse:
        """
        Parse CurricuForge-style <<SEMESTER N>> / COURSE: text output
        into OmniLearn's GeneratedCourse model.
        """
        import re

        # Clean markdown artifacts
        cleaned = re.sub(r'\*\*', '', ai_output)
        cleaned = re.sub(r'#{1,3}\s*', '', cleaned)

        print(f"[PARSER] Raw output length: {len(ai_output)} chars")

        # Extract overview / summary
        summary = f"A comprehensive {duration_weeks}-week curriculum for {topic}."
        for pattern in [
            r'<<\s*OVERVIEW\s*>>(.*?)(?=<<|$)',
            r'Overview[:\s]*(.*?)(?=<<|Semester|\n\n)',
        ]:
            m = re.search(pattern, cleaned, re.DOTALL | re.IGNORECASE)
            if m and m.group(1).strip():
                summary = m.group(1).strip()
                break

        # Extract semester blocks
        semester_pattern = r'<<\s*SEMESTER[\s_]+(\d+)\s*>>'
        semester_blocks = re.split(r'(?=' + semester_pattern + r')', cleaned, flags=re.IGNORECASE)

        modules: List[CourseModule] = []

        for block in semester_blocks:
            sem_match = re.search(semester_pattern, block, re.IGNORECASE)
            if not sem_match:
                continue

            week_num = int(sem_match.group(1))
            content = re.sub(semester_pattern, '', block, count=1, flags=re.IGNORECASE).strip()
            content = re.sub(r'<<\s*/?\s*SEMESTER[\s_]*\d*\s*>>', '', content, flags=re.IGNORECASE).strip()

            # Extract semester title
            title = f"Week {week_num}"
            t_m = re.search(r'(?:SEMESTER_)?TITLE\s*:\s*(.*?)(?=\n)', content, re.IGNORECASE)
            if t_m and t_m.group(1).strip():
                title = t_m.group(1).strip()

            # Extract COURSE blocks
            course_splits = re.split(r'(?=(?:^|\n)\s*COURSE\s*:)', content, flags=re.IGNORECASE)
            course_idx = 0

            for cb in course_splits:
                cn_m = re.search(r'COURSE\s*:\s*(.*?)(?=\n|$)', cb, re.IGNORECASE)
                if not cn_m or not cn_m.group(1).strip():
                    continue

                course_name = cn_m.group(1).strip()
                if len(course_name) < 3:
                    continue

                # Topics → SubTopic objects
                subtopics: List[SubTopic] = []
                tp_m = re.search(
                    r'TOPICS?\s*:\s*(.*?)(?=\n\s*(?:DESCRIPTION|COURSE|<<)|$)',
                    cb, re.DOTALL | re.IGNORECASE
                )
                if tp_m:
                    for t in re.split(r'[,;\n]', tp_m.group(1)):
                        cleaned_t = re.sub(r'^\s*[\d.\-•*]+\s*', '', t).strip()
                        if cleaned_t and 2 < len(cleaned_t) < 150:
                            subtopics.append(SubTopic(title=cleaned_t, description=""))

                # Description → objectives
                desc = ""
                d_m = re.search(
                    r'DESCRIPTION\s*:\s*(.*?)(?=\n\s*(?:COURSE|<<)|$)',
                    cb, re.DOTALL | re.IGNORECASE
                )
                if d_m:
                    desc = d_m.group(1).strip()

                # Objectives: split description into sentences or use a default
                objectives = [s.strip() for s in re.split(r'\.(?=\s)', desc) if s.strip()][:2]
                if not objectives:
                    objectives = [f"Master {course_name}", "Apply concepts through practical exercises"]

                modules.append(CourseModule(
                    week_number=week_num,
                    module_title=f"Week {week_num}: {course_name}" if course_idx == 0 else course_name,
                    objectives=objectives,
                    topics=subtopics if subtopics else [
                        SubTopic(title=course_name, description=desc)
                    ],
                ))
                course_idx += 1

        if not modules:
            # Minimal fallback: create one module per week
            for w in range(1, duration_weeks + 1):
                modules.append(CourseModule(
                    week_number=w,
                    module_title=f"Week {w}: {topic}",
                    objectives=[f"Understand core concepts of {topic}", "Complete hands-on exercises"],
                    topics=[SubTopic(title=topic, description="Core concepts")],
                ))

        print(f"[PARSER] Generated {len(modules)} modules from {len(semester_blocks)} blocks")

        return GeneratedCourse(
            course_name=topic,
            target_audience=difficulty,
            difficulty_level=difficulty,
            modules=modules,
        )

    @staticmethod
    async def generate_syllabus(
        topic: str, duration_weeks: int, difficulty: str,
        hours: int = 15, goals: str = "", style: str = "balanced",
        industry: str = "", selected_topics: List[str] = None,
        notes: str = "", primary_model: str = "gemma-32b"
    ) -> GeneratedCourse:
        """Generate a rich, structured course syllabus using CurricuForge-style prompting."""
        client = GemmaService._get_client()
        selected_topics = selected_topics or []

        # Map difficulty → level label
        level_map = {"Beginner": "undergraduate", "Intermediate": "graduate", "Advanced": "professional"}
        level = level_map.get(difficulty, difficulty.lower())

        prompt = GemmaService._build_prompt(
            skill=topic, level=level, semesters=duration_weeks, hours=hours,
            industry=industry or "", goals=goals or "", style=style or "balanced",
            selected_topics=selected_topics, notes=notes or "",
        )

        response = await GemmaService._generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=4096,
                temperature=0.4,
            ),
            primary_model_choice=primary_model,
        )

        return GemmaService._parse_curriculum_output(
            ai_output=response.text,
            topic=topic,
            difficulty=difficulty,
            duration_weeks=duration_weeks,
        )

    @staticmethod
    async def fetch_resources_for_module(
        course_name: str, module_title: str, topics: List[str], primary_model: str = "gemma-32b"
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

        response = await GemmaService._generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
            ),
            tools=RESOURCE_TOOLS,
            primary_model_choice=primary_model,
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
