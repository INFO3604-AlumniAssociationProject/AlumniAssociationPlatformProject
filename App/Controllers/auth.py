from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app, request
from werkzeug.security import check_password_hash

from App.Models import User
from App.database import db

JWT_ALGORITHM = "HS256"
JWT_TTL_HOURS = 12


def authenticate_user(email: str, password: str):
    """Authenticate and return a user object or None."""
    normalized_email = (email or "").strip().lower()
    if not normalized_email or not password:
        return None
    user = User.query.filter_by(email=normalized_email).first()
    if user and check_password_hash(user.password, password):
        return user
    return None


def issue_access_token(user, ttl_hours: int = JWT_TTL_HOURS):
    """Create a signed JWT for the given user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.userID,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=ttl_hours)).timestamp()),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    """Decode and validate a JWT, returning (payload, error)."""
    try:
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "iat", "exp"]},
        )
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "expired"
    except jwt.InvalidTokenError:
        return None, "invalid"


def extract_bearer_token(req=None):
    """Extract Bearer token from Authorization header."""
    active_request = req or request
    authorization = (active_request.headers.get("Authorization") or "").strip()
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            return token
    return None


def login(email: str, password: str):
    """Authenticate and return (token, user) or (None, None)."""
    user = authenticate_user(email, password)
    if not user:
        return None, None
    return issue_access_token(user), user


def get_user_from_token(token: str):
    """Resolve a user from a token, returning (user, payload, error)."""
    payload, error = decode_access_token(token)
    if not payload:
        return None, None, error
    user = db.session.get(User, payload.get("sub"))
    if not user:
        return None, payload, "invalid"
    return user, payload, None
