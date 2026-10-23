import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Locate backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"

# Load database configuration
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Check backend/.env."
    )

# Create the PostgreSQL connection engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT COUNT(*) FROM public.products")
        )
        return result.scalar_one()