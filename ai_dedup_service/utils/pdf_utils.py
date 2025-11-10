import base64
import io
from pdfminer.high_level import extract_text
from PyPDF2 import PdfReader

def decode_base64_pdf(b64_data: str) -> bytes:
    try:
        pdf_bytes = base64.b64decode(b64_data)
    except Exception:
        raise ValueError("INVALID_PAYLOAD")
    if not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("UNSUPPORTED_MEDIA")
    return pdf_bytes

def extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        text = extract_text(io.BytesIO(pdf_bytes)) or ""
        if not text.strip():
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = " ".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            raise ValueError("PDF_PARSE_FAILED")
        return text.strip()
    except Exception:
        raise ValueError("PDF_PARSE_FAILED")
