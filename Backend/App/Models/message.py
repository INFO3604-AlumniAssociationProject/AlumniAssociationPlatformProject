from App.database import db
from datetime import datetime, timezone
from uuid import uuid4

class Message(db.Model):
    __tablename__ = "messages"

    messageID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    senderID = db.Column(db.String(36), db.ForeignKey("users.userID"), nullable=False)
    receiverID = db.Column(db.String(36), db.ForeignKey("users.userID"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(50), nullable=False, default="requested")
    attachments = db.Column(db.JSON, nullable=False, default=list)

    sender = db.relationship("User", foreign_keys=[senderID], back_populates="sentMessages")
    receiver = db.relationship(
        "User", foreign_keys=[receiverID], back_populates="receivedMessages"
    )

    def __repr__(self):
        return f'<Message {self.messageID} from {self.senderID} to {self.receiverID}>'
    
    def to_dict(self):
        return {
            "messageID": self.messageID,
            "senderID": self.senderID,
            "senderName": self.sender.name if self.sender else self.senderID,
            "receiverID": self.receiverID,
            "receiverName": self.receiver.name if self.receiver else self.receiverID,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "status": self.status,
            "attachments": self.attachments or [],
        }
