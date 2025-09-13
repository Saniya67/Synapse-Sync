# BackendServices/utils/text_extractor.py

import fitz  # PyMuPDF
from docx import Document

def extract_text(file_path: str) -> str:
    """
    Extract text from DOCX or PDF file.
    """
    if file_path.endswith(".pdf"):
        text = ""
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        return text

    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    else:
        # fallback for other file types
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
