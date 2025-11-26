# ai_dedup_service/services/dedup_service_impl.py

import time
import json
from utils.pdf_utils import decode_base64_pdf, extract_pdf_text
from utils.normalize import normalize_text, normalize_name
from utils.hashers import (
    sha256_hex,
    minhash_signature,
    simhash64,
    jaccard_estimate,
    hamming_distance,
)
from config import THRESH_UNIQUE, THRESH_DUPLICATE, TOPK


class DedupService:
    def __init__(self, repo):
        self.repo = repo

    async def process_batch(self, items, options):
        items_out = []
        start = time.time()

        threshold_unique = float(options.get("thresholdUnique", THRESH_UNIQUE))
        threshold_duplicate = float(options.get("thresholdDuplicate", THRESH_DUPLICATE))
        topk = int(options.get("topK", TOPK))
        max_hamming = int(options.get("maxHamming", 3))
        alpha = float(options.get("alpha", 0.6))
        beta = float(options.get("beta", 0.4))
        if alpha + beta <= 0:
            alpha, beta = 0.6, 0.4
        else:
            s = alpha + beta
            alpha, beta = alpha / s, beta / s

        for it in items:
            # 1️⃣ Decode PDF
            pdf_bytes = decode_base64_pdf(it.pdfBase64)

            # 2️⃣ SHA256 EXACT DUPLICATE CHECK
            doc_hash = sha256_hex(pdf_bytes)
            ref = await self.repo.find_by_hash(doc_hash)

            if ref:
                ref_hash = ref.get("docHash") if isinstance(ref, dict) else getattr(ref, "docHash", None)

                items_out.append({
                    "certId": it.certId,
                    "similarityScore": 1.0,
                    "status": "duplicate",
                    "matchedWith": [{
                        "refDocHash": ref_hash or "unknown",
                        "score": 1.0,
                        "mhScore": 1.0,
                        "simhashScore": 1.0,
                        "hammingDist": 0,
                        "method": "sha256",
                    }],
                    "docHash": doc_hash,
                })
                continue

            # 3️⃣ Extract text
            text = extract_pdf_text(pdf_bytes)
            if not text or not text.strip():
                items_out.append({
                    "certId": it.certId,
                    "similarityScore": 0.0,
                    "status": "parse_failed",
                    "matchedWith": [],
                    "docHash": doc_hash,
                })
                continue

            # 4️⃣ Normalize
            norm = normalize_text(text)

            # 5️⃣ Build fingerprints
            mh_sig = minhash_signature(norm, k=128)
            sh64 = simhash64(norm)

            # 6️⃣ Candidate search (simhash filter)
            candidates = await self.repo.query_near_simhash(sh64, max_hamming=max_hamming)

            best_score = 0.0
            matched = []

            for row in candidates:

                # ❗ FIX 1 — Lọc record không hợp lệ (thiếu minhashSig)
                if "minhashSig" not in row or row["minhashSig"] in (None, "null", ""):
                    continue

                raw = row["minhashSig"]

                # ❗ FIX 2 — parse JSON string → list
                try:
                    if isinstance(raw, str):
                        cand_sig = json.loads(raw)
                    else:
                        cand_sig = raw
                except Exception:
                    # ❗ Lỗi JSON → bỏ qua row
                    continue

                # ❗ FIX 3 — nếu minhashSig không phải list int → bỏ qua
                if not isinstance(cand_sig, list):
                    continue

                # ✔ MinHash estimated Jaccard
                mh_score = jaccard_estimate(mh_sig, cand_sig)

                # ✔ SimHash distance
                hd = int(row.get("hammingDist", 0))
                simhash_score = 1.0 - float(hd) / 64.0

                # ✔ Combined score (tùy chỉnh trọng số)
                combined = alpha * mh_score + beta * simhash_score

                matched.append({
                    "refDocHash": row["docHash"],
                    "score": round(combined, 4),
                    "mhScore": round(mh_score, 4),
                    "simhashScore": round(simhash_score, 4),
                    "hammingDist": hd,
                    "method": "minhash+simhash",
                })

                if combined > best_score:
                    best_score = combined

            # Limit topK
            matched.sort(key=lambda x: x["score"], reverse=True)
            matched = matched[:topk]

            # 7️⃣ Classification
            if best_score < threshold_unique:
                status = "unique"
            elif best_score >= threshold_duplicate:
                status = "duplicate"
            else:
                status = "suspected_copy"

            items_out.append({
                "certId": it.certId,
                "similarityScore": round(best_score, 4),
                "status": status,
                "matchedWith": matched,
                "docHash": doc_hash,
            })

            # 8️⃣ Save to corpus
            await self.repo.upsert_doc({
                "docHash": doc_hash,
                "minhashSig": mh_sig,
                "simhash64": sh64,
                "studentNameNorm": normalize_name(it.studentName),
                "dob": it.dob,
                "course": it.course,
                "source": "preview",
            })

        # 9️⃣ Summary
        return {
            "results": items_out,
            "meta": {
                "processed": len(items_out),
                "durationMs": int((time.time() - start) * 1000),
                "thresholdUnique": threshold_unique,
                "thresholdDuplicate": threshold_duplicate,
                "topK": topk,
            },
        }
