import time
from utils.pdf_utils import decode_base64_pdf, extract_pdf_text
from utils.normalize import normalize_text, normalize_name
from utils.hashers import sha256_hex, minhash_signature, simhash64, jaccard_estimate, hamming_distance


class DedupService:
    def __init__(self, repo):
        self.repo = repo

    async def process_batch(self, items, options):
        items_out = []
        start = time.time()

        threshold_unique = options.get("thresholdUnique", 0.80)
        threshold_duplicate = options.get("thresholdDuplicate", 0.95)
        topk = options.get("topK", 3)

        for it in items:
            # 1️⃣ Decode PDF
            pdf_bytes = decode_base64_pdf(it.pdfBase64)

            # 2️⃣ SHA256 hash để nhận diện file trùng hệt
            doc_hash = sha256_hex(pdf_bytes)

            ref = await self.repo.find_by_hash(doc_hash)
            if ref:
                # Chống KeyError và hỗ trợ cả kiểu dict, Row, hoặc ORM object
                ref_hash = ref.get("docHash") if isinstance(ref, dict) else getattr(ref, "docHash", None)

                items_out.append({
                    "certId": it.certId,
                    "similarityScore": 1.0,
                    "status": "duplicate",
                    "matchedWith": [{
                        "refDocHash": ref_hash or "unknown",
                        "score": 1.0,
                        "method": "sha256"
                    }]
                })
                continue

            # 3️⃣ Trích xuất văn bản từ PDF
            text = extract_pdf_text(pdf_bytes)
            if not text or not text.strip():
                items_out.append({
                    "certId": it.certId,
                    "similarityScore": 0.0,
                    "status": "parse_failed",
                    "matchedWith": []
                })
                continue

            # 4️⃣ Chuẩn hoá nội dung
            norm = normalize_text(text)

            # 5️⃣ Tạo fingerprint (MinHash + SimHash)
            mh_sig = minhash_signature(norm, k=128)
            sh64 = simhash64(norm)

            # 6️⃣ (Tùy chọn) Tìm các ứng viên gần để so sánh
            # Bạn có thể mở rộng sau bằng self.repo.find_similar(...)
            best_score = 0.0
            matched = []

            # 7️⃣ Phân loại
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
                "matchedWith": matched
            })

            # 8️⃣ Lưu fingerprint vào DB corpus
            await self.repo.upsert_doc({
                "docHash": doc_hash,
                "minhashSig": mh_sig,
                "simhash64": sh64,
                "studentNameNorm": normalize_name(it.studentName),
                "dob": it.dob,
                "course": it.course,
                "source": "preview"
            })

        # 9️⃣ Kết quả tổng hợp
        return {
            "results": items_out,
            "meta": {
                "processed": len(items_out),
                "durationMs": int((time.time() - start) * 1000)
            }
        }
