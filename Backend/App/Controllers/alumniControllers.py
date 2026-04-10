from App.database import db
from App.Models import Alumni, Event, EventRegistration, Job, JobApplication, Message


def connectToAlumni(requester_id: str, target_id: str, message_content: str = None) -> str:
    if requester_id == target_id:
        raise ValueError("Cannot connect to yourself")
    
    target = db.session.get(Alumni, target_id)
    if not target:
        raise ValueError("Target alumni not found")
    
    existing = Message.query.filter_by(
        senderID=requester_id,
        receiverID=target_id,
        status="requested"
    ).first()
    if existing:
        raise ValueError("Connection request already sent")
    
    msg = Message(
        senderID=requester_id,
        receiverID=target_id,
        content=message_content or "I'd like to connect with you.",
        status="requested",
        attachments=[]
    )
    db.session.add(msg)
    db.session.commit()
    return msg.messageID


def registerForEvent(alumni_id: str, event_id: str) -> str:
    event = db.session.get(Event, event_id)
    if not event or event.status not in {"active", "approved"}:
        raise ValueError("Event not available")
    
    attendee_count = EventRegistration.query.filter_by(eventID=event_id, status="registered").count()
    if attendee_count >= event.maxAttendees:
        raise ValueError("Event is full")
    
    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=alumni_id).first()
    if existing:
        raise ValueError("Already registered")
    
    registration = EventRegistration(eventID=event_id, attendeeID=alumni_id, status="registered")
    db.session.add(registration)
    db.session.commit()
    return registration.registrationID


def applyForJob(alumni_id: str, job_id: str) -> str:
    job = db.session.get(Job, job_id)
    if not job or job.status not in {"open", "approved"}:
        raise ValueError("Job not available")
    
    existing = JobApplication.query.filter_by(jobID=job_id, alumniID=alumni_id).first()
    if existing:
        if existing.status == "withdrawn":
            existing.status = "pending"
            db.session.commit()
            return existing.applicationID
        raise ValueError("You have already applied to this job")
    
    application = JobApplication(jobID=job_id, alumniID=alumni_id, status="pending")
    db.session.add(application)
    db.session.commit()
    return application.applicationID


def searchAlumni(query: str = None, faculty: str = None, graduation_year: int = None) -> list:
    q = Alumni.query.filter(Alumni.isPublicProfile.is_(True))
    if query:
        like = f"%{query}%"
        q = q.filter(Alumni.name.ilike(like) | Alumni.email.ilike(like))
    if faculty:
        q = q.filter(Alumni.faculty.ilike(f"%{faculty}%"))
    if graduation_year:
        q = q.filter(Alumni.graduationYear == graduation_year)
    
    results = []
    for a in q.order_by(Alumni.name.asc()).all():
        results.append({
            "alumniID": a.alumniID,
            "name": a.name,
            "email": a.email,
            "graduationYear": a.graduationYear,
            "faculty": a.faculty,
            "degree": a.degree,
            "currentJobTitle": a.currentJobTitle,
            "company": a.company,
            "location": a.location,
        })
    return results