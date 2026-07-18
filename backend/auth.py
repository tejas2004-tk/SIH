import secrets
from functools import wraps
from flask import request, jsonify
from database import SessionLocal
from models import APIKey
from sqlalchemy.orm import Session
import uuid

# ==========================================
# API Key Management
# ==========================================

def generate_api_key():
    """Generate a secure API key"""
    return f"sih_{uuid.uuid4().hex}_{secrets.token_hex(16)}"

def create_api_key(user_name: str, organization: str = None, daily_limit: int = 1000):
    """Create a new API key in the database"""
    db: Session = SessionLocal()
    try:
        key = generate_api_key()
        api_key = APIKey(
            key=key,
            user_name=user_name,
            organization=organization,
            daily_limit=daily_limit
        )
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        return {
            "id": api_key.id,
            "key": key,
            "user_name": user_name,
            "organization": organization,
            "created_at": api_key.created_at.isoformat(),
            "daily_limit": daily_limit
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def verify_api_key(api_key: str, count_usage: bool = False):
    """Verify API key and return user info"""
    db: Session = SessionLocal()
    try:
        key_record = db.query(APIKey).filter(APIKey.key == api_key).first()
        if not key_record:
            return None
        if not key_record.is_active:
            return None
        if key_record.requests_today >= key_record.daily_limit:
            return {"error": "Daily limit exceeded", "record": None}
        if count_usage:
            key_record.requests_today += 1
            key_record.last_used = __import__('datetime').datetime.utcnow()
            db.commit()
        return key_record
    finally:
        db.close()


def get_api_key_info(api_key: str):
    """Return API key metadata without counting as a usage request."""
    db: Session = SessionLocal()
    try:
        key_record = db.query(APIKey).filter(APIKey.key == api_key).first()
        if not key_record or not key_record.is_active:
            return None
        return {
            "id": key_record.id,
            "user_name": key_record.user_name,
            "organization": key_record.organization,
            "created_at": key_record.created_at.isoformat() if key_record.created_at else None,
            "last_used": key_record.last_used.isoformat() if key_record.last_used else None,
            "daily_limit": key_record.daily_limit,
            "requests_today": key_record.requests_today,
            "remaining_today": max(0, key_record.daily_limit - key_record.requests_today),
            "is_active": key_record.is_active,
        }
    finally:
        db.close()

def update_api_key_usage(api_key: str):
    """Update API key usage statistics"""
    db: Session = SessionLocal()
    try:
        key_record = db.query(APIKey).filter(APIKey.key == api_key).first()
        if key_record:
            key_record.requests_today += 1
            key_record.last_used = __import__('datetime').datetime.utcnow()
            db.commit()
    finally:
        db.close()

# ==========================================
# Decorators
# ==========================================

def require_api_key(f):
    """Decorator to check API key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({"error": "Missing API key. Use X-API-Key header"}), 401
        
        key_record = verify_api_key(api_key)
        if not key_record:
            return jsonify({"error": "Invalid or inactive API key"}), 401
        
        if isinstance(key_record, dict) and "error" in key_record:
            return jsonify(key_record), 429
        
        # Update usage
        update_api_key_usage(api_key)
        
        # Pass the key record to the route
        kwargs['api_key_id'] = key_record.id
        kwargs['user_name'] = key_record.user_name
        
        return f(*args, **kwargs)
    
    return decorated_function

def optional_api_key(f):
    """Decorator to accept optional API key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        api_key_id = None
        
        if api_key:
            key_record = verify_api_key(api_key)
            if key_record and "error" not in key_record:
                update_api_key_usage(api_key)
                api_key_id = key_record.id
        
        kwargs['api_key_id'] = api_key_id
        
        return f(*args, **kwargs)
    
    return decorated_function
