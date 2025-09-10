from flask import Blueprint, request, jsonify
import os
from docx import Document
from routes.plagiarism import check_plagiarism

upload_bp = Blueprint("upload", __name__)

def extract_text(file_path):
    if file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])
    else:
        return ""  # TODO: handle PDF later

@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filepath = os.path.join("instance/uploads", file.filename)
    file.save(filepath)

    # Extract text and check plagiarism
    text = extract_text(filepath)
    plagiarism_score = check_plagiarism(text) if text else 0.0

    return jsonify({
        "filename": file.filename,
        "status": "Uploaded successfully",
        "plagiarism_score": plagiarism_score,
        "ai_detection": "Pending",   # placeholder for next step
        "file_analysis": "Pending"
    }), 200
