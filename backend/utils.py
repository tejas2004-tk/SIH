import os
import uuid
import json
import re
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import docx
from plagiarism_service import PlagiarismDetector
from ai_service import AIDetector

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Singleton detectors for efficiency
_plagiarism_detector = PlagiarismDetector()
_ai_detector = AIDetector()


def save_upload_file(file):
    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(saved_path)
    return saved_path, unique_name


def extract_text_from_file(filepath):
    text = ""
    try:
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
            with open(filepath, "r", errors="ignore", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        print(f"Text extraction error: {e}")
    return text.strip()


def check_plagiarism(text, cross_batch=None):
    return _plagiarism_detector.analyze(text, cross_batch)


def detect_ai_content(text):
    return _ai_detector.detect(text)


def compare_documents_batch(documents):
    """Cross-compare multiple documents for inter-file plagiarism."""
    return _plagiarism_detector.compare_batch(documents)


def analyze_text_basics(text):
    if not text:
        return {}

    words = re.findall(r"\b\w+\b", text)
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
    avg_sentence_length = len(words) / len(sentences) if sentences else 0

    syllables = sum(max(1, len(re.findall(r"[aeiouy]+", w.lower()))) for w in words)
    readability = 0
    if sentences and words:
        readability = round(
            206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (syllables / len(words)),
            1,
        )

    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "paragraph_count": len(paragraphs),
        "char_count": len(text),
        "avg_word_length": round(avg_word_length, 2),
        "avg_sentence_length": round(avg_sentence_length, 2),
        "unique_words": len(set(w.lower() for w in words)),
        "lexical_diversity": round(len(set(w.lower() for w in words)) / max(len(words), 1) * 100, 1),
        "readability_score": readability,
        "readability_label": _readability_label(readability),
    }


def _readability_label(score):
    if score >= 70:
        return "Easy to read"
    if score >= 50:
        return "Standard"
    if score >= 30:
        return "Difficult"
    return "Very difficult"


def generate_report(submission_id, plagiarism_result, ai_result, analysis, cross_batch=None):
    return {
        "submission_id": submission_id,
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        "plagiarism_analysis": {
            "score": plagiarism_result.get("overall_score", 0),
            "confidence": plagiarism_result.get("confidence", 0),
            "confidence_tier": plagiarism_result.get("confidence_tier", ""),
            "originality_score": plagiarism_result.get("originality_score", 0),
            "risk_level": plagiarism_result.get("risk_level", ""),
            "status": plagiarism_result.get("recommendation", ""),
            "matches": plagiarism_result.get("matches", []),
            "matches_count": len(plagiarism_result.get("matches", [])),
        },
        "ai_analysis": {
            "score": ai_result.get("ai_score", 0),
            "confidence": ai_result.get("confidence", 0),
            "confidence_tier": ai_result.get("confidence_tier", ""),
            "human_score": ai_result.get("human_score", 0),
            "classification": ai_result.get("classification", ""),
            "risk_level": ai_result.get("risk_level", ""),
            "markers": ai_result.get("markers", []),
            "confidence_breakdown": ai_result.get("confidence_breakdown", {}),
        },
        "cross_file_analysis": cross_batch,
        "text_analysis": analysis,
        "overall_risk": _overall_risk(
            plagiarism_result.get("overall_score", 0),
            ai_result.get("ai_score", 0),
        ),
    }


def _overall_risk(plagiarism_score, ai_score):
    combined = plagiarism_score * 0.5 + ai_score * 0.5
    if combined < 20:
        return "Low Risk"
    if combined < 40:
        return "Moderate Risk"
    if combined < 60:
        return "High Risk"
    return "Critical Risk"


def process_single_file_steps(file, analysis_type="comprehensive"):
    """
    Process a single file through defined steps.
    Returns step-by-step progress data for frontend.
    """
    steps = []
    filename = file.filename

    steps.append({"step": 1, "name": "Upload", "status": "completed", "message": f"Received {filename}"})

    saved_path, saved_name = save_upload_file(file)
    steps.append({"step": 2, "name": "Extract Text", "status": "processing", "message": "Reading document content..."})

    text = extract_text_from_file(saved_path)
    if not text:
        steps[-1]["status"] = "error"
        steps[-1]["message"] = "No text could be extracted"
        return {"status": "error", "filename": filename, "steps": steps, "error": "No text extracted"}

    steps[-1]["status"] = "completed"
    steps[-1]["message"] = f"Extracted {len(text.split())} words"

    analysis = analyze_text_basics(text)
    plagiarism_result = None
    ai_result = None

    if analysis_type in ("plagiarism", "comprehensive"):
        steps.append({"step": 3, "name": "Plagiarism Scan", "status": "processing", "message": "Scanning against sources..."})
        plagiarism_result = check_plagiarism(text)
        steps[-1]["status"] = "completed"
        steps[-1]["message"] = f"Score: {plagiarism_result.get('overall_score', 0)}% | Confidence: {plagiarism_result.get('confidence', 0)}%"

    if analysis_type in ("ai", "comprehensive"):
        step_num = 4 if analysis_type == "comprehensive" else 3
        steps.append({"step": step_num, "name": "AI Detection", "status": "processing", "message": "Analyzing linguistic patterns..."})
        ai_result = detect_ai_content(text)
        steps[-1]["status"] = "completed"
        steps[-1]["message"] = f"AI Score: {ai_result.get('ai_score', 0)}% | {ai_result.get('classification', '')}"

    steps.append({
        "step": len(steps) + 1,
        "name": "Generate Report",
        "status": "completed",
        "message": "Analysis complete",
    })

    return {
        "status": "success",
        "filename": filename,
        "saved_name": saved_name,
        "text_preview": text[:300] + ("..." if len(text) > 300 else ""),
        "word_count": len(text.split()),
        "steps": steps,
        "plagiarism": plagiarism_result,
        "ai_detection": ai_result,
        "analysis": analysis,
        "text": text,
    }
