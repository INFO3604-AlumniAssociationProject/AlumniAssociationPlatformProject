from ..database import db
from datetime import datetime, timezone
from uuid import uuid4

class JobApplication(db.Model):
    __tablename__ = "job_applications"

    applicationID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    jobID = db.Column(db.String(36), db.ForeignKey("jobs.jobID"), nullable=False)
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    applicationDate = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(50), nullable=False, default="pending")

    job = db.relationship("Job", back_populates="applications")
    applicant = db.relationship("Alumni", back_populates="applications")

    def __repr__(self):
        return f'<JobApplication {self.applicationID}>'
    
    def to_dict(self):
        return {
            "applicationID": self.applicationID,
            "jobID": self.jobID,
            "alumniID": self.alumniID,
            "applicationDate": self.applicationDate.isoformat(),
            "status": self.status
        }
