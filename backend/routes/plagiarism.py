from flask import Blueprint, request, jsonify
from utils import save_upload_file, extract_text_from_file, check_plagiarism, analyze_text_basics
from database import SessionLocal, engine
from models import Submission
from database import Base
from sqlalchemy.orm import Session

# Ensure DB tables are created
Base.metadata.create_all(bind=engine)

plagiarism_bp = Blueprint("plagiarism", __name__)

@plagiarism_bp.route("/upload/plagiarism", methods=["POST"])
def upload_and_check_plagiarism():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["files"]

        # ✅ Save uploaded file
        saved_path, saved_name = save_upload_file(file)

        # ✅ Extract text
        text = extract_text_from_file(saved_path)
        if not text.strip():
            return jsonify({"error": "No text could be extracted from file"}), 400

        # ✅ Run plagiarism check
        result = check_plagiarism(text)  # should return { "overall": ..., "matches": [...] }

        # ✅ Run basic analysis
        analysis = analyze_text_basics(text)  # word_count, sentence_count, etc.

        # ✅ Save in DB
        db: Session = SessionLocal()
        submission = Submission(
            title=file.filename,
            filename=saved_name,
            original_filename=file.filename,
            plagiarism_score=result.get("overall"),
            ai_score=None,
            word_count=analysis.get("word_count"),
            sentence_count=analysis.get("sentence_count"),
            analysis_summary=f"Matches: {result.get('matches')}"
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        db.close()

        # ✅ Return JSON response
        return jsonify({
            "submission_id": submission.id,
            "filename": file.filename,
            "plagiarism_score": f"{result.get('overall')}%",
            "matches": result.get("matches", []),
            "analysis": analysis,
            "files": [file.filename]
        })

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500
