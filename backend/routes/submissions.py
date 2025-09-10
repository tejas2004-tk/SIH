from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import SessionLocal, engine
from models import Submission
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from fastapi.responses import FileResponse, StreamingResponse
from typing import List
import os
from database import Base

# create tables if not exist
Base.metadata.create_all(bind=engine)

router = APIRouter()

class SubmissionOut(BaseModel):
    id: int
    title: str | None
    original_filename: str
    filename: str
    uploaded_at: str
    plagiarism_score: float | None
    ai_score: float | None
    word_count: int | None
    sentence_count: int | None

    class Config:
        orm_mode = True

@router.get("/submissions", response_model=List[SubmissionOut])
def list_submissions():
    db: Session = SessionLocal()
    try:
        rows = db.query(Submission).order_by(Submission.uploaded_at.desc()).limit(50).all()
        return rows
    finally:
        db.close()

@router.get("/report/{submission_id}")
def get_report(submission_id: int):
    db = SessionLocal()
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    db.close()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # generate simple PDF in-memory
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 720, f"SIH - Report for: {sub.original_filename}")
    c.setFont("Helvetica", 12)
    c.drawString(72, 700, f"Submission ID: {sub.id}")
    c.drawString(72, 680, f"Uploaded at: {sub.uploaded_at}")
    c.drawString(72, 660, f"Plagiarism Score: {sub.plagiarism_score if sub.plagiarism_score is not None else 'N/A'}")
    c.drawString(72, 640, f"AI Probability: {sub.ai_score if sub.ai_score is not None else 'N/A'}")
    c.drawString(72, 620, "Analysis Summary:")
    y = 600
    summary = sub.analysis_summary or ""
    for line in summary.splitlines()[:10]:
        c.drawString(72, y, line)
        y -= 16

    c.showPage()
    c.save()
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=report_{sub.id}.pdf"})
