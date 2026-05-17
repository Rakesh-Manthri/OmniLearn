from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import course, tutor, session, quiz

app = FastAPI(title="Gemma Edu-Agent Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(course.router)
app.include_router(tutor.router)
app.include_router(session.router)
app.include_router(quiz.router)

@app.get("/")
async def root():
    return {"status": "healthy", "message": "Gemma Edu-Backend is live!"}
