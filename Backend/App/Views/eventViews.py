from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from App.Controllers import eventController, eventRegistrationControllers
from App.utils import _payload
from App.Controllers.userController import currentUser


event_bp = Blueprint("events", __name__, url_prefix="/events")


@event_bp.route("/list", methods=["GET"])
@jwt_required()
def listEventsApi():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    status = request.args.get("status", "active")
    limit = request.args.get("limit")
    offset = request.args.get("offset", 0)
    if limit:
        events = eventController.listEvents(status=status, limit=limit, offset=offset, current_user=user)
        return jsonify({"events": events}), 200
    events = eventController.listEvents(status)
    return jsonify({"events": [ev.to_dict() for ev in events]}), 200


@event_bp.route("/<event_id>", methods=["GET"])
@jwt_required()
def getEvent(event_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    event = next((record for record in eventController.listEvents(status="active", limit=500, offset=0, current_user=user) if str(record.get("eventID")) == str(event_id)), None)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(event), 200


@event_bp.route("", methods=["POST"])
@jwt_required()
def createEvent():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni or admin access required"}), 403
    data = _payload()
    required = ["title", "date", "time", "location", "maxAttendees", "boardID"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    try:
        event_id = eventController.createEvent(
            alumni_id=user.userID,
            board_id=data["boardID"],
            title=data["title"],
            description=data.get("description", ""),
            date_str=data["date"],
            time_str=data["time"],
            location=data["location"],
            max_attendees=data["maxAttendees"]
        )
        return jsonify({"message": "Event created", "eventID": event_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@event_bp.route("/<event_id>/register-attendee", methods=["POST"])
@jwt_required()
def registerAttendee(event_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    try:
        reg_id = eventRegistrationControllers.registerForEvent(event_id, user.userID)
        return jsonify({"message": "Attendee registered", "registrationID": reg_id}), 201
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        if "already" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@event_bp.route("/<event_id>/cancel", methods=["POST"])
@jwt_required()
def cancelEvent(event_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    is_admin = (user.role == "admin")
    try:
        eventController.cancelEvent(event_id, user.userID, is_admin)
        return jsonify({"message": "Event cancelled", "eventID": event_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404 if "not found" in str(e).lower() else 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@event_bp.route("/<event_id>/send-reminders", methods=["POST"])
@jwt_required()
def sendReminders(event_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    try:
        count = eventController.sendReminders(event_id, user.userID)
        return jsonify({"message": "Reminders sent", "count": count}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404 if "not found" in str(e).lower() else 400


@event_bp.route("/registrations/me", methods=["GET"])
@jwt_required()
def getRegisteredEvents():
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    event_ids = eventController.listRegisteredEvents(user.userID)
    return jsonify({"eventIDs": event_ids}), 200


@event_bp.route("/<event_id>/register", methods=["POST"])
@jwt_required()
def registerEvent(event_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        result = eventController.registerEvent(event_id, user.userID)
        return jsonify(result), 201
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@event_bp.route("/<event_id>/unregister", methods=["POST"])
@jwt_required()
def unregisterEvent(event_id):
    user = currentUser()
    if not user or user.role != "alumni":
        return jsonify({"error": "Alumni access required"}), 403
    try:
        result = eventController.unregisterEvent(event_id, user.userID)
        return jsonify(result), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
