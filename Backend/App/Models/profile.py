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
    
    def __init__(self, *args, **kwargs):
        # Call base constructor then set defaults without overwriting provided values
        super().__init__(*args, **kwargs)
        if getattr(self, 'contactInfo', None) is None:
            self.contactInfo = []
        if getattr(self, 'socialLinks', None) is None:
            self.socialLinks = []
        if getattr(self, 'profileVisibility', None) is None:
            self.profileVisibility = 'public'
        if getattr(self, 'showCurrentJob', None) is None:
            self.showCurrentJob = True
        if getattr(self, 'allowMessages', None) is None:
            self.allowMessages = True
        if getattr(self, 'showEmail', None) is None:
            self.showEmail = False

    def to_dict(self):
        return {
            "profileID": self.profileID,
            "alumniID": self.alumniID,
            "bio": self.bio,
            "profilePicture": self.profilePicture,
            "contactInfo": self.contactInfo or [],
            "socialLinks": self.socialLinks or [],
            "profileVisibility": self.profileVisibility,
            "showCurrentJob": self.showCurrentJob,
            "allowMessages": self.allowMessages,
            "showEmail": self.showEmail,
        }