from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import numpy as np
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
import io
import base64
try:
    # When running as a package from project root
    from ai_search_service.config import ASYNC_DATABASE_URL, ALLOW_ORIGINS, SIMILARITY_THRESHOLD
except ImportError:
    # When running inside ai_search_service directory (module main)
    from config import ASYNC_DATABASE_URL, ALLOW_ORIGINS, SIMILARITY_THRESHOLD

try:
    from ai_search_service.tests.retrieval_evaluation import evaluate_retrieval
except ImportError:
    from tests.retrieval_evaluation import evaluate_retrieval

app = FastAPI(title="AI Semantic Search Service")

# Serve static directory for charts
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
async def startup():
    global engine, embedder
    if not ASYNC_DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    engine = create_async_engine(ASYNC_DATABASE_URL, future=True)
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AISearchItem(BaseModel):
    tokenId: str
    courseTitle: str
    userName: Optional[str] = None
    similarity_score: float

@app.get("/certificates/ai-search")
async def ai_search(query: str):
    q = (query or "").strip()
    if not q:
        return []
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                'SELECT c."tokenId" AS "tokenId", u."name" AS "userName", co."title" AS "courseTitle" '
                'FROM "Certificate" c '
                'JOIN "User" u ON u."id" = c."userId" '
                'JOIN "Course" co ON co."id" = c."courseId"'
            )
        )
        rows = result.mappings().all()
    texts = [
        f"{(r['userName'] or '').strip()} {(r['courseTitle'] or '').strip()} {(r['tokenId'] or '').strip()}".strip()
        for r in rows
    ]
    q_emb = embedder.encode([q], normalize_embeddings=True)[0]
    d_emb = embedder.encode(texts, normalize_embeddings=True)
    sims = np.dot(d_emb, q_emb)
    items = [
        AISearchItem(
            tokenId=str(rows[i]["tokenId"]),
            courseTitle=str(rows[i]["courseTitle"]),
            userName=(rows[i]["userName"] or None),
            similarity_score=float(sims[i]),
        ).dict()
        for i in range(len(rows))
        if float(sims[i]) > SIMILARITY_THRESHOLD
    ]
    items.sort(key=lambda x: x["similarity_score"], reverse=True)
    metrics = evaluate_retrieval()
    return {
        "retrieval_metrics": metrics,
        "results": items,
    }

@app.get("/api/evaluate/search")
async def evaluate_search():
    metrics = evaluate_retrieval()
    return {
        "status": "success",
        "model_name": "all-MiniLM-L6-v2",
        "evaluation_type": "Đánh giá truy hồi (Độ chính xác@K)",
        "retrieval_metrics": metrics,
        "chart_url": "/static/retrieval_comparison_chart.png",
    }

class AISearchPdfIn(BaseModel):
    pdfBase64: str

@app.post("/certificates/ai-search-pdf")
async def ai_search_pdf(body: AISearchPdfIn):
    try:
        b = base64.b64decode(body.pdfBase64)
    except Exception:
        return []
    r = PdfReader(io.BytesIO(b))
    page_count = len(r.pages)
    take = min(page_count, 3)
    pdf_text = "\n".join([(r.pages[i].extract_text() or "") for i in range(take)])
    q = (pdf_text or "").strip()
    if not q:
        return []
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                'SELECT c."tokenId" AS "tokenId", u."name" AS "userName", co."title" AS "courseTitle" '
                'FROM "Certificate" c '
                'JOIN "User" u ON u."id" = c."userId" '
                'JOIN "Course" co ON co."id" = c."courseId"'
            )
        )
        rows = result.mappings().all()
    texts = [
        f"{(r['userName'] or '').strip()} {(r['courseTitle'] or '').strip()} {(r['tokenId'] or '').strip()}".strip()
        for r in rows
    ]
    q_emb = embedder.encode([q], normalize_embeddings=True)[0]
    d_emb = embedder.encode(texts, normalize_embeddings=True)
    sims = np.dot(d_emb, q_emb)
    items = [
        AISearchItem(
            tokenId=str(rows[i]["tokenId"]),
            courseTitle=str(rows[i]["courseTitle"]),
            userName=(rows[i]["userName"] or None),
            similarity_score=float(sims[i]),
        ).dict()
        for i in range(len(rows))
        if float(sims[i]) > SIMILARITY_THRESHOLD
    ]
    items.sort(key=lambda x: x["similarity_score"], reverse=True)
    return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
