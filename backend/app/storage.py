import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BACKEND_DIR / ".env")


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Initialize and reuse the backend Supabase client."""
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SECRET_KEY"]

    return create_client(url, key)


def get_storage_bucket() -> str:
    """Return the configured product image bucket."""
    return os.environ["SUPABASE_STORAGE_BUCKET"]


def list_product_images(path: str = "") -> list:
    """List objects in the product image bucket."""
    client = get_supabase_client()
    bucket = get_storage_bucket()

    return client.storage.from_(bucket).list(path)