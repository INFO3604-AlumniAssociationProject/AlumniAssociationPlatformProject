from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import eventRegistrationControllers
from App.utils import _payload
from App.Controllers.userController import currentUser


event_registration_bp = Blueprint("event_registrations", __name__, url_prefix="/registrations")


@event_registration_bp.route("", methods=["POST"])
@jwt_required()
def registerForEvent():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    event_id = data.get("eventID")
    if not event_id:
        return jsonify({"error": "eventID is required"}), 400
    payment_status = data.get("paymentStatus", "pending")
    try:
        reg_id = eventRegistrationControllers.registerForEvent(event_id, user.userID, payment_status)
        return jsonify({"message": "Registration complete", "registrationID": reg_id}), 201
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        if "already" in msg or "exists" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@event_registration_bp.route("/<registration_id>/cancel", methods=["POST"])
@jwt_required()
def cancelRegistration(registration_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    is_admin = (user.role == "admin")
    try:
        eventRegistrationControllers.cancelRegistration(registration_id, user.userID, is_admin)
        return jsonify({"message": "Registration cancelled", "registrationID": registration_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@event_registration_bp.route("/<registration_id>/check-in", methods=["POST"])
@jwt_required()
def checkIn(registration_id):
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    try:
        eventRegistrationControllers.checkIn(registration_id)
        return jsonify({"message": "Attendee checked in", "registrationID": registration_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400