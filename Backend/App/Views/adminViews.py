from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import adminControllers
from App.utils import _payload
from App.Controllers.userController import currentUser


admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/users/<user_id>/approve", methods=["POST"])
@jwt_required()
def approveUser(user_id):
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    try:
        adminControllers.approveUser(user_id)
        return jsonify({"message": "User approved", "userID": user_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@admin_bp.route("/moderate", methods=["POST"])
@jwt_required()
def moderateContent():
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = _payload()
    content_type = data.get("type")
    content_id = data.get("id")
    action = data.get("action")
    if not content_type or not content_id or not action:
        return jsonify({"error": "type, id, and action are required"}), 400
    try:
        adminControllers.moderateContent(content_type, content_id, action)
        return jsonify({"message": f"{content_type} {action}d", "id": content_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
def generateReport():
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    report = adminControllers.generateReport()
    return jsonify({"report": report}), 200


@admin_bp.route("/events/<event_id>/manage", methods=["POST"])
@jwt_required()
def manageEvent(event_id):
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = _payload()
    action = data.get("action")
    if not action:
        return jsonify({"error": "action is required (cancel or reopen)"}), 400
    try:
        adminControllers.manageEvent(event_id, action)
        return jsonify({"message": f"Event {action}ed", "eventID": event_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@admin_bp.route("/announcements", methods=["POST"])
@jwt_required()
def sendAnnouncement():
    user = currentUser()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = _payload()
    content = data.get("content")
    if not content:
        return jsonify({"error": "content is required"}), 400
    try:
        count = adminControllers.sendAnnouncement(user.userID, content)
        return jsonify({"message": "Announcement sent", "recipientCount": count}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400