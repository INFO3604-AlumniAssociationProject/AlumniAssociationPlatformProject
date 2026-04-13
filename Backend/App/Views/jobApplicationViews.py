from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import jobApplicationController
from App.utils import _payload
from App.Controllers.userController import currentUser


job_application_bp = Blueprint("job_applications", __name__, url_prefix="/applications")


@job_application_bp.route("", methods=["GET"])
@jwt_required()
def listApplications():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    is_admin = (user.role == "admin")
    apps = jobApplicationController.listApplications(user.userID, is_admin)
    return jsonify({"applications": [a.to_dict() for a in apps]}), 200


@job_application_bp.route("/<application_id>", methods=["GET"])
@jwt_required()
def getApplication(application_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    is_admin = (user.role == "admin")
    try:
        app = jobApplicationController.viewApplication(application_id, user.userID, is_admin)
        return jsonify({"application": app.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@job_application_bp.route("", methods=["POST"])
@jwt_required()
def createApplication():
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    job_id = data.get("jobID")
    if not job_id:
        return jsonify({"error": "jobID is required"}), 400
    try:
        app = jobApplicationController.createApplication(user.userID, job_id)
        return jsonify({"message": "Application submitted", "application": app.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409


@job_application_bp.route("/<application_id>/withdraw", methods=["POST"])
@jwt_required()
def withdrawApplication(application_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        app = jobApplicationController.withdrawApplication(application_id, user.userID)
        return jsonify({"message": "Application withdrawn", "application": app.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@job_application_bp.route("/<application_id>/status", methods=["PATCH"])
@jwt_required()
def updateApplicationStatus(application_id):
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = _payload()
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "status is required"}), 400
    try:
        app = jobApplicationController.updateApplicationStatus(application_id, new_status, is_admin=True)
        return jsonify({"message": "Status updated", "application": app.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403