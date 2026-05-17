from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.gemma import GemmaService, GeneratedCourse

router = APIRouter(prefix="/api/courses", tags=["Courses"])


class CourseGenerationRequest(BaseModel):
    topic: str
    duration_weeks: int = 4
    difficulty: str = "Beginner"


@router.post("/generate", response_model=GeneratedCourse, status_code=status.HTTP_200_OK)
async def generate_course(request: CourseGenerationRequest):
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
        return course_data
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Course generation failed: {str(e)}",
        )
