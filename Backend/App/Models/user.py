from datetime import datetime, timezone
from uuid import uuid4
from werkzeug.security import generate_password_hash, check_password_hash

from App.database import db

class User(db.Model):
    __tablename__ = "users"

    userID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    registrationDate = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    role = db.Column(db.String(20), nullable=False, default="alumni")
    isApproved = db.Column(db.Boolean, nullable=False, default=False)
    notificationPreferences = db.Column(db.JSON, nullable=False, default=dict)
    savedJobIDs = db.Column(db.JSON, nullable=False, default=list)
    blockedUserIDs = db.Column(db.JSON, nullable=False, default=list)

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

    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": "user",
    }

    def __init__(self, *args, **kwargs):
        # Call base constructor first, then ensure instance attributes have sensible defaults
        super().__init__(*args, **kwargs)
        from datetime import datetime, timezone as _tz
        if getattr(self, 'registrationDate', None) is None:
            self.registrationDate = datetime.now(_tz.utc)
        if getattr(self, 'notificationPreferences', None) is None:
            self.notificationPreferences = {}
        if getattr(self, 'savedJobIDs', None) is None:
            self.savedJobIDs = []
        if getattr(self, 'blockedUserIDs', None) is None:
            self.blockedUserIDs = []
        if getattr(self, 'isApproved', None) is None:
            # Auto-approve admin accounts by default; others remain unapproved
            if hasattr(self.__class__, 'adminID') or getattr(self, 'role', None) == 'admin':
                self.isApproved = True
            else:
                self.isApproved = False

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.email}>"
    
    def to_dict(self):
        return {
            "userID": self.userID,
            "email": self.email,
            "name": self.name,
            "registrationDate": self.registrationDate.isoformat(),
            "role": self.role,
            "isApproved": self.isApproved,
            "notificationPreferences": self.notificationPreferences,
            "savedJobIDs": self.savedJobIDs or [],
            "blockedUserIDs": self.blockedUserIDs or [],
        }

