from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from auth import require_api_key, optional_api_key, create_api_key, generate_api_key, get_api_key_info
from database import SessionLocal, engine, Base
from models import Submission, APIKey
from utils import (
    save_upload_file,
    extract_text_from_file,
    check_plagiarism,
    detect_ai_content,
    analyze_text_basics,
    generate_report,
    compare_documents_batch,
    process_single_file_steps,
)
from sqlalchemy.orm import Session

app = Flask(__name__)
CORS(app)

Base.metadata.create_all(bind=engine)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024


# ==========================================
# Public Endpoints (No Auth — Free Tier)
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "name": "SentinelAI API",
        "version": "3.0.0",
        "description": "Professional AI Detection & Plagiarism Analysis Platform",
        "free_endpoints": [
            {"path": "/public/analyze/ai", "method": "POST", "description": "Free AI content detection"},
            {"path": "/public/analyze/plagiarism", "method": "POST", "description": "Free plagiarism detection"},
            {"path": "/public/analyze/comprehensive", "method": "POST", "description": "Free full analysis"},
            {"path": "/public/analyze/cross-file", "method": "POST", "description": "Free cross-file plagiarism"},
        ],
        "api_endpoints": [
            {"path": "/api-key/generate", "method": "POST", "description": "Generate API key for programmatic access"},
            {"path": "/api-key/verify", "method": "POST", "description": "Verify API key"},
            {"path": "/analyze/plagiarism", "method": "POST", "description": "Plagiarism (API key required)"},
            {"path": "/analyze/ai", "method": "POST", "description": "AI detection (API key required)"},
            {"path": "/analyze/comprehensive", "method": "POST", "description": "Full analysis (API key required)"},
            {"path": "/submissions", "method": "GET", "description": "History (API key required)"},
        ],
    }), 200


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0"
    }), 200


@app.route("/api-key/verify", methods=["POST"])
def verify_existing_api_key():
    try:
        data = request.get_json()
        if not data or not data.get("api_key"):
            return jsonify({"error": "Missing required field: api_key"}), 400
        api_key = data.get("api_key").strip()
        key_info = get_api_key_info(api_key)
        if not key_info:
            return jsonify({"error": "Invalid or inactive API key"}), 401
        if key_info.get("remaining_today", 0) <= 0:
            return jsonify({"error": "Daily request limit exceeded"}), 429
        return jsonify({"status": "success", "message": "API key verified", "data": key_info}), 200
    except Exception as e:
        return jsonify({"error": f"Verification failed: {str(e)}"}), 500


@app.route("/api-key/generate", methods=["POST"])
def generate_new_api_key():
    try:
        data = request.get_json()
        if not data or not data.get("user_name"):
            return jsonify({"error": "Missing required field: user_name"}), 400
        user_name = data.get("user_name")
        organization = data.get("organization", "")
        daily_limit = data.get("daily_limit", 1000)
        if not user_name or len(user_name) < 3:
            return jsonify({"error": "user_name must be at least 3 characters"}), 400
        if daily_limit < 1 or daily_limit > 100000:
            return jsonify({"error": "daily_limit must be between 1 and 100000"}), 400
        api_key_data = create_api_key(user_name, organization, daily_limit)
        return jsonify({
            "status": "success",
            "message": "API key generated successfully",
            "data": api_key_data,
            "instructions": "Use the 'key' value in the X-API-Key header for all requests"
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to generate API key: {str(e)}"}), 500


# ==========================================
# FREE Public Analysis Endpoints (No Auth)
# ==========================================

@app.route("/public/analyze/ai", methods=["POST"])
def public_analyze_ai():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist("files")
        if not files or len(files) == 0:
            return jsonify({"error": "At least one file is required"}), 400

        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed"}), 400

        results = []
        for file in files:
            try:
                saved_path, saved_name = save_upload_file(file)
                text = extract_text_from_file(saved_path)

                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue

                ai_result = detect_ai_content(text)
                analysis = analyze_text_basics(text)

                results.append({
                    "filename": file.filename,
                    "status": "success",
                    "ai_detection": {
                        "score": ai_result.get("ai_score", 0),
                        "confidence": ai_result.get("confidence", 0),
                        "confidence_tier": ai_result.get("confidence_tier", ""),
                        "human_score": ai_result.get("human_score", 0),
                        "classification": ai_result.get("classification", ""),
                        "risk_level": ai_result.get("risk_level", ""),
                        "markers": ai_result.get("markers", []),
                        "confidence_breakdown": ai_result.get("confidence_breakdown", {}),
                        "analysis": ai_result.get("analysis", {}),
                    },
                    "analysis": analysis,
                })
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})

        return jsonify({
            "status": "success",
            "tier": "free",
            "timestamp": datetime.utcnow().isoformat(),
            "files_processed": len([r for r in results if r["status"] == "success"]),
            "total_files": len(files),
            "results": results,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/public/analyze/plagiarism", methods=["POST"])
def public_analyze_plagiarism():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist("files")
        if not files or len(files) == 0:
            return jsonify({"error": "At least one file is required"}), 400

        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed"}), 400

        results = []
        all_documents = []

        for file in files:
            try:
                saved_path, saved_name = save_upload_file(file)
                text = extract_text_from_file(saved_path)

                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue

                all_documents.append({"filename": file.filename, "text": text})
                results.append({"file_obj": file, "text": text, "saved_name": saved_name})
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})

        cross_batch = None
        if len(all_documents) >= 2:
            cross_batch = compare_documents_batch(all_documents)

        final_results = []
        for item in results:
            if "file_obj" not in item:
                final_results.append(item)
                continue

            try:
                plagiarism_result = check_plagiarism(item["text"], cross_batch)
                analysis = analyze_text_basics(item["text"])

                final_results.append({
                    "filename": item["file_obj"].filename,
                    "status": "success",
                    "plagiarism": {
                        "score": plagiarism_result.get("overall_score", 0),
                        "confidence": plagiarism_result.get("confidence", 0),
                        "confidence_tier": plagiarism_result.get("confidence_tier", ""),
                        "originality_score": plagiarism_result.get("originality_score", 0),
                        "risk_level": plagiarism_result.get("risk_level", ""),
                        "recommendation": plagiarism_result.get("recommendation", ""),
                        "matches": plagiarism_result.get("matches", []),
                    },
                    "analysis": analysis,
                })
            except Exception as e:
                final_results.append({"filename": item["file_obj"].filename, "status": "error", "error": str(e)})

        return jsonify({
            "status": "success",
            "tier": "free",
            "timestamp": datetime.utcnow().isoformat(),
            "files_processed": len([r for r in final_results if r["status"] == "success"]),
            "total_files": len(files),
            "cross_file_analysis": cross_batch,
            "results": final_results,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/public/analyze/comprehensive", methods=["POST"])
def public_analyze_comprehensive():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist("files")
        if not files:
            return jsonify({"error": "At least one file is required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed"}), 400

        all_documents = []
        file_data_list = []

        for file in files:
            saved_path, saved_name = save_upload_file(file)
            text = extract_text_from_file(saved_path)
            file_data_list.append({"file": file, "saved_name": saved_name, "text": text})
            if text:
                all_documents.append({"filename": file.filename, "text": text})

        cross_batch = None
        if len(all_documents) >= 2:
            cross_batch = compare_documents_batch(all_documents)

        results = []
        for item in file_data_list:
            file = item["file"]
            text = item["text"]
            try:
                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue

                plagiarism_result = check_plagiarism(text, cross_batch)
                ai_result = detect_ai_content(text)
                analysis = analyze_text_basics(text)
                report = generate_report(None, plagiarism_result, ai_result, analysis, cross_batch)

                results.append({
                    "filename": file.filename,
                    "status": "success",
                    "plagiarism": {
                        "score": plagiarism_result.get("overall_score", 0),
                        "confidence": plagiarism_result.get("confidence", 0),
                        "confidence_tier": plagiarism_result.get("confidence_tier", ""),
                        "originality_score": plagiarism_result.get("originality_score", 0),
                        "risk_level": plagiarism_result.get("risk_level", ""),
                        "recommendation": plagiarism_result.get("recommendation", ""),
                        "matches": plagiarism_result.get("matches", []),
                    },
                    "ai_detection": {
                        "score": ai_result.get("ai_score", 0),
                        "confidence": ai_result.get("confidence", 0),
                        "confidence_tier": ai_result.get("confidence_tier", ""),
                        "human_score": ai_result.get("human_score", 0),
                        "classification": ai_result.get("classification", ""),
                        "risk_level": ai_result.get("risk_level", ""),
                        "markers": ai_result.get("markers", []),
                        "confidence_breakdown": ai_result.get("confidence_breakdown", {}),
                        "analysis": ai_result.get("analysis", {}),
                    },
                    "analysis": analysis,
                    "overall_risk": report.get("overall_risk"),
                })
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})

        return jsonify({
            "status": "success",
            "tier": "free",
            "timestamp": datetime.utcnow().isoformat(),
            "files_processed": len([r for r in results if r["status"] == "success"]),
            "total_files": len(files),
            "cross_file_analysis": cross_batch,
            "results": results,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/public/analyze/cross-file", methods=["POST"])
def public_analyze_cross_file():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist("files")
        if len(files) < 2:
            return jsonify({"error": "At least 2 files required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed"}), 400

        documents = []
        for file in files:
            saved_path, _ = save_upload_file(file)
            text = extract_text_from_file(saved_path)
            if text:
                documents.append({"filename": file.filename, "text": text})

        if len(documents) < 2:
            return jsonify({"error": "Could not extract text from at least 2 files"}), 400

        cross_result = compare_documents_batch(documents)
        return jsonify({
            "status": "success",
            "tier": "free",
            "timestamp": datetime.utcnow().isoformat(),
            "cross_file_analysis": cross_result,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


# ==========================================
# Protected API Endpoints (Require API Key)
# ==========================================

@app.route("/analyze/plagiarism", methods=["POST"])
@require_api_key
def analyze_plagiarism(api_key_id=None, user_name=None):
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400
        files = request.files.getlist("files")
        if not files or len(files) == 0:
            return jsonify({"error": "At least one file is required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed per request"}), 400

        results = []
        db: Session = SessionLocal()
        for file in files:
            try:
                saved_path, saved_name = save_upload_file(file)
                text = extract_text_from_file(saved_path)
                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue
                plagiarism_result = check_plagiarism(text)
                analysis = analyze_text_basics(text)
                submission = Submission(
                    api_key_id=api_key_id, title=file.filename, filename=saved_name,
                    original_filename=file.filename,
                    plagiarism_score=plagiarism_result.get("overall_score", 0),
                    plagiarism_confidence=plagiarism_result.get("confidence", 0),
                    word_count=analysis.get("word_count"), sentence_count=analysis.get("sentence_count"),
                    matched_sources=json.dumps(plagiarism_result.get("matches", [])),
                    processing_status="completed", report_data=json.dumps(plagiarism_result)
                )
                db.add(submission)
                db.commit()
                db.refresh(submission)
                results.append({
                    "submission_id": submission.id, "filename": file.filename, "status": "success",
                    "plagiarism": {
                        "score": plagiarism_result.get("overall_score", 0),
                        "confidence": plagiarism_result.get("confidence", 0),
                        "recommendation": plagiarism_result.get("recommendation", ""),
                        "matches": plagiarism_result.get("matches", [])
                    },
                    "analysis": analysis
                })
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})
        db.close()
        return jsonify({
            "status": "success", "tier": "api",
            "timestamp": datetime.utcnow().isoformat(), "user": user_name,
            "files_processed": len([r for r in results if r["status"] == "success"]),
            "total_files": len(files), "results": results
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/analyze/ai", methods=["POST"])
@require_api_key
def analyze_ai_content(api_key_id=None, user_name=None):
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400
        files = request.files.getlist("files")
        if not files or len(files) == 0:
            return jsonify({"error": "At least one file is required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed per request"}), 400

        results = []
        db: Session = SessionLocal()
        for file in files:
            try:
                saved_path, saved_name = save_upload_file(file)
                text = extract_text_from_file(saved_path)
                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue
                ai_result = detect_ai_content(text)
                analysis = analyze_text_basics(text)
                submission = Submission(
                    api_key_id=api_key_id, title=file.filename, filename=saved_name,
                    original_filename=file.filename,
                    ai_score=ai_result.get("ai_score", 0), ai_confidence=ai_result.get("confidence", 0),
                    word_count=analysis.get("word_count"), sentence_count=analysis.get("sentence_count"),
                    processing_status="completed", report_data=json.dumps(ai_result)
                )
                db.add(submission)
                db.commit()
                db.refresh(submission)
                results.append({
                    "submission_id": submission.id, "filename": file.filename, "status": "success",
                    "ai_detection": {
                        "score": ai_result.get("ai_score", 0), "confidence": ai_result.get("confidence", 0),
                        "classification": ai_result.get("classification", ""), "markers": ai_result.get("markers", [])
                    },
                    "analysis": analysis
                })
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})
        db.close()
        return jsonify({
            "status": "success", "tier": "api",
            "timestamp": datetime.utcnow().isoformat(), "user": user_name,
            "files_processed": len([r for r in results if r["status"] == "success"]),
            "total_files": len(files), "results": results
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/analyze/step", methods=["POST"])
@require_api_key
def analyze_step_by_step(api_key_id=None, user_name=None):
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded. Use 'file' field"}), 400
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "Empty filename"}), 400
        analysis_type = request.form.get("analysis_type", "comprehensive")
        if analysis_type not in ("plagiarism", "ai", "comprehensive"):
            analysis_type = "comprehensive"
        result = process_single_file_steps(file, analysis_type)
        if result["status"] == "error":
            return jsonify(result), 400
        db: Session = SessionLocal()
        plagiarism = result.get("plagiarism") or {}
        ai_det = result.get("ai_detection") or {}
        analysis = result.get("analysis") or {}
        submission = Submission(
            api_key_id=api_key_id, title=file.filename, filename=result.get("saved_name", ""),
            original_filename=file.filename,
            plagiarism_score=plagiarism.get("overall_score"), plagiarism_confidence=plagiarism.get("confidence"),
            ai_score=ai_det.get("ai_score"), ai_confidence=ai_det.get("confidence"),
            word_count=analysis.get("word_count"), sentence_count=analysis.get("sentence_count"),
            processing_status="completed", report_data=json.dumps(result),
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        db.close()
        return jsonify({
            "status": "success", "tier": "api",
            "timestamp": datetime.utcnow().isoformat(), "user": user_name,
            "submission_id": submission.id,
            "result": {
                "filename": result["filename"], "status": "success", "steps": result["steps"],
                "plagiarism": {
                    "score": plagiarism.get("overall_score", 0), "confidence": plagiarism.get("confidence", 0),
                    "confidence_tier": plagiarism.get("confidence_tier", ""),
                    "originality_score": plagiarism.get("originality_score", 0),
                    "risk_level": plagiarism.get("risk_level", ""),
                    "recommendation": plagiarism.get("recommendation", ""),
                    "matches": plagiarism.get("matches", []),
                } if plagiarism else None,
                "ai_detection": {
                    "score": ai_det.get("ai_score", 0), "confidence": ai_det.get("confidence", 0),
                    "confidence_tier": ai_det.get("confidence_tier", ""),
                    "human_score": ai_det.get("human_score", 0),
                    "classification": ai_det.get("classification", ""),
                    "risk_level": ai_det.get("risk_level", ""),
                    "markers": ai_det.get("markers", []),
                    "confidence_breakdown": ai_det.get("confidence_breakdown", {}),
                    "analysis": ai_det.get("analysis", {}),
                } if ai_det else None,
                "analysis": analysis,
            },
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/analyze/cross-file", methods=["POST"])
@require_api_key
def analyze_cross_file(api_key_id=None, user_name=None):
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400
        files = request.files.getlist("files")
        if len(files) < 2:
            return jsonify({"error": "At least 2 files required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed"}), 400
        documents = []
        for file in files:
            saved_path, _ = save_upload_file(file)
            text = extract_text_from_file(saved_path)
            if text:
                documents.append({"filename": file.filename, "text": text})
        if len(documents) < 2:
            return jsonify({"error": "Could not extract text from at least 2 files"}), 400
        cross_result = compare_documents_batch(documents)
        return jsonify({
            "status": "success", "tier": "api",
            "timestamp": datetime.utcnow().isoformat(), "user": user_name,
            "cross_file_analysis": cross_result,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/analyze/comprehensive", methods=["POST"])
@require_api_key
def comprehensive_analysis(api_key_id=None, user_name=None):
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400
        files = request.files.getlist("files")
        if not files:
            return jsonify({"error": "At least one file is required"}), 400
        if len(files) > 10:
            return jsonify({"error": "Maximum 10 files allowed per request"}), 400

        all_documents = []
        file_data_list = []
        for file in files:
            saved_path, saved_name = save_upload_file(file)
            text = extract_text_from_file(saved_path)
            file_data_list.append({"file": file, "saved_name": saved_name, "text": text})
            if text:
                all_documents.append({"filename": file.filename, "text": text})

        cross_batch = None
        if len(all_documents) >= 2:
            cross_batch = compare_documents_batch(all_documents)

        results = []
        db: Session = SessionLocal()
        for item in file_data_list:
            file = item["file"]
            text = item["text"]
            try:
                if not text or not text.strip():
                    results.append({"filename": file.filename, "status": "error", "error": "No text could be extracted"})
                    continue
                plagiarism_result = check_plagiarism(text, cross_batch)
                ai_result = detect_ai_content(text)
                analysis = analyze_text_basics(text)
                report = generate_report(None, plagiarism_result, ai_result, analysis, cross_batch)
                submission = Submission(
                    api_key_id=api_key_id, title=file.filename, filename=item["saved_name"],
                    original_filename=file.filename,
                    plagiarism_score=plagiarism_result.get("overall_score", 0),
                    plagiarism_confidence=plagiarism_result.get("confidence", 0),
                    ai_score=ai_result.get("ai_score", 0), ai_confidence=ai_result.get("confidence", 0),
                    word_count=analysis.get("word_count"), sentence_count=analysis.get("sentence_count"),
                    matched_sources=json.dumps(plagiarism_result.get("matches", [])),
                    processing_status="completed", report_data=json.dumps(report)
                )
                db.add(submission)
                db.commit()
                db.refresh(submission)
                results.append({
                    "submission_id": submission.id, "filename": file.filename, "status": "success",
                    "plagiarism": {
                        "score": plagiarism_result.get("overall_score", 0),
                        "confidence": plagiarism_result.get("confidence", 0),
                        "confidence_tier": plagiarism_result.get("confidence_tier", ""),
                        "originality_score": plagiarism_result.get("originality_score", 0),
                        "risk_level": plagiarism_result.get("risk_level", ""),
                        "recommendation": plagiarism_result.get("recommendation", ""),
                        "matches": plagiarism_result.get("matches", []),
                    },
                    "ai_detection": {
                        "score": ai_result.get("ai_score", 0), "confidence": ai_result.get("confidence", 0),
                        "confidence_tier": ai_result.get("confidence_tier", ""),
                        "human_score": ai_result.get("human_score", 0),
                        "classification": ai_result.get("classification", ""),
                        "risk_level": ai_result.get("risk_level", ""),
                        "markers": ai_result.get("markers", []),
                        "confidence_breakdown": ai_result.get("confidence_breakdown", {}),
                        "analysis": ai_result.get("analysis", {}),
                    },
                    "analysis": analysis, "overall_risk": report.get("overall_risk"),
                })
            except Exception as e:
                results.append({"filename": file.filename, "status": "error", "error": str(e)})
        db.close()
        return jsonify({
            "status": "success", "tier": "api",
            "timestamp": datetime.utcnow().isoformat(), "user": user_name,
            "files_processed": len([r for r in results if r["status"] == "success"]),
            "total_files": len(files), "cross_file_analysis": cross_batch, "results": results
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/submissions", methods=["GET"])
@require_api_key
def get_submissions(api_key_id=None, user_name=None):
    try:
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        db: Session = SessionLocal()
        submissions = db.query(Submission).filter(
            Submission.api_key_id == api_key_id
        ).order_by(Submission.uploaded_at.desc()).limit(limit).offset(offset).all()
        total = db.query(Submission).filter(Submission.api_key_id == api_key_id).count()
        results = [{
            "id": s.id, "filename": s.original_filename,
            "uploaded_at": s.uploaded_at.isoformat() if s.uploaded_at else None,
            "plagiarism_score": s.plagiarism_score, "plagiarism_confidence": s.plagiarism_confidence,
            "ai_score": s.ai_score, "ai_confidence": s.ai_confidence, "word_count": s.word_count
        } for s in submissions]
        db.close()
        return jsonify({
            "status": "success", "user": user_name, "total": total,
            "limit": limit, "offset": offset, "submissions": results
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


# ==========================================
# Error Handlers
# ==========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    try:
        db = SessionLocal()
        existing = db.query(APIKey).filter(APIKey.user_name == "demo_user").first()
        if not existing:
            create_api_key("demo_user", "Demo Organization", 1000)
            print("Demo API key created for demo_user")
        db.close()
    except:
        pass

    print("SentinelAI Backend API v3.0.0")
    print("Free endpoints: /public/analyze/ai, /public/analyze/plagiarism")
    print("API docs: http://localhost:5000/")
    app.run(debug=True, host="127.0.0.1", port=5000)
