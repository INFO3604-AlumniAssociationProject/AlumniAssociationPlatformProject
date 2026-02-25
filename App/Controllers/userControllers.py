from functools import wraps

from flask import Blueprint, g, jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from App.Models import Admin, Alumni, Profile, User
from App.database import db

user_bp = Blueprint("users", __name__)


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _wants_json():
    if request.is_json:
        return True
    accepted = request.accept_mimetypes
    return accepted.best == "application/json" and accepted["application/json"] >= accepted["text/html"]


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        user = get_current_user()
        if not user:
            if _wants_json():
                return jsonify({"error": "Authentication required"}), 401
            return redirect(url_for("users.login_page"))
        g.current_user = user
        return view_func(*args, **kwargs)

    return wrapped


def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapped(*args, **kwargs):
            user = g.current_user
            if user.role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return view_func(*args, **kwargs)

        return wrapped

    return decorator


def _user_dict(user):
    return {
        "userID": user.userID,
        "email": user.email,
        "name": user.name,
        "registrationDate": user.registrationDate.isoformat(),
        "role": user.role,
        "isApproved": user.isApproved,
        "notificationPreferences": user.notificationPreferences or {},
    }


@user_bp.get("/")
def home():
    if get_current_user():
        return redirect(url_for("users.dashboard"))
    return render_template("welcome.html")


@user_bp.get("/login")
def login_page():
    return render_template("login.html")


@user_bp.get("/register")
def register_page():
    return render_template("register.html")


@user_bp.get("/dashboard")
@login_required
def dashboard():
    user = g.current_user
    return render_template("dashboard.html", user=user)


@user_bp.post("/users/register")
def register_user():
    data = _payload()
    required = ["email", "password", "name", "role"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data["email"].strip().lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    role = data["role"].strip().lower()
    if role not in {"alumni", "admin"}:
        return jsonify({"error": "Role must be alumni or admin"}), 400

    if role == "alumni":
        alumni_required = ["graduationYear", "faculty", "degree"]
        missing = [field for field in alumni_required if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing alumni fields: {', '.join(missing)}"}), 400

        user = Alumni(
            email=data["email"].strip().lower(),
            password=generate_password_hash(data["password"]),
            name=data["name"].strip(),
            role="alumni",
            graduationYear=int(data["graduationYear"]),
            faculty=data["faculty"].strip(),
            degree=data["degree"].strip(),
            currentJobTitle=(data.get("currentJobTitle") or "").strip(),
            company=(data.get("company") or "").strip(),
            isPublicProfile=_to_bool(data.get("isPublicProfile"), default=True),
            isApproved=False,
            notificationPreferences={
                "email": True,
                "events": True,
                "jobs": True,
                "messages": True,
            },
        )
        db.session.add(user)
        db.session.flush()
        db.session.add(Profile(alumniID=user.alumniID))
    else:
        admin_required = ["adminLevel", "department"]
        missing = [field for field in admin_required if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing admin fields: {', '.join(missing)}"}), 400

        user = Admin(
            email=data["email"].strip().lower(),
            password=generate_password_hash(data["password"]),
            name=data["name"].strip(),
            role="admin",
            adminLevel=data["adminLevel"].strip(),
            department=data["department"].strip(),
            isApproved=True,
            notificationPreferences={
                "email": True,
                "moderation": True,
                "reports": True,
            },
        )
        db.session.add(user)

    db.session.commit()
    session["user_id"] = user.userID
    return jsonify({"message": "Registration successful", "user": _user_dict(user)}), 201


@user_bp.post("/users/login")
def login():
    data = _payload()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.role == "alumni" and not user.isApproved:
        return jsonify({"error": "Account pending admin approval"}), 403

    session["user_id"] = user.userID
    return jsonify({"message": "Login successful", "user": _user_dict(user)})


@user_bp.post("/users/logout")
@login_required
def logout():
    session.clear()
    if _wants_json():
        return jsonify({"message": "Logged out successfully"})
    return redirect(url_for("users.login_page"))


@user_bp.patch("/users/profile")
@login_required
def updateProfile():
    data = _payload()
    user = g.current_user

    new_name = data.get("name")
    new_email = data.get("email")

    if new_name:
        user.name = new_name.strip()
    if new_email:
        normalized = new_email.strip().lower()
        existing = User.query.filter(User.email == normalized, User.userID != user.userID).first()
        if existing:
            return jsonify({"error": "Email already in use"}), 409
        user.email = normalized

    db.session.commit()
    return jsonify({"message": "Profile updated", "user": _user_dict(user)})


@user_bp.post("/users/reset-password")
@login_required
def resetPassword():
    data = _payload()
    old_password = data.get("oldPassword") or ""
    new_password = data.get("newPassword") or ""
    user = g.current_user

    if not old_password or not new_password:
        return jsonify({"error": "Both oldPassword and newPassword are required"}), 400
    if not check_password_hash(user.password, old_password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password reset successful"})


@user_bp.post("/users/notifications")
@login_required
def sendNotification():
    data = _payload()
    user = g.current_user
    preferences = user.notificationPreferences or {}

    channel = (data.get("channel") or "email").strip().lower()
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    if not preferences.get(channel, False):
        return jsonify({"error": f"{channel} notifications are disabled"}), 400

    return jsonify(
        {
            "message": "Notification queued",
            "notification": {
                "to": user.email,
                "channel": channel,
                "content": message,
            },
        }
    )


@user_bp.get("/users/notifications/preferences")
@login_required
def getNotificationPreferences():
    user = g.current_user
    return jsonify({"preferences": user.notificationPreferences or {}})


@user_bp.patch("/users/notifications/preferences")
@login_required
def update_notification_preferences():
    data = _payload()
    user = g.current_user
    existing = user.notificationPreferences or {}

    allowed_keys = {"email", "events", "jobs", "messages", "moderation", "reports"}
    for key, value in data.items():
        if key in allowed_keys:
            existing[key] = _to_bool(value, default=bool(existing.get(key)))

    user.notificationPreferences = existing
    db.session.commit()
    return jsonify({"message": "Notification preferences updated", "preferences": existing})


@user_bp.get("/users/me")
@login_required
def me():
    return jsonify({"user": _user_dict(g.current_user)})
