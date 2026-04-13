from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from App.Controllers import alumniControllers, eventRegistrationControllers, jobApplicationController, messageController
from App.utils import _payload
from App.Controllers.userController import currentUser


alumni_bp = Blueprint("alumni", __name__, url_prefix="/alumni")


@alumni_bp.route("/connect", methods=["POST"])
@jwt_required()
def connectToAlumni():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    target_id = data.get("alumniID")
    message = data.get("message")
    if not target_id:
        return jsonify({"error": "alumniID is required"}), 400
    try:
        msg_id = messageController.requestMessage(user.userID, target_id, message)
        return jsonify({"message": "Connection request sent", "messageID": msg_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@alumni_bp.route("/events/<event_id>/register", methods=["POST"])
@jwt_required()
def registerForEvent(event_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        reg_id = eventRegistrationControllers.registerForEvent(event_id, user.userID)
        return jsonify({"message": "Registered successfully", "registrationID": reg_id}), 201
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        if "already" in msg or "exists" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@alumni_bp.route("/jobs/<job_id>/apply", methods=["POST"])
@jwt_required()
def applyForJob(job_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        app_obj = jobApplicationController.createApplication(user.userID, job_id)
        app_id = getattr(app_obj, 'applicationID', None) or getattr(app_obj, 'applicationId', None) or str(app_obj)
        return jsonify({"message": "Application submitted", "applicationID": app_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409


@alumni_bp.route("/search", methods=["GET"])
@jwt_required()
def searchAlumni():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    query = request.args.get("q")
    faculty = request.args.get("faculty")
    grad_year = request.args.get("graduationYear")
    if grad_year:
        try:
            grad_year = int(grad_year)
        except ValueError:
            return jsonify({"error": "graduationYear must be integer"}), 400
    try:
        results = alumniControllers.searchAlumni(query, faculty, grad_year)
        return jsonify({"results": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400