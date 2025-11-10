import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from config import DATABASE_URL


class CorpusRepoPostgres:
    def __init__(self):
        self.engine = create_async_engine(DATABASE_URL, future=True)
        print("[Repo] Sử dụng backend Postgres Corpus")

    async def init_table(self):
        async with self.engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS corpus_certificates (
                    docHash TEXT PRIMARY KEY,
                    minhashSig JSONB,
                    simhash64 BIGINT,
                    studentNameNorm TEXT,
                    dob TEXT,
                    course TEXT,
                    source TEXT,
                    createdAt TIMESTAMP DEFAULT NOW()
                )
            """))
            print("[Khởi tạo DB] Hoàn tất.")

    # ✅ Tìm 1 tài liệu trong corpus theo docHash
    async def find_by_hash(self, doc_hash: str):
        async with self.engine.connect() as conn:
            result = await conn.execute(
                text("SELECT * FROM corpus_certificates WHERE docHash = :doc_hash"),
                {"doc_hash": doc_hash},
            )
            row = result.mappings().first()
            return dict(row) if row else None

    # ✅ Lưu hoặc bỏ qua nếu trùng docHash
    async def upsert_doc(self, record: dict):
        # Ép kiểu dữ liệu chuẩn để tránh lỗi PostgreSQL
        record["minhashSig"] = [int(x) for x in record["minhashSig"]]

        # Ép simhash về dạng signed 64-bit để tránh lỗi “value out of int64 range”
        simhash_val = int(record["simhash64"]) & ((1 << 64) - 1)
        if simhash_val >= (1 << 63):
            simhash_val -= (1 << 64)
        record["simhash64"] = simhash_val

        async with self.engine.begin() as conn:
            await conn.execute(
                text("""
                    INSERT INTO corpus_certificates
                    (docHash, minhashSig, simhash64, studentNameNorm, dob, course, source)
                    VALUES (:docHash, CAST(:minhashSig AS jsonb), :simhash64, :studentNameNorm, :dob, :course, :source)
                    ON CONFLICT (docHash) DO NOTHING
                """),
                {
                    "docHash": record["docHash"],
                    "minhashSig": json.dumps(record["minhashSig"]),
                    "simhash64": record["simhash64"],
                    "studentNameNorm": record["studentNameNorm"],
                    "dob": record["dob"],
                    "course": record["course"],
                    "source": record["source"],
                },
            )

    # ✅ Lấy danh sách doc gần giống dựa theo simhash
    async def query_near_simhash(self, simhash64_value: int, max_hamming: int = 3):
        async with self.engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT * FROM corpus_certificates
            """))
            rows = result.mappings().all()
            candidates = []

            for row in rows:
                db_sh = int(row["simhash64"])
                # tính Hamming distance
                hd = bin(simhash64_value ^ db_sh).count("1")
                if hd <= max_hamming:
                    candidates.append({**dict(row), "hammingDist": hd})

            return candidates

    # ✅ Xoá tài liệu theo docHash (nếu cần làm sạch)
    async def delete_doc(self, doc_hash: str):
        async with self.engine.begin() as conn:
            await conn.execute(
                text("DELETE FROM corpus_certificates WHERE docHash = :doc_hash"),
                {"doc_hash": doc_hash},
            )
