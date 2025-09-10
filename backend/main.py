from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# -------------------------
# Root API
# -------------------------
@app.route("/")
def home():
    return jsonify({"message": "Welcome to SIH Dashboard Backend"})

# -------------------------
# 📍 Plagiarism Detection Upload
# -------------------------
@app.route("/upload/plagiarism", methods=["POST"])
def plagiarism_upload():
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    uploaded_files = request.files.getlist("files")
    saved_files, results = [], []

    for f in uploaded_files:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], f.filename)
        f.save(filepath)
        saved_files.append(f.filename)

        # Dummy plagiarism check
        results.append({
            "filename": f.filename,
            "plagiarism_score": "15%",
            "matches": [
                {"source": "Wikipedia - Climate Change Article", "match": "8%"},
                {"source": "Nature Journal", "match": "7%"}
            ]
        })

    return jsonify({
        "status": "success",
        "files": saved_files,
        "results": results
    })

# -------------------------
# 📍 AI Detection Upload
# -------------------------
@app.route("/upload/ai", methods=["POST"])
def ai_upload():
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    uploaded_files = request.files.getlist("files")
    saved_files, results = [], []

    for f in uploaded_files:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], f.filename)
        f.save(filepath)
        saved_files.append(f.filename)

        # Dummy AI detection logic
        results.append({
            "filename": f.filename,
            "ai_score": "92%",
            "result": "Likely AI-Generated"
        })

    return jsonify({
        "status": "success",
        "files": saved_files,
        "results": results
    })

# -------------------------
# 📍 File Analysis Upload
# -------------------------
@app.route("/upload/analysis", methods=["POST"])
def file_analysis_upload():
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    uploaded_files = request.files.getlist("files")
    saved_files, results = [], []

    for f in uploaded_files:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], f.filename)
        f.save(filepath)
        saved_files.append(f.filename)

        # Dummy document analysis
        results.append({
            "filename": f.filename,
            "analysis": {
                "metadata": "Extracted",
                "structure": "Valid",
                "style": "Formal Academic"
            }
        })

    return jsonify({
        "status": "success",
        "files": saved_files,
        "results": results
    })

# -------------------------
# Run App
# -------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
