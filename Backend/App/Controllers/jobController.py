# File: App/Controllers/jobController.py

from datetime import datetime, date, timezone
from flask import current_app
from uuid import uuid4

from App.database import db
from App.Models import Job, JobApplication, Alumni, User


def createJob(alumni_id: str, board_id: str, title: str, company: str,
              description: str, expiry_date_str: str, salary_range: str = None,
              location: str = None, admin_id: str = None) -> str:
    title_clean = title.strip()
    if not title_clean:
        raise ValueError("Title cannot be empty")

    # Inline expiry date parsing
    try:
        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("expiryDate must be YYYY-MM-DD")

    job = Job(
        boardID=board_id,
        alumniID=alumni_id,
        adminID=admin_id,
        title=title_clean,
        company=company.strip(),
        description=description.strip(),
        salaryRange=salary_range or "",
        location=location or "",
        expiryDate=expiry_date,
        status="open",
        testimonials=[]
    )
    db.session.add(job)
    db.session.commit()
    return job.jobID


def saveJob(alumni_id: str, job_id: str) -> dict:
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    if job.status not in {"open", "pending", "approved"}:
        raise ValueError("Job not available")

    user = db.session.get(User, alumni_id)
    if not user:
        raise ValueError("User not found")

    saved_ids = set(user.savedJobIDs or [])
    if job_id in saved_ids:
        saved_ids.remove(job_id)
        saved = False
    else:
        saved_ids.add(job_id)
        saved = True
    user.savedJobIDs = list(saved_ids)
    db.session.commit()
    return {"saved": saved, "savedJobIDs": user.savedJobIDs}


def showSavedJobs(alumni_id: str) -> list:
    """Return list of saved job IDs."""
    user = db.session.get(User, alumni_id)
    if not user:
        raise ValueError("User not found")
    return user.savedJobIDs or []


def addTestimonial(job_id: str, alumni_id: str, name: str, avatar: str, stars: int, comment: str) -> dict:
    """Add a testimonial to a job, one per alumni."""
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    testimonials = job.testimonials or []
    if any(t.get("alumniID") == alumni_id for t in testimonials):
        raise ValueError("Testimonial already exists for this user")
    new_testimonial = {
        "id": str(uuid4()),
        "alumniID": alumni_id,
        "name": name,
        "avatar": avatar,
        "stars": int(stars),
        "comment": comment.strip(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    testimonials.append(new_testimonial)
    job.testimonials = testimonials
    db.session.commit()
    return new_testimonial


def deleteTestimonial(job_id: str, testimonial_id: str, is_admin: bool = False) -> None:
    """Delete a testimonial (admin only)."""
    if not is_admin:
        raise PermissionError("Only admin can delete testimonials")
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    testimonials = job.testimonials or []
    new_list = [t for t in testimonials if t.get("id") != testimonial_id]
    if len(new_list) == len(testimonials):
        raise ValueError("Testimonial not found")
    job.testimonials = new_list
    db.session.commit()


def showAppliedJobs(alumni_id: str) -> list:
    """Return list of job applications with job details for current user."""
    apps = JobApplication.query.filter_by(alumniID=alumni_id).order_by(JobApplication.applicationDate.desc()).all()
    result = []
    for app in apps:
        job = db.session.get(Job, app.jobID)
        if job:
            result.append({
                "jobID": job.jobID,
                "title": job.title,
                "company": job.company,
                "status": app.status,
                "applicationDate": app.applicationDate.isoformat()
            })
    return result


def updateJob(job_id: str, requester_id: str, is_admin: bool = False, **fields) -> None:
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    if not is_admin and job.alumniID != requester_id:
        raise PermissionError("Only the owner or admin can update this job")

    editable = ["title", "company", "description", "salaryRange", "location", "status"]
    for field in editable:
        if field in fields and fields[field] is not None:
            value = str(fields[field]).strip()
            if field == "title" and not value:
                raise ValueError("Title cannot be empty")
            setattr(job, field, value)

    if "expiryDate" in fields and fields["expiryDate"]:
        # Inline expiry date parsing
        try:
            job.expiryDate = datetime.strptime(fields["expiryDate"], "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("expiryDate must be YYYY-MM-DD")

    db.session.commit()


def closeJob(job_id: str, requester_id: str, is_admin: bool = False) -> None:
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    if not is_admin and job.alumniID != requester_id:
        raise PermissionError("Only the owner or admin can close this job")
    job.status = "closed"
    db.session.commit()


def listJobs(status: str = "open", limit: int = None, offset: int = 0, current_user=None) -> list:
    """List jobs. If `limit` is provided returns serialized jobs with applied/saved flags for alumni.
    Otherwise returns model objects.
    """
    if limit is None:
        return Job.query.filter_by(status=status).order_by(Job.postedDate.desc()).all()

    limit = min(max(int(limit or 200), 1), 500)
    offset = max(int(offset or 0), 0)
    query = Job.query.order_by(Job.postedDate.desc()).offset(offset).limit(limit)
    jobs = query.all()

    applied_map = {}
    saved_set = set()
    if current_user and getattr(current_user, "role", None) == "alumni":
        apps = JobApplication.query.filter_by(alumniID=current_user.userID).all()
        applied_map = {app.jobID: app.status for app in apps}
        saved_set = set(current_user.savedJobIDs or [])

    result = []
    for job in jobs:
        job_dict = job.to_dict()
        job_dict["testimonials"] = job.testimonials or []
        if current_user and getattr(current_user, "role", None) == "alumni":
            job_dict["applied"] = job.jobID in applied_map
            job_dict["applicationStatus"] = applied_map.get(job.jobID)
            job_dict["saved"] = job.jobID in saved_set
        result.append(job_dict)
    return result


def viewJobApplications(job_id: str, requester_id: str, is_admin: bool = False) -> list:
    job = db.session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    # Admin can view applications for any job; job owner can view their own job's applications
    if not is_admin and job.alumniID != requester_id:
        raise PermissionError("Only the owner or admin can view applications")

    apps = JobApplication.query.filter_by(jobID=job_id).order_by(JobApplication.applicationDate.desc()).all()
    return apps   # return model objects, views will call .to_dict()