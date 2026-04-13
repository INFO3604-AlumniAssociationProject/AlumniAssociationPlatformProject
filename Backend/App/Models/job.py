from ..database import db
from datetime import date
from uuid import uuid4

class Job(db.Model):
    __tablename__ = "jobs"

    jobID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    boardID = db.Column(db.String(36), db.ForeignKey("community_boards.boardID"), nullable=False)
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    adminID = db.Column(db.String(36), db.ForeignKey("admin.adminID"), nullable=True)
    title = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(120), nullable=False)
    jobType = db.Column(db.String(50), nullable=False, default="Full-time")
    description = db.Column(db.Text, nullable=False)
    salaryRange = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    postedDate = db.Column(db.Date, nullable=False, default=date.today)
    expiryDate = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="open")
    testimonials = db.Column(db.JSON, nullable=True)

    board = db.relationship("CommunityBoard", back_populates="jobs")
    poster = db.relationship("Alumni", back_populates="jobs")
    approver = db.relationship("Admin", back_populates="approvedJobs")
    applications = db.relationship("JobApplication", back_populates="job", lazy="dynamic")

    def __init__(self, *args, **kwargs):
        # Call base constructor then set defaults without overwriting provided values
        super().__init__(*args, **kwargs)
        from datetime import date as _date
        if getattr(self, 'postedDate', None) is None:
            self.postedDate = _date.today()
        if getattr(self, 'status', None) is None:
            self.status = 'open'
        if getattr(self, 'testimonials', None) is None:
            self.testimonials = []

    def __repr__(self):
        return f'<Job {self.title} at {self.company}>'
    
    def to_dict(self):
        return {
            "jobID": self.jobID,
            "boardID": self.boardID,
            "alumniID": self.alumniID,
            "posterName": self.poster.name if self.poster else None,
            "adminID": self.adminID,
            "title": self.title,
            "company": self.company,
            "jobType": self.jobType,
            "description": self.description,
            "salaryRange": self.salaryRange,
            "location": self.location,
            "postedDate": self.postedDate.isoformat(),
            "expiryDate": self.expiryDate.isoformat(),
            "status": self.status,
            "testimonials": self.testimonials or [],
        }
