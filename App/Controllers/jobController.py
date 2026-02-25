from datetime import datetime

from flask import Blueprint, g, jsonify, render_template, request

from App.Controllers.userControllers import login_required, role_required
from App.Models import Job, JobApplication
from App.database import db

job_bp = Blueprint("jobs", __name__, url_prefix="/jobs")


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _job_dict(job):
    return {
        "jobID": job.jobID,
        "boardID": job.boardID,
        "alumniID": job.alumniID,
        "adminID": job.adminID,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "salaryRange": job.salaryRange,
        "location": job.location,
        "postedDate": job.postedDate.isoformat(),
        "expiryDate": job.expiryDate.isoformat(),
        "status": job.status,
    }


def _build_job(data, alumni_id, admin_id):
    expiry_date = datetime.strptime(data["expiryDate"], "%Y-%m-%d").date()
    return Job(
        boardID=data["boardID"].strip(),
        alumniID=alumni_id,
        adminID=admin_id,
        title=data["title"].strip(),
        company=data["company"].strip(),
        description=data["description"].strip(),
        salaryRange=(data.get("salaryRange") or "").strip(),
        location=(data.get("location") or "").strip(),
        expiryDate=expiry_date,
        status="open",
    )


@job_bp.get("")
@login_required
def list_jobs_page():
    jobs = Job.query.order_by(Job.postedDate.desc()).all()
    return render_template("jobs.html", jobs=jobs)


@job_bp.post("")
@role_required("alumni", "admin")
def postJob():
    data = _payload()
    required = ["boardID", "title", "company", "description", "expiryDate"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        admin_id = g.current_user.userID if g.current_user.role == "admin" else None
        job = _build_job(data=data, alumni_id=g.current_user.userID, admin_id=admin_id)
    except ValueError:
        return jsonify({"error": "expiryDate must be YYYY-MM-DD"}), 400

    db.session.add(job)
    db.session.commit()
    return jsonify({"message": "Job posted", "job": _job_dict(job)}), 201


@job_bp.patch("/<job_id>")
@role_required("alumni", "admin")
def updateJob(job_id):
    data = _payload()
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    if g.current_user.role != "admin" and job.alumniID != g.current_user.userID:
        return jsonify({"error": "Only the owner or admin can update this job"}), 403

    editable = ["title", "company", "description", "salaryRange", "location", "status"]
    for field in editable:
        if data.get(field) is not None:
            setattr(job, field, str(data[field]).strip())

    if data.get("expiryDate"):
        try:
            job.expiryDate = datetime.strptime(data["expiryDate"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "expiryDate must be YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify({"message": "Job updated", "job": _job_dict(job)})


@job_bp.post("/<job_id>/close")
@role_required("alumni", "admin")
def closeJob(job_id):
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if g.current_user.role != "admin" and job.alumniID != g.current_user.userID:
        return jsonify({"error": "Only the owner or admin can close this job"}), 403

    job.status = "closed"
    db.session.commit()
    return jsonify({"message": "Job closed", "jobID": job.jobID})


@job_bp.get("/<job_id>/applications")
@role_required("alumni", "admin")
def receiveApplications(job_id):
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if g.current_user.role != "admin" and job.alumniID != g.current_user.userID:
        return jsonify({"error": "Only the owner or admin can view applications"}), 403

    applications = JobApplication.query.filter_by(jobID=job_id).order_by(JobApplication.appliedDate.desc()).all()
    payload = [
        {
            "applicationID": app.applicationID,
            "alumniID": app.alumniID,
            "coverLetter": app.coverLetter,
            "status": app.status,
            "appliedDate": app.appliedDate.isoformat(),
        }
        for app in applications
    ]
    return jsonify({"jobID": job_id, "applications": payload})


@job_bp.post("/<job_id>/withdraw")
@role_required("alumni")
def withdraw(job_id):
    application = JobApplication.query.filter_by(jobID=job_id, alumniID=g.current_user.userID).first()
    if not application:
        return jsonify({"error": "Application not found"}), 404

    application.status = "withdrawn"
    db.session.commit()
    return jsonify({"message": "Application withdrawn", "applicationID": application.applicationID})
