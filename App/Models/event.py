from App.database import db
from uuid import uuid4

class Event(db.Model):
    __tablename__ = "events"

    eventID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    boardID = db.Column(db.String(36), db.ForeignKey("community_boards.boardID"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    maxAttendees = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="active")

    creator = db.relationship("Alumni", back_populates="events")
    board = db.relationship("CommunityBoard", back_populates="events")
    registrations = db.relationship(
        "EventRegistration", back_populates="event", lazy="dynamic"
    )

    def __repr__(self):
        return f'<Event {self.title} on {self.date}>'
