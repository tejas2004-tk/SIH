from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from database import Base
from datetime import datetime

class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    user_name = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    daily_limit = Column(Integer, default=1000)
    requests_today = Column(Integer, default=0)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, nullable=True)  # Reference to API key used
    title = Column(String, nullable=True)
    filename = Column(String, nullable=False)           # saved filename (uuid prefixed)
    original_filename = Column(String, nullable=False)  # original file name
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    plagiarism_score = Column(Float, nullable=True)
    plagiarism_confidence = Column(Float, nullable=True)  # 0-100
    ai_score = Column(Float, nullable=True)
    ai_confidence = Column(Float, nullable=True)  # 0-100
    word_count = Column(Integer, nullable=True)
    sentence_count = Column(Integer, nullable=True)
    analysis_summary = Column(Text, nullable=True)
    matched_sources = Column(Text, nullable=True)  # JSON array of sources
    processing_status = Column(String, default="completed")  # pending, processing, completed
    report_data = Column(Text, nullable=True)  # JSON report
