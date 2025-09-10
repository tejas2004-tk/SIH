from fastapi import APIRouter, UploadFile, File, Form
from utils import save_upload_file, extract_text_from_file, analyze_text_basics
from database import SessionLocal
from models import Submission

router = APIRouter()

@router.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...), title: str = Form(None)):
    saved_path, saved_name = save_upload_file(file)
    text = extract_text_from_file(saved_path)

    analysis = analyze_text_basics(text)
    summary_lines = [
        f"Words: {analysis['word_count']}",
        f"Sentences: {analysis['sentence_count']}",
        f"Unique words: {analysis['unique_words']}",
        f"Avg words/sentence: {analysis['avg_words_per_sentence']}"
    ]
    summary = "\n".join(summary_lines)

    db = SessionLocal()
    submission = Submission(
        title=title,
        filename=saved_name,
        original_filename=file.filename,
        plagiarism_score=None,
        ai_score=None,
        word_count=analysis["word_count"],
        sentence_count=analysis["sentence_count"],
        analysis_summary=summary
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    db.close()

    return {"submission_id": submission.id, "filename": file.filename, "analysis": analysis}
