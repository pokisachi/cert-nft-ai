from pydantic import BaseModel
from typing import List, Optional

class CertificateItem(BaseModel):
    certId: str
    studentName: str
    dob: Optional[str] = None
    course: str
    pdfBase64: str

class DedupOptions(BaseModel):
    topK: int = 3
    thresholdUnique: float = 0.80
    thresholdDuplicate: float = 0.95
    returnDebug: bool = False

class DedupBatchRequest(BaseModel):
    items: List[CertificateItem]
    options: Optional[DedupOptions] = None
