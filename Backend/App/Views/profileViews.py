# File: App/Views/profileViews.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import profileController
from App.Models import Alumni
from App.database import db
from App.utils import _payload
from App.Controllers.userController import currentUser


profile_bp = Blueprint("profiles", __name__, url_prefix="/profiles")


@profile_bp.route("/me/data", methods=["GET"])
@jwt_required()
def myProfileApi():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni or admin access required"}), 403
    profile_dict = profileController.viewProfile(user.userID)
    return jsonify({
        "profile": profile_dict,
        "user": {
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


@profile_bp.route("/<alumni_id>", methods=["GET"])
@jwt_required()
def publicProfile(alumni_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    target = db.session.get(Alumni, alumni_id)
    if not target:
        return jsonify({"error": "Alumni not found"}), 404
    profile_dict = profileController.viewProfile(alumni_id)
    return jsonify({
        "alumni": {"name": target.name, "email": target.email},
        "profile": profile_dict
    }), 200


@profile_bp.route("/me/bio", methods=["PATCH"])
@jwt_required()
def updateBio():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni or admin access required"}), 403
    data = _payload()
    try:
        updated = profileController.updateBio(
            alumni_id=user.userID,
            bio=data.get("bio"),
            contact_info=data.get("contactInfo"),
            social_links=data.get("socialLinks"),
            profile_visibility=data.get("profileVisibility"),
            show_current_job=data.get("showCurrentJob"),
            allow_messages=data.get("allowMessages"),
            show_email=data.get("showEmail")
        )
        return jsonify({"message": "Profile updated", "profile": updated.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@profile_bp.route("/me/photo", methods=["PATCH"])
@jwt_required()
def uploadPhoto():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni or admin access required"}), 403
    data = _payload()
    photo_url = data.get("profilePicture")
    if not photo_url:
        return jsonify({"error": "profilePicture URL is required"}), 400
    try:
        updated = profileController.updateProfilePhoto(user.userID, photo_url)
        return jsonify({"message": "Profile photo updated", "profile": updated.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400