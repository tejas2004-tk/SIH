import os
import uuid
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import docx

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ Save uploaded file
def save_upload_file(file):
    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(saved_path)
    return saved_path, unique_name

# ✅ Extract text from PDF or DOCX
def extract_text_from_file(filepath):
    text = ""
    if filepath.endswith(".pdf"):
        try:
            reader = PdfReader(filepath)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"PDF extract error: {e}")
    elif filepath.endswith(".docx"):
        try:
            doc = docx.Document(filepath)
            text = "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            print(f"DOCX extract error: {e}")
    else:
        # fallback plain text
        with open(filepath, "r", errors="ignore") as f:
            text = f.read()
    return text

# ✅ Dummy plagiarism check (replace with real API later)
def check_plagiarism(text):
    # Fake logic: score depends on text length
    score = min(len(text) // 50, 100)
    return {
        "overall": score,
        "matches": [
            {"source": "researchgate.net", "match": f"{score//2}%"},
            {"source": "example.edu", "match": f"{score//3}%"}
        ]
    }

# ✅ Basic text analysis
def analyze_text_basics(text):
    words = text.split()
    sentences = text.split(".")
    return {
        "word_count": len(words),
        "sentence_count": len([s for s in sentences if s.strip()]),
        "char_count": len(text)
    }
