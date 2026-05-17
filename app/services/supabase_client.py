"""
Supabase client for backend database operations.
Uses the service role for server-side data access.
"""

from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Create a Supabase client using environment credentials."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
