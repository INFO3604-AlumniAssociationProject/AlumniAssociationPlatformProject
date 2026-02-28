from App.database import db
from datetime import date
from uuid import uuid4

class EventRegistration(db.Model):
    __tablename__ = "event_registrations"

    registrationID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    eventID = db.Column(db.String(36), db.ForeignKey("events.eventID"), nullable=False)
    attendeeID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    registrationDate = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.String(50), nullable=False, default="registered")
    paymentStatus = db.Column(db.String(50), nullable=False, default="pending")
    checkedInAt = db.Column(db.DateTime, nullable=True)

    event = db.relationship("Event", back_populates="registrations")

    __table_args__ = (
        db.UniqueConstraint("eventID", "attendeeID", name="uq_event_attendee"),
    )

    def __repr__(self):
        return f'<EventRegistration {self.registrationID} for Event {self.eventID}>'
