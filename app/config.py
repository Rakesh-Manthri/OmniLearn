import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
    GEMINI_TIMEOUT_MS: int = int(os.getenv("GEMINI_TIMEOUT_MS", "120000"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

settings = Settings()
