from flask import Blueprint, jsonify, render_template, request

from App.Controllers.userControllers import role_required
from App.Models import Event, Job, Message, User
from App.database import db

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


@admin_bp.post("/users/<user_id>/approve")
@role_required("admin")
def approveUser(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.isApproved = True
    db.session.commit()
    return jsonify({"message": "User approved", "userID": user.userID})


@admin_bp.post("/moderate")
@role_required("admin")
def moderateContent():
    data = _payload()
    content_type = (data.get("type") or "").strip().lower()
    content_id = (data.get("id") or "").strip()
    action = (data.get("action") or "").strip().lower()

    model_map = {"job": Job, "event": Event, "message": Message}
    model = model_map.get(content_type)
    if not model:
        return jsonify({"error": "type must be one of: job, event, message"}), 400

    record = db.session.get(model, content_id)
    if not record:
        return jsonify({"error": "Content not found"}), 404

    status_map = {"approve": "approved", "hide": "hidden", "reject": "rejected"}
    if action not in status_map:
        return jsonify({"error": "action must be approve, hide, or reject"}), 400

    if hasattr(record, "status"):
        record.status = status_map[action]
    db.session.commit()
    return jsonify({"message": f"{content_type} {action}d", "id": content_id})


@admin_bp.get("/reports")
@role_required("admin")
def generateReport():
    report = {
        "users": {
            "total": User.query.count(),
            "pendingApproval": User.query.filter_by(role="alumni", isApproved=False).count(),
            "alumni": User.query.filter_by(role="alumni").count(),
            "admins": User.query.filter_by(role="admin").count(),
        },
        "jobs": {
            "total": Job.query.count(),
            "open": Job.query.filter_by(status="open").count(),
            "closed": Job.query.filter_by(status="closed").count(),
        },
        "events": {
            "total": Event.query.count(),
            "active": Event.query.filter_by(status="active").count(),
            "cancelled": Event.query.filter_by(status="cancelled").count(),
        },
        "messages": {
            "total": Message.query.count(),
            "requested": Message.query.filter_by(status="requested").count(),
        },
    }
    return jsonify({"report": report})


@admin_bp.post("/events/<event_id>/manage")
@role_required("admin")
def manageEvent(event_id):
    data = _payload()
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    action = (data.get("action") or "").strip().lower()
    if action == "cancel":
        event.status = "cancelled"
        result = "cancelled"
    elif action == "reopen":
        event.status = "active"
        result = "reopened"
    else:
        return jsonify({"error": "action must be cancel or reopen"}), 400

    db.session.commit()
    return jsonify({"message": f"Event {result}", "eventID": event.eventID, "status": event.status})


@admin_bp.post("/announcements")
@role_required("admin")
def sendAnnouncement():
    from flask import g

    data = _payload()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    recipients = User.query.filter(User.role == "alumni", User.isApproved.is_(True)).all()
    created = []
    for recipient in recipients:
        message = Message(
            senderID=g.current_user.userID,
            receiverID=recipient.userID,
            content=content,
            status="sent",
            attachments=[],
        )
        db.session.add(message)
        created.append(recipient.userID)

    db.session.commit()
    return jsonify({"message": "Announcement sent", "recipientCount": len(created)})


@admin_bp.get("/panel")
@role_required("admin")
def admin_panel():
    report = {
        "users": {
            "total": User.query.count(),
            "pendingApproval": User.query.filter_by(role="alumni", isApproved=False).count(),
        },
        "jobs": {
            "total": Job.query.count(),
            "open": Job.query.filter_by(status="open").count(),
        },
        "events": {
            "total": Event.query.count(),
            "active": Event.query.filter_by(status="active").count(),
        },
        "messages": {
            "total": Message.query.count(),
            "requested": Message.query.filter_by(status="requested").count(),
        },
    }
    return render_template("admin.html", report=report)
