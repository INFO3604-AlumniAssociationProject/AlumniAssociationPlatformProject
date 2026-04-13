from flask import Blueprint, jsonify, session
import secrets
from flask_jwt_extended import jwt_required, set_access_cookies, unset_jwt_cookies, verify_jwt_in_request
from App.Controllers import userController
from App.Controllers.auth import issue_access_token
from App.database import db
from App.utils import _payload
from App.Controllers.userController import currentUser
from App.Models import User


user_bp = Blueprint("users", __name__, url_prefix="/users")


@user_bp.route("/register", methods=["POST"])
def register():
    """POST /register - Create new user."""
    data = _payload()
    required = ["email", "password", "name", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    extra = {k: v for k, v in data.items() if k not in required}
    try:
        user_dict = userController.registerUser(
            email=data["email"],
            password=data["password"],
            name=data["name"],
            role=data["role"],
            **extra
        )
        return jsonify({"message": "Registration successful", "user": user_dict}), 201
    except ValueError as e:
        msg = str(e).lower()
        if "already" in msg or "duplicate" in msg or "exists" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@user_bp.route("/login", methods=["POST"])
def login():
    """POST /login - Authenticate and return JWT."""
    data = _payload()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    try:
        result = userController.loginUser(email, password)
        resp = jsonify({"message": "Login successful", "user": result["user"], "token": result["token"]})
        set_access_cookies(resp, result["token"])
        session["user_id"] = result["user"]["userID"]
        return resp, 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401


@user_bp.route("/refresh", methods=["POST"])
@jwt_required()
def refreshToken():
    """POST /refresh - Issue a new access token for current user."""
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    token = issue_access_token(user)
    resp = jsonify({"token": token, "user": user.to_dict()})
    set_access_cookies(resp, token)
    return resp, 200


@user_bp.route("/logout", methods=["POST"])
def logout():
    """POST /logout - Clear session and cookies."""
    resp = jsonify({"message": "Logged out"})
    unset_jwt_cookies(resp)
    session.clear()
    return resp, 200


@user_bp.route("/me", methods=["GET"])
@jwt_required()
def getCurrentUserInfo():
    """GET /me - Get current user info."""
    user = currentUser()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@user_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def updateProfile():
    """PATCH /profile - Update name or email."""
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    data = _payload()
    name = data.get("name")
    email = data.get("email")
    try:
        updated = userController.updateProfile(user.userID, name=name, email=email)
        return jsonify({"message": "Profile updated", "user": updated}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@user_bp.route("/forgot-password", methods=["POST"])
def forgotPassword():
    data = _payload()
    email = str(data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If that email exists, a reset link has been sent."}), 200
    token = secrets.token_urlsafe(32)
    user.savedJobIDs = user.savedJobIDs or []
    user.savedJobIDs.append(f"reset:{token}")
    db.session.commit()
    return jsonify({"resetToken": token, "message": "Reset link generated"}), 200


@user_bp.route("/reset-password", methods=["POST"])
def resetPassword():
    """POST /reset-password - Change password (token or authenticated)."""
    data = _payload()
    token = data.get("token")
    # Token-based reset (no auth required)
    if token:
        new_password = data.get("newPassword")
        if not token or not new_password:
            return jsonify({"error": "Token and new password required"}), 400
        user = None
        for u in User.query.all():
            if u.savedJobIDs and f"reset:{token}" in u.savedJobIDs:
                user = u
                break
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 400
        user.savedJobIDs = [x for x in (user.savedJobIDs or []) if x != f"reset:{token}"]
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password reset successful"}), 200

    # Authenticated password change (requires JWT)
    verify_jwt_in_request(optional=True)
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    old = data.get("oldPassword")
    new = data.get("newPassword")
    if not old or not new:
        return jsonify({"error": "oldPassword and newPassword required"}), 400
    try:
        userController.resetPassword(user.userID, old, new)
        return jsonify({"message": "Password reset successful"}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@user_bp.route("/notifications", methods=["POST"])
@jwt_required()
def sendNotification():
    """POST /notifications - Send a notification (simulated)."""
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    data = _payload()
    channel = data.get("channel", "email")
    message = data.get("message")
    if not message:
        return jsonify({"error": "message required"}), 400
    try:
        notif = userController.sendNotification(user.userID, channel, message)
        return jsonify({"notification": notif}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@user_bp.route("/notifications/preferences", methods=["GET"])
@jwt_required()
def getNotificationPreferences():
    """GET /notifications/preferences - Get preferences."""
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    prefs = userController.showNotificationPreferences(user.userID)
    return jsonify({"preferences": prefs}), 200


@user_bp.route("/notifications/preferences", methods=["PATCH"])
@jwt_required()
def updateNotificationPreferences():
    """PATCH /notifications/preferences - Update preferences."""
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    data = _payload()
    try:
        new_prefs = userController.updateNotificationPreferences(user.userID, data)
        return jsonify({"preferences": new_prefs}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400