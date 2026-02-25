from App.database import db
from App.Models.user import User

class Alumni(User):
    __tablename__ = "alumni"

    alumniID = db.Column(db.String(36), db.ForeignKey("users.userID"), primary_key=True)
    graduationYear = db.Column(db.Integer, nullable=False)
    faculty = db.Column(db.String(120), nullable=False)
    degree = db.Column(db.String(120), nullable=False)
    currentJobTitle = db.Column(db.String(120), nullable=False, default="")
    company = db.Column(db.String(120), nullable=True)
    isPublicProfile = db.Column(db.Boolean, nullable=False, default=True)

    profile = db.relationship("Profile", back_populates="alumni", uselist=False)
    boards = db.relationship("CommunityBoard", back_populates="owner", lazy="dynamic")
    jobs = db.relationship("Job", back_populates="poster", lazy="dynamic")
    events = db.relationship("Event", back_populates="creator", lazy="dynamic")

    __mapper_args__ = {"polymorphic_identity": "alumni"}

    def __repr__(self):
        return f'<Alumni {self.email} - {self.graduationYear}>'
