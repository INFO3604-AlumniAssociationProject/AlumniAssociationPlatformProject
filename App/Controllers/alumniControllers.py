from flask import Blueprint, g, jsonify, render_template, request
from sqlalchemy import or_

from App.Controllers.userControllers import role_required
from App.Models import Alumni, Event, EventRegistration, Job, JobApplication, Message
from App.database import db

alumni_bp = Blueprint("alumni", __name__, url_prefix="/alumni")


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _alumni_card(alumni):
    return {
        "alumniID": alumni.alumniID,
        "name": alumni.name,
        "email": alumni.email,
        "graduationYear": alumni.graduationYear,
        "faculty": alumni.faculty,
        "degree": alumni.degree,
        "currentJobTitle": alumni.currentJobTitle,
        "company": alumni.company,
    }


@alumni_bp.get("")
@role_required("alumni")
def alumni_home():
    return render_template("dashboard.html", user=g.current_user)


@alumni_bp.get("/search")
@role_required("alumni")
def searchAlumni():
    query = (request.args.get("q") or "").strip().lower()
    faculty = (request.args.get("faculty") or "").strip().lower()
    graduation_year = request.args.get("graduationYear")

    records = Alumni.query.filter(Alumni.isPublicProfile.is_(True))
    if query:
        like = f"%{query}%"
        records = records.filter(or_(Alumni.name.ilike(like), Alumni.email.ilike(like)))
    if faculty:
        records = records.filter(Alumni.faculty.ilike(f"%{faculty}%"))
    if graduation_year:
        records = records.filter(Alumni.graduationYear == int(graduation_year))

    results = [_alumni_card(a) for a in records.order_by(Alumni.name.asc()).all()]
    return jsonify({"results": results})


@alumni_bp.post("/connect")
@role_required("alumni")
def connectToAlumni():
    data = _payload()
    requester = g.current_user
    target_id = (data.get("alumniID") or "").strip()

    if not target_id:
        return jsonify({"error": "alumniID is required"}), 400
    if target_id == requester.userID:
        return jsonify({"error": "Cannot connect to yourself"}), 400

    target = db.session.get(Alumni, target_id)
    if not target:
        return jsonify({"error": "Target alumni not found"}), 404

    existing = Message.query.filter_by(
        senderID=requester.userID,
        receiverID=target_id,
        status="requested",
    ).first()
    if existing:
        return jsonify({"message": "Connection request already sent", "messageID": existing.messageID})

    invitation = Message(
        senderID=requester.userID,
        receiverID=target_id,
        content=(data.get("message") or "I'd like to connect with you."),
        status="requested",
        attachments=[],
    )
    db.session.add(invitation)
    db.session.commit()
    return jsonify({"message": "Connection request sent", "messageID": invitation.messageID}), 201


@alumni_bp.post("/events/<event_id>/register")
@role_required("alumni")
def registerForEvent(event_id):
    alumni_user = g.current_user
    event = db.session.get(Event, event_id)
    if not event or event.status != "active":
        return jsonify({"error": "Event not available"}), 404

    attendee_count = EventRegistration.query.filter_by(eventID=event_id, status="registered").count()
    if attendee_count >= event.maxAttendees:
        return jsonify({"error": "Event is full"}), 409

    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=alumni_user.userID).first()
    if existing:
        return jsonify({"message": "Already registered", "registrationID": existing.registrationID})

    registration = EventRegistration(eventID=event_id, attendeeID=alumni_user.userID)
    db.session.add(registration)
    db.session.commit()
    return jsonify({"message": "Registered successfully", "registrationID": registration.registrationID}), 201


@alumni_bp.post("/jobs/<job_id>/apply")
@role_required("alumni")
def applyForJob(job_id):
    data = _payload()
    applicant = g.current_user
    job = db.session.get(Job, job_id)
    if not job or job.status != "open":
        return jsonify({"error": "Job not available"}), 404

    existing = JobApplication.query.filter_by(jobID=job_id, alumniID=applicant.userID).first()
    if existing:
        return jsonify({"message": "You have already applied", "applicationID": existing.applicationID})

    application = JobApplication(
        jobID=job_id,
        alumniID=applicant.userID,
        coverLetter=(data.get("coverLetter") or "").strip(),
    )
    db.session.add(application)
    db.session.commit()
    return jsonify({"message": "Application submitted", "applicationID": application.applicationID}), 201


@alumni_bp.post("/jobs")
@role_required("alumni")
def postJobListing():
    data = _payload()
    required = ["boardID", "title", "company", "description", "expiryDate"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    from App.Controllers.jobController import _build_job

    job = _build_job(data=data, alumni_id=g.current_user.userID, admin_id=None)
    db.session.add(job)
    db.session.commit()
    return jsonify({"message": "Job listing posted", "jobID": job.jobID}), 201
