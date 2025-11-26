from fastapi import FastAPI, HTTPException, Depends
from models import DedupBatchRequest
from config import CORPUS_BACKEND
from services.dedup_service_impl import DedupService
from services.corpus_repo.corpus_repo import get_corpus_repo
from fastapi.middleware.cors import CORSMiddleware
from services.evaluation_service import calculate_dedup_metrics, mock_evaluation_data, save_confusion_heatmap
from fastapi.responses import FileResponse
import os

# ----- app khởi tạo TRƯỚC mọi decorator
app = FastAPI(title="AI Dedup Service")

@app.on_event("startup")
async def startup():
    global repo, service
    repo = get_corpus_repo()
    await repo.init_table()
    service = DedupService(repo)

# ====== AI Dedup endpoint (đang dùng)
@app.post("/api/admin/certificates/ai-dedup-check")
async def ai_dedup_check(req: DedupBatchRequest):
    if not req.items:
        raise HTTPException(status_code=400, detail="INVALID_PAYLOAD")
    try:
        return await service.process_batch(req.items, req.options.dict() if req.options else {})
    except ValueError as e:
        msg = str(e)
        if msg in ["INVALID_PAYLOAD", "UNSUPPORTED_MEDIA"]:
            raise HTTPException(400, msg)
        elif msg == "PDF_PARSE_FAILED":
            raise HTTPException(422, msg)
        else:
            raise HTTPException(500, "INTERNAL_ERROR")

# ====== CORS (giữ nguyên)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Cho phép frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# v--- APPEND FROM HERE ---v
# =========================
from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any

# ---- Models cho Issue Final
class OnchainIn(BaseModel):
    chain: Literal["sepolia","mainnet"] = "sepolia"
    contract: str
    recipient: Optional[str] = None
    mintMode: Literal["ERC721","SBT","ERC1155"] = "ERC721"

class OptionsIn(BaseModel):
    return_: Literal["url","base64"] = Field("url", alias="return")
    ttl_seconds: int = 900
    compile_timeout_sec: int = 20
    source_date_epoch: Optional[int] = None

class IssueFinalIn(BaseModel):
    examResultId: int
    issue_date: str
    expiry_date: Optional[str] = None
    certificate_code: Optional[str] = None
    issuer_name: Optional[str] = None
    onchain: OnchainIn
    options: Optional[OptionsIn] = None

class IssueFinalOut(BaseModel):
    status: str = "ok"
    chainId: int
    contract: str
    tokenStandard: str
    tokenId: str
    txHash: str
    tokenUri: str
    ipfsCid: str            # CID PDF final
    verifyUrl: str
    docHash: str
    pdf: Dict[str, Any]
    metadata: Dict[str, Any]

# ---- Stubs (DEV gắn thật)
async def join_examresult_user_course(examResultId: int) -> dict: ...
async def is_dedup_unique(userId: int, courseId: int) -> bool: ...
async def exists_certificate(userId: int, courseId: int) -> bool: ...
async def get_certificate(userId: int, courseId: int) -> dict: ...
def map_cert_to_response(cert: dict) -> IssueFinalOut: ...
async def mint_onchain(onchain: OnchainIn, er: dict) -> dict: ...
async def render_final_pdf_with_qr(er: dict, body: IssueFinalIn, verify_url: str) -> tuple[bytes, str]: ...
async def ipfs_upload_pdf(pdf_bytes: bytes) -> str: ...
async def ipfs_upload_metadata_pdf_only(er: dict, ipfs_cid: str) -> str: ...
async def create_certificate(**kwargs) -> dict: ...
async def audit_log(action: str, actorId: int, cert: dict): ...

def require_admin():
    # TODO: thay bằng auth thật
    return {"userId": 1, "role": "ADMIN"}

# ---- NEW endpoint
@app.post("/api/certificates/issue-final", response_model=IssueFinalOut, tags=["Certificates"])
async def issue_final(body: IssueFinalIn, admin=Depends(require_admin)):
    er = await join_examresult_user_course(body.examResultId)
    if not er:
        raise HTTPException(404, "NOT_FOUND")
    if er.get("status") != "PASS":
        raise HTTPException(400, "NOT_PASS")

    if await exists_certificate(er["userId"], er["courseId"]):
        cert = await get_certificate(er["userId"], er["courseId"])
        return map_cert_to_response(cert)

    if not await is_dedup_unique(er["userId"], er["courseId"]):
        raise HTTPException(400, "DEdup_NOT_UNIQUE")

    try:
        mint_res = await mint_onchain(body.onchain, er)
    except Exception:
        raise HTTPException(422, "ONCHAIN_MINT_FAILED")

    verify_url = f"https://verify.example.com/cert?token={mint_res['tokenId']}"
    try:
        pdf_bytes, doc_hash = await render_final_pdf_with_qr(er, body, verify_url)
    except Exception:
        raise HTTPException(422, "TEX_COMPILE_FAILED")

    try:
        ipfs_cid = await ipfs_upload_pdf(pdf_bytes)
        token_uri = await ipfs_upload_metadata_pdf_only(er, ipfs_cid)
    except Exception:
        raise HTTPException(422, "IPFS_UPLOAD_FAILED")

    cert = await create_certificate(
        userId=er["userId"], courseId=er["courseId"], examResultId=er["id"],
        tokenId=mint_res["tokenId"], ipfsCid=ipfs_cid, docHash=doc_hash
    )
    await audit_log("CERT_ISSUE_FINAL", admin["userId"], cert)

    return IssueFinalOut(
        chainId=mint_res["chainId"],
        contract=mint_res["contract"],
        tokenStandard="ERC-721" if body.onchain.mintMode != "ERC1155" else "ERC-1155",
        tokenId=str(mint_res["tokenId"]),
        txHash=mint_res["txHash"],
        tokenUri=token_uri,
        ipfsCid=ipfs_cid,
        verifyUrl=verify_url,
        docHash=doc_hash,
        pdf={"url": f"https://ipfs.io/ipfs/{ipfs_cid}/certificate.pdf"},
        metadata={
            "examResultId": er["id"],
            "userId": er["userId"],
            "courseId": er["courseId"],
            "profile": er.get("profile", ""),
            "compiledWith": "xelatex@TL2024",
            "source_date_epoch": (body.options.source_date_epoch if body.options else None)
        }
    )

@app.post("/api/evaluate/dedup")
async def evaluate_dedup():
    y_true, y_pred = mock_evaluation_data()
    metrics = calculate_dedup_metrics(y_true, y_pred)
    heatmap_path = None
    try:
        heatmap_path = save_confusion_heatmap(y_true, y_pred)
    except Exception:
        heatmap_path = None
    return {
        "status": "success",
        "evaluation_metrics": metrics,
        "heatmap_url": "/api/evaluate/dedup/heatmap" if heatmap_path else None,
    }

@app.get("/api/evaluate/dedup/heatmap")
async def evaluate_dedup_heatmap():
    path = "dedup_confusion_matrix.png"
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    raise HTTPException(404, "HEATMAP_NOT_FOUND")

# ====== Optimization (Grid Search)
class PairIn(BaseModel):
    mhScore: float
    simhashScore: float
    y_true: int

class OptimizeIn(BaseModel):
    pairs: list[PairIn]
    alpha_grid: list[float] | None = None
    threshold_unique_grid: list[float] | None = None
    threshold_duplicate_grid: list[float] | None = None
    ambiguous_positive: bool = True

@app.post("/api/evaluate/dedup/optimize")
async def optimize_dedup(body: OptimizeIn):
    if not body.pairs:
        raise HTTPException(400, "EMPTY_PAIRS")
    alphas = body.alpha_grid or [0.3, 0.4, 0.5, 0.6, 0.7]
    tus = body.threshold_unique_grid or [0.75, 0.8]
    tds = body.threshold_duplicate_grid or [0.9, 0.95]

    y_true = [p.y_true for p in body.pairs]

    best = None
    surf = []
    for a in alphas:
        b = 1.0 - a
        for tu in tus:
            for td in tds:
                y_pred = []
                for p in body.pairs:
                    c = a * p.mhScore + b * p.simhashScore
                    if c < tu:
                        y_pred.append(0)
                    elif c >= td:
                        y_pred.append(1)
                    else:
                        y_pred.append(1 if body.ambiguous_positive else 0)
                m = calculate_dedup_metrics(y_true, y_pred)
                entry = {"alpha": round(a, 2), "threshold_unique": tu, "threshold_duplicate": td, "metrics": m}
                surf.append(entry)
                if not best or m["f1_score"] > best["metrics"]["f1_score"]:
                    best = entry

    return {"status": "success", "best": best, "surface": surf[:50]}
