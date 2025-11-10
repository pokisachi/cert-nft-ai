import httpx
from config import CORPUS_HTTP_BASEURL, CORPUS_HTTP_TOKEN

class CorpusRepoHttp:
    def __init__(self):
        self.base = CORPUS_HTTP_BASEURL
        self.token = CORPUS_HTTP_TOKEN
        self.headers = {"Authorization": f"Bearer {self.token}"}

    async def find_by_hash(self, doc_hash: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base}/by-hash/{doc_hash}", headers=self.headers)
            return r.json() if r.status_code == 200 else None

    async def upsert_doc(self, record: dict):
        async with httpx.AsyncClient() as client:
            await client.post(f"{self.base}/upsert", json=record, headers=self.headers)

    async def lsh_query(self, mh_sig: list):
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base}/search", json={"minhashSig": mh_sig}, headers=self.headers)
            return r.json()

    async def near_simhash(self, sh64: int, max_hamming: int = 8):
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self.base}/search", json={"simhash64": sh64}, headers=self.headers)
            return r.json()
