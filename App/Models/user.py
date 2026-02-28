from datetime import datetime
from uuid import uuid4

from App.database import db


class User(db.Model):
    __tablename__ = "users"

    userID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    registrationDate = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    role = db.Column(db.String(20), nullable=False, default="alumni")
    isApproved = db.Column(db.Boolean, nullable=False, default=False)
    notificationPreferences = db.Column(db.JSON, nullable=False, default=dict)

    sentMessages = db.relationship(
        "Message",
        foreign_keys="Message.senderID",
        back_populates="sender",
        lazy="dynamic",
    )
    receivedMessages = db.relationship(
        "Message",
        foreign_keys="Message.receiverID",
        back_populates="receiver",
        lazy="dynamic",
    )
    posts = db.relationship("BoardPost", back_populates="author", lazy="dynamic")

    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": "user",
    }

    def __repr__(self):
        return f"<User {self.email}>"
