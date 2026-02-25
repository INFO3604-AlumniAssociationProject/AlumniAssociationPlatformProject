from App.database import db
from App.Models.user import User

class Admin(User):
    __tablename__ = "admin"

    adminID = db.Column(db.String(36), db.ForeignKey("users.userID"), primary_key=True)
    adminLevel = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    approvedJobs = db.relationship("Job", back_populates="approver", lazy="dynamic")

    __mapper_args__ = {"polymorphic_identity": "admin"}

    def __repr__(self):
        return f'<Admin {self.email} - Level: {self.adminLevel}>'
    
