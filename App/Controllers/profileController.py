from flask import g, jsonify, render_template, request

from App.Models import Alumni, Profile
from App.database import db


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _profile_dict(profile):
    return {
        "profileID": profile.profileID,
        "alumniID": profile.alumniID,
        "bio": profile.bio,
        "profilePicture": profile.profilePicture,
        "contactInfo": profile.contactInfo or [],
        "socialLinks": profile.socialLinks or [],
        "profileVisibility": profile.profileVisibility,
        "showCurrentJob": profile.showCurrentJob,
        "allowMessages": profile.allowMessages,
        "showEmail": profile.showEmail,
    }


def my_profile():
    profile = Profile.query.filter_by(alumniID=g.current_user.userID).first()
    if not profile:
        profile = Profile(alumniID=g.current_user.userID)
        db.session.add(profile)
        db.session.commit()
    return render_template("profile.html", profile=profile, user=g.current_user)


def public_profile(alumni_id):
    profile = Profile.query.filter_by(alumniID=alumni_id).first()
    alumni = db.session.get(Alumni, alumni_id)
    if not profile or not alumni:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({"alumni": {"name": alumni.name, "email": alumni.email}, "profile": _profile_dict(profile)})


def updateBio():
    data = _payload()
    profile = Profile.query.filter_by(alumniID=g.current_user.userID).first()
    if not profile:
        profile = Profile(alumniID=g.current_user.userID)
        db.session.add(profile)

    profile.bio = (data.get("bio") or "").strip()
    if data.get("contactInfo") is not None:
        profile.contactInfo = data.get("contactInfo") or []
    if data.get("socialLinks") is not None:
        profile.socialLinks = data.get("socialLinks") or []
    if data.get("profileVisibility"):
        profile.profileVisibility = data["profileVisibility"].strip().lower()
    if data.get("showCurrentJob") is not None:
        profile.showCurrentJob = _to_bool(data.get("showCurrentJob"), default=True)
    if data.get("allowMessages") is not None:
        profile.allowMessages = _to_bool(data.get("allowMessages"), default=True)
    if data.get("showEmail") is not None:
        profile.showEmail = _to_bool(data.get("showEmail"), default=False)

    db.session.commit()
    return jsonify({"message": "Profile bio updated", "profile": _profile_dict(profile)})


def uploadPhoto():
    data = _payload()
    photo_url = (data.get("profilePicture") or "").strip()
    if not photo_url:
        return jsonify({"error": "profilePicture URL is required"}), 400

    profile = Profile.query.filter_by(alumniID=g.current_user.userID).first()
    if not profile:
        profile = Profile(alumniID=g.current_user.userID)
        db.session.add(profile)

    profile.profilePicture = photo_url
    db.session.commit()
    return jsonify({"message": "Profile photo updated", "profile": _profile_dict(profile)})
