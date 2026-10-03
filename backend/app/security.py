"""
Security utilities — password hashing and JWT token management
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.config import get_settings

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def save_profile_image_if_base64(image_data: Optional[str]) -> Optional[str]:
    """If image_data is a base64 Data URI, saves it permanently to disk in frontend/public/uploads."""
    if not image_data or not isinstance(image_data, str) or not image_data.startswith("data:image/"):
        return image_data
    try:
        import os
        import base64
        import uuid
        header, encoded = image_data.split(",", 1)
        ext = "jpg"
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
        public_uploads = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "uploads"))
        os.makedirs(public_uploads, exist_ok=True)
        filename = f"avatar_{uuid.uuid4().hex[:12]}.{ext}"
        filepath = os.path.join(public_uploads, filename)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
        return f"/uploads/{filename}"
    except Exception as e:
        print(f"[IMAGE SAVE ERROR] {e}")
        return image_data
