# services/corpus_repo/corpus_repo.py
from config import CORPUS_BACKEND
from .postgres_repo import CorpusRepoPostgres
from .http_repo import CorpusRepoHttp

def get_corpus_repo():
    """Chọn backend Corpus theo biến môi trường"""
    if CORPUS_BACKEND == "http":
        print("[Repo] Sử dụng backend HTTP Corpus")
        return CorpusRepoHttp()
    print("[Repo] Sử dụng backend Postgres Corpus")
    return CorpusRepoPostgres()
