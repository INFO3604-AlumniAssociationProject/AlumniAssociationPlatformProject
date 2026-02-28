from App.database import db
from datetime import datetime
from uuid import uuid4

class Message(db.Model):
    __tablename__ = "messages"

    messageID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    senderID = db.Column(db.String(36), db.ForeignKey("users.userID"), nullable=False)
    receiverID = db.Column(db.String(36), db.ForeignKey("users.userID"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default="requested")
    attachments = db.Column(db.JSON, nullable=False, default=list)

    sender = db.relationship("User", foreign_keys=[senderID], back_populates="sentMessages")
    receiver = db.relationship(
        "User", foreign_keys=[receiverID], back_populates="receivedMessages"
    )

    def __repr__(self):
        return f'<Message {self.messageID} from {self.senderID} to {self.receiverID}>'
