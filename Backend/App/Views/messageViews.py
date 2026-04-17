from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import messageController
from App.utils import _payload
from App.Controllers.userController import currentUser


message_bp = Blueprint("messages", __name__, url_prefix="/messages")


@message_bp.route("/inbox", methods=["GET"])
@jwt_required()
def inbox():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    messages = [m.to_dict() for m in messageController.showInbox(user.userID)]
    return jsonify({"messages": messages}), 200


@message_bp.route("/sent", methods=["GET"])
@jwt_required()
def sent():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    messages = [m.to_dict() for m in messageController.showSentMessages(user.userID)]
    return jsonify({"messages": messages}), 200


@message_bp.route("/requests", methods=["GET"])
@jwt_required()
def messageRequests():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    messages = [m.to_dict() for m in messageController.showMessageRequests(user.userID)]
    return jsonify({"messages": messages}), 200


@message_bp.route("/request", methods=["POST"])
@jwt_required()
def requestMessage():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    data = _payload()
    receiver_id = data.get("receiverID")
    content = data.get("content")
    if not receiver_id:
        return jsonify({"error": "receiverID is required"}), 400
    try:
        msg_id = messageController.requestMessage(user.userID, receiver_id, content)
        return jsonify({"message": "Message request sent", "messageID": msg_id}), 201
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 403 if isinstance(e, PermissionError) else 400


@message_bp.route("/<message_id>/accept", methods=["POST"])
@jwt_required()
def acceptRequest(message_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    try:
        messageController.acceptMessageRequest(message_id, user.userID)
        return jsonify({"message": "Message request accepted", "messageID": message_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@message_bp.route("/<message_id>/reject", methods=["POST"])
@jwt_required()
def rejectRequest(message_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    try:
        messageController.rejectMessageRequest(message_id, user.userID)
        return jsonify({"message": "Message request rejected", "messageID": message_id}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@message_bp.route("", methods=["POST"])
@jwt_required()
def sendMessage():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    data = _payload()
    receiver_id = data.get("receiverID")
    content = data.get("content")
    if not receiver_id or not content:
        return jsonify({"error": "receiverID and content are required"}), 400
    try:
        msg_id = messageController.sendMessage(user.userID, receiver_id, content)
        return jsonify({"message": "Message sent", "messageID": msg_id}), 201
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 403 if isinstance(e, PermissionError) else 400


@message_bp.route("/block", methods=["POST"])
@jwt_required()
def blockUser():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    data = _payload()
    target = data.get("userID")
    if not target:
        return jsonify({"error": "userID is required"}), 400
    try:
        blocked = messageController.blockUser(user.userID, target)
        return jsonify({"blockedUserIDs": blocked}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400