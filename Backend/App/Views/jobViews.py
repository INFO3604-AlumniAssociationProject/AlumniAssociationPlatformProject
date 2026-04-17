from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from App.Controllers import jobController
from App.utils import _payload
from App.Controllers.userController import currentUser


job_bp = Blueprint("jobs", __name__, url_prefix="/jobs")


@job_bp.route("/list", methods=["GET"])
@jwt_required()
def listJobs():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    status = request.args.get("status", "open")
    limit = request.args.get("limit")
    offset = request.args.get("offset", 0)
    if limit:
        jobs = jobController.listJobs(status=status, limit=limit, offset=offset, current_user=user)
        return jsonify({"jobs": jobs}), 200
    jobs = jobController.listJobs(status)
    return jsonify({"jobs": [job.to_dict() for job in jobs]}), 200


@job_bp.route("/<job_id>", methods=["GET"])
@jwt_required()
def getJob(job_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    job = next((record for record in jobController.listJobs(status="open", limit=500, offset=0, current_user=user) if str(record.get("jobID")) == str(job_id)), None)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job), 200


@job_bp.route("", methods=["POST"])
@jwt_required()
def postJob():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni or admin access required"}), 403
    data = _payload()
    required = ["boardID", "title", "company", "description", "expiryDate"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    try:
        admin_id = user.userID if user.role == "admin" else None
        job_id = jobController.createJob(
            alumni_id=user.userID,
            board_id=data["boardID"],
            title=data["title"],
            company=data["company"],
            description=data["description"],
            expiry_date_str=data["expiryDate"],
            salary_range=data.get("salaryRange"),
            location=data.get("location"),
            admin_id=admin_id
        )
        return jsonify({"message": "Job posted", "jobID": job_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@job_bp.route("/<job_id>", methods=["PATCH"])
@jwt_required()
def updateJob(job_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    data = _payload()
    is_admin = (user.role == "admin")
    try:
        jobController.updateJob(job_id, user.userID, is_admin, **data)
        return jsonify({"message": "Job updated", "jobID": job_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@job_bp.route("/<job_id>/close", methods=["POST"])
@jwt_required()
def closeJob(job_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    is_admin = (user.role == "admin")
    try:
        jobController.closeJob(job_id, user.userID, is_admin)
        return jsonify({"message": "Job closed", "jobID": job_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@job_bp.route("/<job_id>/applications", methods=["GET"])
@jwt_required()
def getJobApplications(job_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    is_admin = (user.role == "admin")
    try:
        apps = jobController.viewJobApplications(job_id, user.userID, is_admin)
        return jsonify({"jobID": job_id, "applications": [a.to_dict() for a in apps]}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@job_bp.route("/applied/me", methods=["GET"])
@jwt_required()
def getAppliedJobs():
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    jobs = jobController.showAppliedJobs(user.userID)
    return jsonify({"applications": jobs}), 200


@job_bp.route("/saved/me", methods=["GET"])
@jwt_required()
def getSavedJobs():
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    saved_ids = jobController.showSavedJobs(user.userID)
    return jsonify({"savedJobIDs": saved_ids}), 200


@job_bp.route("/<job_id>/save", methods=["POST"])
@jwt_required()
def saveJob(job_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        result = jobController.saveJob(user.userID, job_id)
        return jsonify(result), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@job_bp.route("/<job_id>/testimonials", methods=["POST"])
@jwt_required()
def addTestimonial(job_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    stars = data.get("stars")
    comment = data.get("comment")
    if not stars or not comment:
        return jsonify({"error": "stars and comment required"}), 400
    try:
        testimonial = jobController.addTestimonial(
            job_id, user.userID, user.name,
            f"https://ui-avatars.com/api/?name={user.name}&background=random",
            int(stars), comment
        )
        return jsonify({"testimonial": testimonial}), 201
    except (ValueError, PermissionError) as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        if "already" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@job_bp.route("/<job_id>/testimonials/<testimonial_id>", methods=["DELETE"])
@jwt_required()
def deleteTestimonial(job_id, testimonial_id):
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    try:
        jobController.deleteTestimonial(job_id, testimonial_id, is_admin=True)
        return jsonify({"message": "Testimonial deleted"}), 200
    except (ValueError, PermissionError) as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400