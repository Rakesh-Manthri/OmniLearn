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
    duration_weeks: int = 4          # maps to semesters
    difficulty: str = "Beginner"
    hours: int = 15                  # weekly hours commitment
    goals: Optional[str] = ""
    style: Optional[str] = "balanced"
    industry: Optional[str] = ""
    selected_topics: List[str] = []
    notes: Optional[str] = ""
    user_id: Optional[str] = None    # If provided, course is saved to Supabase
    primary_model: Optional[str] = "gemma-32b"

class FetchResourcesRequest(BaseModel):
    course_id: str
    module_title: str
    topics: List[str]
    course_name: str = ""
    primary_model: Optional[str] = "gemma-32b"


class SaveCourseRequest(BaseModel):
    user_id: str
    course_name: str
    syllabus: dict
    difficulty: str
    duration_weeks: int


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
            hours=request.hours,
            goals=request.goals,
            style=request.style,
            industry=request.industry,
            selected_topics=request.selected_topics,
            notes=request.notes,
            primary_model=request.primary_model,
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

            # Insert course via SECURITY DEFINER RPC (bypasses RLS)
            course_rpc = db.rpc("insert_course", {
                "p_user_id": request.user_id,
                "p_title": course_data.course_name,
                "p_syllabus": course_data.model_dump(),
                "p_difficulty": course_data.difficulty_level,
                "p_duration_weeks": request.duration_weeks,
            }).execute()

            course_id = course_rpc.data

            # Insert modules
            for module in course_data.modules:
                db.rpc("insert_module", {
                    "p_course_id": course_id,
                    "p_week_number": module.week_number,
                    "p_title": module.module_title,
                    "p_topics": [t.model_dump() for t in module.topics],
                    "p_objectives": module.objectives,
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


@router.post("/save", status_code=status.HTTP_200_OK)
async def save_course(request: SaveCourseRequest):
    """Manually persist a generated course syllabus to Supabase."""
    try:
        db = get_supabase_client()

        # Insert course via SECURITY DEFINER RPC (bypasses RLS)
        course_rpc = db.rpc("insert_course", {
            "p_user_id": request.user_id,
            "p_title": request.course_name,
            "p_syllabus": request.syllabus,
            "p_difficulty": request.difficulty,
            "p_duration_weeks": request.duration_weeks,
        }).execute()

        course_id = course_rpc.data
        if not course_id:
            raise HTTPException(status_code=500, detail="Failed to insert course record.")

        # Insert modules
        modules = request.syllabus.get("modules", [])
        for module in modules:
            db.rpc("insert_module", {
                "p_course_id": course_id,
                "p_week_number": module.get("week_number"),
                "p_title": module.get("module_title"),
                "p_topics": module.get("topics", []),
                "p_objectives": module.get("objectives", []),
            }).execute()

        return {
            "status": "success",
            "course_id": course_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save course: {str(e)}")


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
            primary_model=request.primary_model,
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
        raise HTTPException(
            status_code=500,
            detail=f"Resource fetching failed: {str(e)}",
        )


@router.get("/{course_id}", status_code=status.HTTP_200_OK)
async def get_course(course_id: str):
    """Retrieve a single course with its modules."""
    try:
        db = get_supabase_client()

        # Retrieve course and modules via RPC (bypasses RLS safely)
        course_rpc = db.rpc("get_course_by_id", {"p_course_id": course_id}).execute()
        if not course_rpc.data:
            raise HTTPException(status_code=404, detail="Course not found.")

        return course_rpc.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve course: {str(e)}")


@router.delete("/{course_id}", status_code=status.HTTP_200_OK)
async def delete_course(course_id: str):
    """Delete a course and all its associated modules."""
    try:
        db = get_supabase_client()

        # Delete via SECURITY DEFINER RPC (handles cascade + bypasses RLS)
        db.rpc("delete_course_cascade", {"p_course_id": course_id}).execute()

        return {"status": "deleted", "course_id": course_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")


@router.get("/user/{user_id}", status_code=status.HTTP_200_OK)
async def list_user_courses(user_id: str):
    """List all courses for a given user."""
    try:
        db = get_supabase_client()

        # Query user courses and module counts via RPC (bypasses RLS safely)
        courses_rpc = db.rpc("get_user_courses", {"p_user_id": user_id}).execute()

        result = []
        for c in courses_rpc.data or []:
            result.append({
                "id": c["id"],
                "course_name": c["title"],
                "difficulty_level": c["difficulty"],
                "created_at": c["created_at"],
                "duration_weeks": c.get("duration_weeks", 4),
                "module_count": c.get("module_count", 0),
            })

        return {"courses": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list courses: {str(e)}")
