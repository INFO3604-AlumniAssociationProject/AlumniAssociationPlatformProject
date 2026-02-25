from App.database import db
from uuid import uuid4

class Profile(db.Model):
    __tablename__ = "profiles"

    profileID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False, unique=True)
    bio = db.Column(db.Text, nullable=True)
    profilePicture = db.Column(db.String(255), nullable=True)
    contactInfo = db.Column(db.JSON, nullable=False, default=list)
    socialLinks = db.Column(db.JSON, nullable=False, default=list)
    profileVisibility = db.Column(db.String(50), nullable=False, default="public")
    showCurrentJob = db.Column(db.Boolean, nullable=False, default=True)
    allowMessages = db.Column(db.Boolean, nullable=False, default=True)
    showEmail = db.Column(db.Boolean, nullable=False, default=False)

    alumni = db.relationship("Alumni", back_populates="profile")

    def __repr__(self):
        return f'<Profile {self.profileID}>'
