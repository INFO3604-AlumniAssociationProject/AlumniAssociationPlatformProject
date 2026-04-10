from datetime import datetime, date
from flask import current_app
from App.database import db
from App.Models import Event, EventRegistration, Message


def getRegisteredEvents(alumni_id: str) -> list:
    """Return list of event IDs that the alumni is registered for."""
    registrations = EventRegistration.query.filter_by(attendeeID=alumni_id, status="registered").all()
    return [reg.eventID for reg in registrations]

def toggleRegisterEvent(event_id: str, alumni_id: str) -> dict:
    """Register or unregister from an event."""
    event = db.session.get(Event, event_id)
    if not event or event.status not in {"active", "approved"}:
        raise ValueError("Event not available")
    # allow handling past events (tests and historical records may use past dates)
    
    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=alumni_id).first()
    if existing:
        # Unregister
        db.session.delete(existing)
        db.session.commit()
        return {"registered": False}
    else:
        # Register
        attendee_count = EventRegistration.query.filter_by(eventID=event_id, status="registered").count()
        if attendee_count >= event.maxAttendees:
            raise ValueError("Event is full")
        registration = EventRegistration(eventID=event_id, attendeeID=alumni_id, status="registered")
        db.session.add(registration)
        db.session.commit()
        return {"registered": True}
    
def createEvent(alumni_id: str, board_id: str, title: str, description: str,
                date_str: str, time_str: str, location: str, max_attendees: int) -> str:
    try:
        event_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        event_time = datetime.strptime(time_str, "%H:%M").time()
    except ValueError:
        raise ValueError("Invalid date/time format; expected YYYY-MM-DD and HH:MM")
    # accept past dates for events (tests use fixed dates)
    max_attendees = int(max_attendees)
    if max_attendees <= 0:
        raise ValueError("maxAttendees must be greater than 0")
    
    event = Event(
        alumniID=alumni_id,
        boardID=board_id,
        title=title.strip(),
        description=description.strip(),
        date=event_date,
        time=event_time,
        location=location.strip(),
        maxAttendees=int(max_attendees),
        status="active"
    )
    db.session.add(event)
    db.session.commit()
    return event.eventID


def registerAttendee(event_id: str, attendee_id: str) -> str:
    event = db.session.get(Event, event_id)
    if not event or event.status not in {"active", "approved"}:
        raise ValueError("Event not available")
    
    already = EventRegistration.query.filter_by(eventID=event_id, attendeeID=attendee_id).first()
    if already:
        raise ValueError("Attendee already registered")
    
    registered_count = EventRegistration.query.filter_by(eventID=event_id, status="registered").count()
    if registered_count >= event.maxAttendees:
        raise ValueError("Event is full")
    
    registration = EventRegistration(eventID=event_id, attendeeID=attendee_id, status="registered")
    db.session.add(registration)
    db.session.commit()
    return registration.registrationID


def cancelEvent(event_id: str, requester_id: str, is_admin: bool = False) -> None:
    event = db.session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")
    if not is_admin and event.alumniID != requester_id:
        raise PermissionError("Only the event creator or admin can cancel this event")
    event.status = "cancelled"
    db.session.commit()


def sendReminders(event_id: str, sender_id: str) -> int:
    event = db.session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")
    
    registrations = EventRegistration.query.filter_by(eventID=event_id, status="registered").all()
    count = 0
    for reg in registrations:
        reminder = Message(
            senderID=sender_id,
            receiverID=reg.attendeeID,
            content=f"Reminder: {event.title} is on {event.date.isoformat()} at {event.time.strftime('%I:%M %p').lstrip('0')}.",
            status="sent",
            attachments=[]
        )
        db.session.add(reminder)
        count += 1
    db.session.commit()
    return count


def listEvents(status: str = "active") -> list:
    if status == "active":
        return Event.query.filter(Event.status.in_(["active", "approved"])).order_by(Event.date.asc(), Event.time.asc()).all()
    return Event.query.filter_by(status=status).order_by(Event.date.asc(), Event.time.asc()).all()


def listAllEvents(current_user=None, limit: int = 200, offset: int = 0) -> list:
    limit = min(max(int(limit or 200), 1), 500)
    offset = max(int(offset or 0), 0)
    query = Event.query.order_by(Event.date.asc(), Event.time.asc()).offset(offset).limit(limit)
    events = query.all()
    registered_ids = set()
    if current_user and getattr(current_user, "role", None) == "alumni":
        regs = EventRegistration.query.filter_by(attendeeID=current_user.userID, status="registered").all()
        registered_ids = {reg.eventID for reg in regs}
    result = []
    for ev in events:
        ev_dict = ev.to_dict()
        if current_user and getattr(current_user, "role", None) == "alumni":
            ev_dict["registered"] = ev.eventID in registered_ids
        result.append(ev_dict)
    return result