# SentinelAI — AI Detection & Plagiarism Platform

Professional-grade content analysis platform with AI-generated text detection, plagiarism checking, and cross-file comparison. Built with **React (Next.js)** frontend and **Flask** backend.

## Features

- **AI Content Detection** — 11 weighted linguistic signals analyze vocabulary, sentence structure, personal voice, hedging language, repetition, and more
- **Plagiarism Detection** — Multi-source checking with word-set similarity, n-gram overlap, and chunk-level matching
- **Cross-File Comparison** — Upload multiple documents and get a visual similarity matrix
- **Batch Processing** — Analyze up to 10 files at once
- **Confidence Scoring** — Every result includes confidence tiers, risk levels, and recommendations
- **REST API** — Full API with key authentication, rate limiting, and documentation
- **Session History** — Tracks all analyses with JSON export
- **Multi-Format Support** — PDF, DOCX, TXT, Markdown, RTF

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Python, Flask, SQLAlchemy, SQLite |
| Detection | Custom heuristic engines (AI + Plagiarism) |

## Project Structure

```
SIH/
├── backend/
│   ├── main.py                 # Flask API server
│   ├── ai_service.py           # AI content detection engine (11 signals)
│   ├── plagiarism_service.py   # Plagiarism + cross-file detection
│   ├── auth.py                 # API key authentication
│   ├── database.py             # SQLAlchemy setup
│   ├── models.py               # Database models
│   ├── utils.py                # File extraction, report generation
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main entry
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Design system
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── LandingPage.tsx     # Public landing page
│   │   └── Dashboard.tsx       # Full dashboard (AI, Plagiarism, Reports, API, History)
│   ├── lib/
│   │   └── api.ts              # API client
│   └── package.json
└── .gitignore
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Endpoints

### Free (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/public/analyze/ai` | AI content detection |
| POST | `/public/analyze/plagiarism` | Plagiarism detection |
| POST | `/public/analyze/comprehensive` | Full analysis (AI + Plagiarism) |
| POST | `/public/analyze/cross-file` | Cross-file comparison (2+ files) |

### Protected (API Key Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api-key/generate` | Generate API key |
| POST | `/api-key/verify` | Verify API key |
| POST | `/analyze/ai` | AI detection (logged) |
| POST | `/analyze/plagiarism` | Plagiarism (logged) |
| POST | `/analyze/comprehensive` | Full analysis (logged) |
| POST | `/analyze/cross-file` | Cross-file comparison |
| GET | `/submissions` | Analysis history |

### Example Usage

```bash
# Free AI detection
curl -X POST http://localhost:5000/public/analyze/ai \
  -F "files=@document.txt"

# Free plagiarism check
curl -X POST http://localhost:5000/public/analyze/plagiarism \
  -F "files=@paper.pdf"

# API key protected (with history tracking)
curl -X POST http://localhost:5000/analyze/comprehensive \
  -H "X-API-Key: your_key_here" \
  -F "files=@essay.docx"
```

## AI Detection Signals

The AI detector analyzes 11 weighted linguistic signals:

1. **Structural Markers** — Intro/conclusion patterns (weight: 12%)
2. **Vocabulary Patterns** — Academic/formal word choices (weight: 18%)
3. **Hedging Language** — Excessive caution markers (weight: 10%)
4. **Formatting Elements** — Reference/citation patterns (weight: 8%)
5. **Personal Voice Absence** — Lack of first-person markers (weight: 12%)
6. **Repetitive Patterns** — Word frequency analysis (weight: 10%)
7. **Vocabulary Diversity** — Unique word ratio (weight: 14%)
8. **Sentence Variance** — Burstiness analysis (weight: 14%)
9. **Transition Words** — Connector frequency (weight: 12%)
10. **Perplexity Proxy** — Bigram predictability (weight: 14%)
11. **Punctuation Variance** — Comma/semicolon patterns (weight: 8%)

## Performance

| Test | Time |
|------|------|
| Single file plagiarism | ~2.4s |
| Comprehensive (AI + Plagiarism) | ~2.4s |
| 3-file cross-comparison | ~2.5s |

## License

MIT
