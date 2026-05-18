"""
Course Generation & Management Routes

Endpoints:
  POST /api/courses/generate        — Generate syllabus + persist to Supabase
  POST /api/courses/fetch-resources  — Agentic resource fetch for a module
  GET  /api/courses/{course_id}      — Retrieve a single course with modules
  GET  /api/courses/user/{user_id}   — List all courses for a user
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.gemma import GemmaService, GeneratedCourse, Resource
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/courses", tags=["Courses"])


# ── Request / Response models ──────────────────────────────────────────────────

class CourseGenerationRequest(BaseModel):
    topic: str
    duration_weeks: int = 4
    difficulty: str = "Beginner"
    user_id: Optional[str] = None  # If provided, course is saved to Supabase


class FetchResourcesRequest(BaseModel):
    course_id: str
    module_title: str
    topics: List[str]
    course_name: str = ""


class CourseResponse(BaseModel):
    id: str
    course_name: str
    target_audience: str
    difficulty_level: str
    user_id: Optional[str]
    modules: list
    resources: Optional[dict] = None


class CourseListItem(BaseModel):
    id: str
    course_name: str
    difficulty_level: str
    created_at: str
    module_count: int


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_course(request: CourseGenerationRequest):
    """Generate a course syllabus and optionally persist to Supabase."""
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic string cannot be empty.")
    if request.duration_weeks < 1 or request.duration_weeks > 52:
        raise HTTPException(status_code=400, detail="duration_weeks must be between 1 and 52.")
    if request.difficulty not in ("Beginner", "Intermediate", "Advanced"):
        raise HTTPException(
            status_code=400,
            detail="difficulty must be one of: Beginner, Intermediate, Advanced.",
        )

    try:
        course_data = await GemmaService.generate_syllabus(
            topic=request.topic,
            duration_weeks=request.duration_weeks,
            difficulty=request.difficulty,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Course generation failed: {str(e)}",
        )

    # If user_id provided, persist to Supabase
    if request.user_id:
        try:
            db = get_supabase_client()

            # Insert course record
            course_insert = db.table("courses").insert({
                "user_id": request.user_id,
                "title": course_data.course_name,
                "syllabus": course_data.model_dump(),
                "difficulty": course_data.difficulty_level,
                "duration_weeks": request.duration_weeks,
            }).execute()

            course_id = course_insert.data[0]["id"]

            # Insert modules
            for module in course_data.modules:
                db.table("modules").insert({
                    "course_id": course_id,
                    "week_number": module.week_number,
                    "title": module.module_title,
                    "topics": [t.model_dump() for t in module.topics],
                    "objectives": module.objectives,
                }).execute()

            return {
                "course_id": course_id,
                **course_data.model_dump(),
            }
        except Exception as e:
            # Return the generated course even if DB save fails
            return {
                "course_id": None,
                "db_error": str(e),
                **course_data.model_dump(),
            }

    return course_data.model_dump()


@router.post("/fetch-resources", status_code=status.HTTP_200_OK)
async def fetch_resources(request: FetchResourcesRequest):
    """Use Gemma function calling to fetch live educational resources for a module."""
    if not request.module_title.strip():
        raise HTTPException(status_code=400, detail="module_title cannot be empty.")

    try:
        resources = await GemmaService.fetch_resources_for_module(
            course_name=request.course_name,
            module_title=request.module_title,
            topics=request.topics,
        )

        resource_dicts = [r.model_dump() for r in resources]

        # If course_id provided, update the course record
        if request.course_id:
            try:
                db = get_supabase_client()

                # Fetch existing resources
                existing = db.table("courses").select("syllabus").eq(
                    "id", request.course_id
                ).single().execute()

                if existing.data:
                    syllabus = existing.data.get("syllabus", {})
                    # Attach resources to the matching module in syllabus
                    for mod in syllabus.get("modules", []):
                        if mod.get("module_title") == request.module_title:
                            mod["resources"] = resource_dicts
                            break

                    db.table("courses").update({
                        "syllabus": syllabus,
                    }).eq("id", request.course_id).execute()
            except Exception:
                pass  # Resources still returned even if DB update fails

        return {"resources": resource_dicts}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Resource fetching failed: {str(e)}",
        )


@router.get("/{course_id}", status_code=status.HTTP_200_OK)
async def get_course(course_id: str):
    """Retrieve a single course with its modules."""
    try:
        db = get_supabase_client()

        course = db.table("courses").select("*").eq("id", course_id).single().execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found.")

        modules = db.table("modules").select("*").eq(
            "course_id", course_id
        ).order("week_number").execute()

        return {
            **course.data,
            "modules": modules.data or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve course: {str(e)}")


@router.get("/user/{user_id}", status_code=status.HTTP_200_OK)
async def list_user_courses(user_id: str):
    """List all courses for a given user."""
    try:
        db = get_supabase_client()

        courses = db.table("courses").select(
            "id, title, difficulty, duration_weeks, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()

        result = []
        for c in courses.data or []:
            # Count modules for this course
            modules = db.table("modules").select(
                "id", count="exact"
            ).eq("course_id", c["id"]).execute()

            result.append({
                "id": c["id"],
                "course_name": c["title"],
                "difficulty_level": c["difficulty"],
                "created_at": c["created_at"],
                "duration_weeks": c.get("duration_weeks", 4),
                "module_count": modules.count or 0,
            })

        return {"courses": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list courses: {str(e)}")
