from App.database import db
from App.Models import User, Event, Job, Message
from App.Controllers import eventController
from datetime import datetime, timezone, timedelta


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
    # delegate to eventController for consistent permission checks and behavior
    if action == "cancel":
        eventController.cancelEvent(event_id, requester_id=None, is_admin=True)
    elif action == "reopen":
        eventController.reopenEvent(event_id, requester_id=None, is_admin=True)
    else:
        raise ValueError("action must be cancel or reopen")


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

def suspendUser(user_id: str, reason: str, duration_days: int, admin_id: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    if user.role == "admin":
        raise ValueError("Cannot suspend admin users")
    
    user.isSuspended = True
    user.suspendedUntil = datetime.now(timezone.utc) + timedelta(days=duration_days)
    user.banReason = reason  # could also store suspension reason separately; reuse for now
    db.session.commit()

def unsuspendUser(user_id: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    user.isSuspended = False
    user.suspendedUntil = None
    db.session.commit()

def banUser(user_id: str, reason: str, admin_id: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    if user.role == "admin":
        raise ValueError("Cannot ban admin users")
    
    user.isSuspended = True  # permanent ban also uses suspended flag
    user.suspendedUntil = None  # permanent
    user.banReason = reason
    db.session.commit()

def unbanUser(user_id: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    user.isSuspended = False
    user.suspendedUntil = None
    user.banReason = None
    db.session.commit()