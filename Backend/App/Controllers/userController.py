# File: App/Controllers/userController.py

import re
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import get_jwt_identity
from App.database import db
from App.Models import User, Alumni, Admin, Profile
from App.Controllers.auth import authenticate_user, issue_access_token
from App.utils import _to_bool


def currentUser():
    """Retrieve current user from JWT identity. Returns User object or None."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, user_id)


def registerUser(email: str, password: str, name: str, role: str, **kwargs) -> dict:
    """
    Register a new user (alumni or admin).
    Returns user dict.
    Raises ValueError for validation errors or duplicate email.
    """
    email = email.strip().lower()
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        raise ValueError("Invalid email format")
    if not password:
        raise ValueError("Password is required")

    if User.query.filter_by(email=email).first():
        raise ValueError(f"Email already registered: {email}")
    
    role = role.strip().lower()
    if role not in {"alumni", "admin"}:
        raise ValueError("Role must be 'alumni' or 'admin'")
    
    hashed_pw = generate_password_hash(password)
    
    if role == "alumni":
        required = ["graduationYear", "faculty", "degree"]
        missing = [f for f in required if f not in kwargs]
        if missing:
            raise ValueError(f"Missing alumni fields: {', '.join(missing)}")
        grad_year = int(kwargs["graduationYear"])
        if grad_year < 1950 or grad_year > 2030:
            raise ValueError("graduationYear must be between 1950 and 2030")
        
        user = Alumni(
            email=email,
            password=hashed_pw,
            name=name.strip(),
            role="alumni",
            graduationYear=grad_year,
            faculty=kwargs["faculty"].strip(),
            degree=kwargs["degree"].strip(),
            currentJobTitle=kwargs.get("currentJobTitle", "").strip(),
            company=kwargs.get("company", "").strip(),
            isPublicProfile=_to_bool(kwargs.get("isPublicProfile"), default=True),
            isApproved=False,
            notificationPreferences={
                "email": True,
                "events": True,
                "jobs": True,
                "messages": True,
            }
        )
        db.session.add(user)
        db.session.flush()
        db.session.add(Profile(alumniID=user.alumniID))
    else:  # admin
        required = ["adminLevel", "department"]
        missing = [f for f in required if f not in kwargs]
        if missing:
            raise ValueError(f"Missing admin fields: {', '.join(missing)}")
        
        user = Admin(
            email=email,
            password=hashed_pw,
            name=name.strip(),
            role="admin",
            adminLevel=kwargs["adminLevel"].strip(),
            department=kwargs["department"].strip(),
            isApproved=True,
            notificationPreferences={
                "email": True,
                "moderation": True,
                "reports": True,
            }
        )
        db.session.add(user)
    
    db.session.commit()
    
    result = user.to_dict()
    if user.role == "alumni":
        result["requiresApproval"] = True
    else:
        result["requiresApproval"] = False
    return result


def loginUser(email: str, password: str) -> dict:
    """
    Authenticate user and return token and user dict.
    Raises ValueError for invalid credentials or unapproved alumni.
    """
    user = authenticate_user(email, password)
    if not user:
        raise ValueError("Invalid email or password")
    
    if user.role == "alumni" and not user.isApproved:
        raise ValueError("Account pending admin approval")
    
    token = issue_access_token(user)
    return {"token": token, "user": user.to_dict()}


def logoutUser() -> None:
    """Logout – stateless JWT, nothing to do on server. Client discards token."""
    pass


def updateProfile(user_id: str, name: str = None, email: str = None) -> dict:
    """Update user's name or email."""
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    
    if name is not None:
        user.name = name.strip()
    if email is not None:
        new_email = email.strip().lower()
        existing = User.query.filter(User.email == new_email, User.userID != user_id).first()
        if existing:
            raise ValueError("Email already in use")
        user.email = new_email
    
    db.session.commit()
    return user.to_dict()


def resetPassword(user_id: str, old_password: str, new_password: str) -> None:
    """Change user password after validating old password."""
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    if not check_password_hash(user.password, old_password):
        raise ValueError("Current password is incorrect")
    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters")
    
    user.password = generate_password_hash(new_password)
    db.session.commit()


def sendNotification(user_id: str, channel: str, message: str) -> dict:
    """Simulate sending a notification. Returns notification data."""
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    prefs = user.notificationPreferences or {}
    if not prefs.get(channel, False):
        raise ValueError(f"{channel} notifications are disabled for this user")
    
    return {
        "to": user.email,
        "channel": channel,
        "content": message,
        "sent_at": "now"
    }


def showNotificationPreferences(user_id: str) -> dict:
    """Return user's notification preferences."""
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    return user.notificationPreferences or {}


def updateNotificationPreferences(user_id: str, preferences: dict) -> dict:
    """
    Update user's notification preferences.
    Allowed keys: email, events, jobs, messages, moderation, reports.
    """
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    
    existing = user.notificationPreferences or {}
    allowed_keys = {"email", "events", "jobs", "messages", "moderation", "reports"}
    for key, value in preferences.items():
        if key in allowed_keys:
            existing[key] = _to_bool(value, default=existing.get(key, False))
    
    user.notificationPreferences = existing
    db.session.commit()
    return existing