from flask import g, jsonify, render_template, request

from App.Models import Message
from App.database import db


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _message_dict(message):
    return {
        "messageID": message.messageID,
        "senderID": message.senderID,
        "receiverID": message.receiverID,
        "content": message.content,
        "timestamp": message.timestamp.isoformat(),
        "status": message.status,
        "attachments": message.attachments or [],
    }


def inbox_page():
    inbox = (
        Message.query.filter_by(receiverID=g.current_user.userID)
        .order_by(Message.timestamp.desc())
        .limit(50)
        .all()
    )
    return render_template("messages.html", inbox=inbox)


def requestMessage():
    data = _payload()
    receiver_id = (data.get("receiverID") or "").strip()
    content = (data.get("content") or "I'd like to message you.").strip()
    if not receiver_id:
        return jsonify({"error": "receiverID is required"}), 400

    message = Message(
        senderID=g.current_user.userID,
        receiverID=receiver_id,
        content=content,
        status="requested",
        attachments=data.get("attachments") or [],
    )
    db.session.add(message)
    db.session.commit()
    return jsonify({"message": "Message request sent", "messageID": message.messageID}), 201


def acceptRequest(message_id):
    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({"error": "Message not found"}), 404
    if message.receiverID != g.current_user.userID:
        return jsonify({"error": "Only receiver can accept this request"}), 403

    message.status = "accepted"
    db.session.commit()
    return jsonify({"message": "Message request accepted", "messageID": message.messageID})


def rejectMessage(message_id):
    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({"error": "Message not found"}), 404
    if message.receiverID != g.current_user.userID:
        return jsonify({"error": "Only receiver can reject this request"}), 403

    message.status = "rejected"
    db.session.commit()
    return jsonify({"message": "Message request rejected", "messageID": message.messageID})


def sendMessage():
    data = _payload()
    receiver_id = (data.get("receiverID") or "").strip()
    content = (data.get("content") or "").strip()
    if not receiver_id or not content:
        return jsonify({"error": "receiverID and content are required"}), 400

    message = Message(
        senderID=g.current_user.userID,
        receiverID=receiver_id,
        content=content,
        status="sent",
        attachments=data.get("attachments") or [],
    )
    db.session.add(message)
    db.session.commit()
    return jsonify({"message": "Message sent", "data": _message_dict(message)}), 201
