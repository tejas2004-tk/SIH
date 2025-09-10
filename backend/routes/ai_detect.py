from fastapi import APIRouter, UploadFile, File, Form
from utils import save_upload_file, extract_text_from_file, ai_authorship_heuristic, analyze_text_basics
from database import SessionLocal
from models import Submission

router = APIRouter()

@router.post("/ai-detect")
async def ai_detect_endpoint(file: UploadFile = File(...), title: str = Form(None)):
    saved_path, saved_name = save_upload_file(file)
    text = extract_text_from_file(saved_path)

    ai_score = ai_authorship_heuristic(text)
    analysis = analyze_text_basics(text)

    # store or update DB
    db = SessionLocal()
    submission = Submission(
        title=title,
        filename=saved_name,
        original_filename=file.filename,
        plagiarism_score=None,
        ai_score=ai_score,
        word_count=analysis["word_count"],
        sentence_count=analysis["sentence_count"],
        analysis_summary=f"AI heuristic score: {ai_score}"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    db.close()

    return {
        "submission_id": submission.id,
        "filename": file.filename,
        "ai_score": ai_score,
        "analysis": analysis
    }
