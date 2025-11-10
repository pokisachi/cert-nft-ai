import os
from dotenv import load_dotenv

load_dotenv()

CORPUS_BACKEND = os.getenv("CORPUS_BACKEND", "postgres")
CORPUS_HTTP_BASEURL = os.getenv("CORPUS_HTTP_BASEURL", "")
CORPUS_HTTP_TOKEN = os.getenv("CORPUS_HTTP_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL")

ENABLE_OCR = os.getenv("ENABLE_OCR", "false").lower() == "true"
TOPK = int(os.getenv("TOPK", 3))
THRESH_UNIQUE = float(os.getenv("THRESH_UNIQUE", 0.80))
THRESH_DUPLICATE = float(os.getenv("THRESH_DUPLICATE", 0.95))
MAX_ITEMS = int(os.getenv("MAX_ITEMS", 200))
MAX_PDF_MB = int(os.getenv("MAX_PDF_MB", 10))
