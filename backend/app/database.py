import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Locate backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"

# Load database configuration
load_dotenv(env_path)

RUNTIME_DATABASE_URL = os.getenv("RUNTIME_DATABASE_URL")

if not RUNTIME_DATABASE_URL:
    raise RuntimeError(
        "RUNTIME_DATABASE_URL is missing. Check backend/.env."
    )

# Create the PostgreSQL connection engine
ACTIVE_DATABASE_URL = RUNTIME_DATABASE_URL

engine = create_engine(
    ACTIVE_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT COUNT(*) FROM public.products")
        )
        return result.scalar_one()