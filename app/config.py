import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Model Architecture Configurations
    PRIMARY_MODEL_CHOICE: str = os.getenv("PRIMARY_MODEL_CHOICE", "gemma-32b") # "gemma-32b" or "gemma-26b"
    MODEL_GEMMA_32B: str = os.getenv("MODEL_GEMMA_32B", "gemma-4-31b-it")
    MODEL_GEMMA_26B: str = os.getenv("MODEL_GEMMA_26B", "gemma-4-26b-a4b-it")
    MODEL_GEMINI_FLASH: str = os.getenv("MODEL_GEMINI_FLASH", "gemini-2.5-flash") 
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    GEMINI_TIMEOUT_MS: int = int(os.getenv("GEMINI_TIMEOUT_MS", "60000"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

settings = Settings()
