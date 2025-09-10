from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from database import Base
from datetime import datetime

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    filename = Column(String, nullable=False)           # saved filename (uuid prefixed)
    original_filename = Column(String, nullable=False)  # original file name
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    plagiarism_score = Column(Float, nullable=True)
    ai_score = Column(Float, nullable=True)
    word_count = Column(Integer, nullable=True)
    sentence_count = Column(Integer, nullable=True)
    analysis_summary = Column(Text, nullable=True)
