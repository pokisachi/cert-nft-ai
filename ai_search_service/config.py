import os
from pathlib import Path
from dotenv import load_dotenv

# Load env from repo root (.env.local and .env)
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:3000").split(",")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.5"))

# Ensure SQLAlchemy asyncio uses asyncpg driver
def to_asyncpg_url(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("postgres://"):
        url = "postgresql" + url[len("postgres"):]
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

ASYNC_DATABASE_URL = to_asyncpg_url(DATABASE_URL)
