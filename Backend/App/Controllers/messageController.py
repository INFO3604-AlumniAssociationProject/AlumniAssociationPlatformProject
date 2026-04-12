from App.database import db
from App.Models import Message, User


def requestMessage(sender_id: str, receiver_id: str, content: str = None) -> str:
    if not receiver_id:
        raise ValueError("receiverID is required")
    receiver = db.session.get(User, receiver_id)
    if receiver and sender_id in (receiver.blockedUserIDs or []):
        raise PermissionError("You are blocked by this user")
    msg = Message(
        senderID=sender_id,
        receiverID=receiver_id,
        content=content or "I'd like to message you.",
        status="requested",
        attachments=[]
    )
    db.session.add(msg)
    db.session.commit()
    return msg.messageID


def acceptMessageRequest(message_id: str, receiver_id: str) -> None:
    msg = db.session.get(Message, message_id)
    if not msg:
        raise ValueError("Message not found")
    if msg.receiverID != receiver_id:
        raise PermissionError("Only receiver can accept this request")
    msg.status = "accepted"
    db.session.commit()


def rejectMessageRequest(message_id: str, receiver_id: str) -> None:
    msg = db.session.get(Message, message_id)
    if not msg:
        raise ValueError("Message not found")
    if msg.receiverID != receiver_id:
        raise PermissionError("Only receiver can reject this request")
    msg.status = "rejected"
    db.session.commit()


def sendMessage(sender_id: str, receiver_id: str, content: str) -> str:
    if not receiver_id or not content:
        raise ValueError("receiverID and content are required")
    receiver = db.session.get(User, receiver_id)
    if receiver and sender_id in (receiver.blockedUserIDs or []):
        raise PermissionError("You are blocked by this user")
    sender = db.session.get(User, sender_id)
    if sender and receiver_id in (sender.blockedUserIDs or []):
        raise PermissionError("You blocked this user")
    msg = Message(
        senderID=sender_id,
        receiverID=receiver_id,
        content=content.strip(),
        status="sent",
        attachments=[]
    )
    db.session.add(msg)
    db.session.commit()
    return msg.messageID


def getInbox(user_id: str) -> list:
    return Message.query.filter_by(receiverID=user_id).order_by(Message.timestamp.desc()).limit(50).all()


def getSent(user_id: str) -> list:
    return Message.query.filter_by(senderID=user_id).order_by(Message.timestamp.desc()).limit(50).all()


def getMessageRequests(user_id: str) -> list:
    """Return pending message requests for the user."""
    return Message.query.filter_by(receiverID=user_id, status="requested").order_by(Message.timestamp.desc()).all()


def blockUser(user_id: str, block_user_id: str) -> list:
    """Block another user; returns updated blocked list."""
    if user_id == block_user_id:
        raise ValueError("Cannot block self")
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    blocked = set(user.blockedUserIDs or [])
    if block_user_id in blocked:
        blocked.remove(block_user_id)
    else:
        blocked.add(block_user_id)
    user.blockedUserIDs = list(blocked)
    db.session.commit()
    return user.blockedUserIDs