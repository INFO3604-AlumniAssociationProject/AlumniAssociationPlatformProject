from App.database import db
from App.Models import User, Event, Job, Message


def approveUser(user_id: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")
    if user.role != "alumni":
        raise ValueError("Only alumni accounts require approval")
    user.isApproved = True
    db.session.commit()


def moderateContent(content_type: str, content_id: str, action: str) -> None:
    model_map = {"job": Job, "event": Event, "message": Message}
    model = model_map.get(content_type)
    if not model:
        raise ValueError("type must be one of: job, event, message")
    
    record = db.session.get(model, content_id)
    if not record:
        raise ValueError(f"{content_type} {content_id} not found")
    
    status_map = {"approve": "approved", "hide": "hidden", "reject": "rejected"}
    if action not in status_map:
        raise ValueError("action must be approve, hide, or reject")
    
    if hasattr(record, "status"):
        record.status = status_map[action]
    db.session.commit()


def generateReport() -> dict:
    return {
        "users": {
            "total": User.query.count(),
            "pendingApproval": User.query.filter_by(role="alumni", isApproved=False).count(),
            "alumni": User.query.filter_by(role="alumni").count(),
            "admins": User.query.filter_by(role="admin").count(),
        },
        "events": {
            "total": Event.query.count(),
            "active": Event.query.filter_by(status="active").count(),
            "cancelled": Event.query.filter_by(status="cancelled").count(),
        },
        "jobs": {
            "total": Job.query.count(),
            "open": Job.query.filter_by(status="open").count(),
            "closed": Job.query.filter_by(status="closed").count(),
        },
        "messages": {
            "total": Message.query.count(),
            "requested": Message.query.filter_by(status="requested").count(),
        },
    }


def manageEvent(event_id: str, action: str) -> None:
    event = db.session.get(Event, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    if action == "cancel":
        event.status = "cancelled"
    elif action == "reopen":
        event.status = "active"
    else:
        raise ValueError("action must be cancel or reopen")
    db.session.commit()


def sendAnnouncement(admin_id: str, content: str) -> int:
    if not content.strip():
        raise ValueError("content is required")
    recipients = User.query.filter_by(role="alumni", isApproved=True).all()
    count = 0
    for recipient in recipients:
        message = Message(
            senderID=admin_id,
            receiverID=recipient.userID,
            content=content.strip(),
            status="sent",
            attachments=[]
        )
        db.session.add(message)
        count += 1
    db.session.commit()
    return count