from datetime import datetime, timezone
from App.database import db
from App.Models import Job, JobApplication, Message


def createApplication(alumni_id: str, job_id: str) -> dict:
    job = db.session.get(Job, job_id)
    if not job or job.status not in {"open", "approved"}:
        raise ValueError("Job not available for application")
    
    existing = JobApplication.query.filter_by(jobID=job_id, alumniID=alumni_id).first()
    if existing:
        if existing.status == "withdrawn":
            existing.status = "pending"
            existing.applicationDate = datetime.now(timezone.utc)
            db.session.commit()
            return existing
        else:
            raise ValueError("You have already applied to this job")
    
    application = JobApplication(
        jobID=job_id,
        alumniID=alumni_id,
        status="pending",
        applicationDate=datetime.now(timezone.utc)
    )
    db.session.add(application)
    db.session.commit()

    # Send confirmation message to applicant
    try:
        confirmation_msg = Message(
            senderID="system",
            receiverID=alumni_id,
            content=f"Your application for '{job.title}' at {job.company} has been submitted successfully. The employer will review it shortly.",
            status="sent",
            attachments=[]
        )
        db.session.add(confirmation_msg)
        db.session.commit()
    except Exception:
        # Non‑critical, don't fail the application
        pass

    return application


def viewApplication(application_id: str, alumni_id: str = None, is_admin: bool = False):
    app = db.session.get(JobApplication, application_id)
    if not app:
        raise ValueError("Application not found")
    if not is_admin and app.alumniID != alumni_id:
        raise PermissionError("Permission denied")
    return app


def listApplications(alumni_id: str = None, is_admin: bool = False) -> list:
    query = JobApplication.query.order_by(JobApplication.applicationDate.desc())
    if not is_admin:
        if not alumni_id:
            return []
        query = query.filter_by(alumniID=alumni_id)
    return query.all()


def withdrawApplication(application_id: str, alumni_id: str):
    app = db.session.get(JobApplication, application_id)
    if not app:
        raise ValueError("Application not found")
    if app.alumniID != alumni_id:
        raise PermissionError("Only the applicant can withdraw")
    if app.status in ("withdrawn", "rejected"):
        raise ValueError(f"Application already {app.status}")
    app.status = "withdrawn"
    db.session.commit()
    return app


def updateApplicationStatus(application_id: str, new_status: str, is_admin: bool = False):
    if not is_admin:
        raise PermissionError("Only admin can change application status")
    if new_status not in ("pending", "approved", "rejected", "withdrawn"):
        raise ValueError("Invalid status")
    app = db.session.get(JobApplication, application_id)
    if not app:
        raise ValueError("Application not found")
    old_status = app.status
    app.status = new_status
    db.session.commit()

    # Send message if approved
    if new_status == "approved" and old_status != "approved":
        job = db.session.get(Job, app.jobID)
        if job:
            msg = Message(
                senderID="system",
                receiverID=app.alumniID,
                content=f"Congratulations! Your application for '{job.title}' has been approved. The employer will contact you soon.",
                status="sent",
                attachments=[]
            )
            db.session.add(msg)
            db.session.commit()

    return app