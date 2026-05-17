"""
Quiz Service — Generates, grades, and handles mastery/remediation loops
"""

import json
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.services.supabase_client import get_supabase_client
from app.services.rag import RAGService


# ── Models ─────────────────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str


class GeneratedQuiz(BaseModel):
    module_title: str
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    attempt_id: str
    answers: Dict[str, int]  # maps question ID (str) to selected option index (int)


class QuizSubmitResponse(BaseModel):
    attempt_id: str
    score: float
    passed: bool
    correct_answers: Dict[int, int]
    explanations: Dict[int, str]
    remediation_triggered: bool
    new_topics: Optional[List[dict]] = None


# ── Service ────────────────────────────────────────────────────────────────────

class QuizService:
    @staticmethod
    def _get_client() -> genai.Client:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_MS),
        )

    @staticmethod
    async def generate_quiz_for_module(module_id: str, user_id: str) -> Dict[str, Any]:
        """Fetch module details, semantic embeddings, generate a 5-question MCQ quiz and store in DB."""
        db = get_supabase_client()

        # 1. Fetch module details
        mod_res = db.table("modules").select("*").eq("id", module_id).single().execute()
        if not mod_res.data:
            raise ValueError("Module not found")
        
        module = mod_res.data
        module_title = module["title"]
        topics = module.get("topics", [])
        objectives = module.get("objectives", [])
        course_id = module.get("course_id")

        # 2. Fetch semantic context from uploaded documents
        context = ""
        topic_queries = " ".join([t.get("title", "") for t in topics])
        if topic_queries:
            matches = await RAGService.semantic_search(
                query=f"{module_title} {topic_queries}",
                user_id=user_id,
                course_id=course_id,
                limit=3
            )
            if matches:
                context = RAGService.build_context(matches)

        client = QuizService._get_client()

        prompt = f"""
You are an expert academic evaluator. Generate a rigorous 5-question multiple choice quiz to test a student's mastery of this module.

Module Title: {module_title}
Objectives: {', '.join(objectives)}
Topics covered: {json.dumps(topics)}

Additional Reference Material / Context:
{context if context else "No reference material supplied. Use standard course knowledge."}

REQUIREMENTS:
1. Generate exactly 5 multiple choice questions.
2. Each question must have exactly 4 plausible options.
3. Only one option must be fully correct.
4. Provide a clear, educational explanation for why the correct option is correct.
5. Return ONLY a valid JSON object matching the exact shape below. Do not include markdown fences or extra text.

JSON Shape:
{{
  "module_title": "{module_title}",
  "questions": [
    {{
      "id": 1,
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "string"
    }}
  ]
}}
"""

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2048,
                temperature=0.3,
            ),
        )

        quiz_data = json.loads(response.text)

        # 3. Store the generated quiz in `quiz_attempts` with a pending status
        attempt_insert = db.table("quiz_attempts").insert({
            "user_id": user_id,
            "module_id": module_id,
            "questions": quiz_data["questions"],
            "answers": {},
            "score": 0.0,
            "passed": False
        }).execute()

        attempt_id = attempt_insert.data[0]["id"]

        # 4. Strip the answers before returning to the client to prevent cheating
        client_questions = []
        for q in quiz_data["questions"]:
            client_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"]
            })

        return {
            "attempt_id": attempt_id,
            "module_title": module_title,
            "questions": client_questions
        }

    @staticmethod
    async def grade_and_process_quiz(request: QuizSubmitRequest) -> QuizSubmitResponse:
        """Grades the quiz, updates mastery, and triggers remediation loops if necessary."""
        db = get_supabase_client()

        # 1. Fetch the quiz attempt
        attempt_res = db.table("quiz_attempts").select("*").eq("id", request.attempt_id).single().execute()
        if not attempt_res.data:
            raise ValueError("Quiz attempt not found")
        
        attempt = attempt_res.data
        module_id = attempt["module_id"]
        user_id = attempt["user_id"]
        questions = attempt["questions"]  # Has the correct_index and explanation

        # 2. Grade the questions
        correct_answers = {}
        explanations = {}
        correct_count = 0
        total_questions = len(questions)

        for q in questions:
            q_id = q["id"]
            correct_idx = q["correct_index"]
            correct_answers[q_id] = correct_idx
            explanations[q_id] = q["explanation"]

            user_ans = request.answers.get(str(q_id))
            if user_ans is not None and int(user_ans) == correct_idx:
                correct_count += 1

        score = float(correct_count) / float(total_questions) if total_questions > 0 else 0.0
        passed = score >= 0.7  # 70% passing threshold (at least 4/5)

        # 3. Update the quiz attempt
        db.table("quiz_attempts").update({
            "answers": request.answers,
            "score": score,
            "passed": passed
        }).eq("id", request.attempt_id).execute()

        # 4. Fetch the module to evaluate mastery & remediation
        mod_res = db.table("modules").select("*").eq("id", module_id).single().execute()
        if not mod_res.data:
            raise ValueError("Module not found")
        module = mod_res.data
        current_mastery = module.get("mastery_score", 0.0) or 0.0
        remediation_count = module.get("remediation_count", 0) or 0
        topics = module.get("topics", [])
        module_title = module["title"]

        # Calculate new mastery score
        new_mastery = max(current_mastery, score)
        
        # 5. Handle remediation count & adaptive sub-topic mutation
        remediation_triggered = False
        new_topics = None

        if not passed:
            # Increment failure count
            new_remediation_count = remediation_count + 1
            
            # If the user has failed 2 or more times, trigger adaptive remediation sub-topics
            if new_remediation_count >= 2:
                remediation_triggered = True
                try:
                    new_topics = await QuizService.generate_remediation_topics(
                        module_title=module_title,
                        topics=topics,
                        quiz_questions=questions,
                        user_answers=request.answers
                    )
                    
                    if new_topics:
                        # Append the new topics to the module's topics array
                        updated_topics = topics + new_topics
                        db.table("modules").update({
                            "topics": updated_topics,
                            "remediation_count": 0,  # Reset counter after mutating topics
                            "mastery_score": new_mastery
                        }).eq("id", module_id).execute()
                except Exception as e:
                    print(f"Failed to generate remediation topics: {e}")
            else:
                # Update database with incremented counter
                db.table("modules").update({
                    "remediation_count": new_remediation_count,
                    "mastery_score": new_mastery
                }).eq("id", module_id).execute()
        else:
            # Passed! Reset remediation count
            db.table("modules").update({
                "remediation_count": 0,
                "mastery_score": new_mastery
            }).eq("id", module_id).execute()

        return QuizSubmitResponse(
            attempt_id=request.attempt_id,
            score=score,
            passed=passed,
            correct_answers=correct_answers,
            explanations=explanations,
            remediation_triggered=remediation_triggered,
            new_topics=new_topics
        )

    @staticmethod
    async def generate_remediation_topics(
        module_title: str, topics: List[dict], quiz_questions: List[dict], user_answers: Dict[str, int]
    ) -> List[dict]:
        """Call Gemma to generate 2 targeted, granular remediation sub-topics based on user's weak points."""
        client = QuizService._get_client()

        # Build list of questions the user got wrong
        wrong_questions = []
        for q in quiz_questions:
            q_id = str(q["id"])
            correct_idx = q["correct_index"]
            user_ans = user_answers.get(q_id)
            if user_ans is None or int(user_ans) != correct_idx:
                wrong_questions.append({
                    "question": q["question"],
                    "correct_answer": q["options"][correct_idx],
                    "explanation": q["explanation"]
                })

        prompt = f"""
You are an expert Socratic curriculum designer. A student is struggling with the module "{module_title}".
They failed the mastery quiz. Here are the specific questions they answered incorrectly:

{json.dumps(wrong_questions)}

Here is the current syllabus of topics for this module:
{json.dumps(topics)}

Generate exactly 2 new, highly specific, simplified sub-topics designed to bridge this cognitive gap and guide the student to absolute mastery.
Each sub-topic must have a concise title and a short explanation/learning directive.

Return ONLY a valid JSON list of 2 topic objects. Do not include markdown fences or extra commentary.

JSON Format:
[
  {{"title": "string", "description": "string"}},
  {{"title": "string", "description": "string"}}
]
"""

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=1024,
                temperature=0.4,
            ),
        )

        return json.loads(response.text)
