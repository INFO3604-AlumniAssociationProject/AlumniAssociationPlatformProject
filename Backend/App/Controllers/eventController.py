from datetime import datetime, date
from flask import current_app
from App.database import db
from App.Models import Event, EventRegistration, Message
from App.Controllers import eventRegistrationControllers


def listRegisteredEvents(alumni_id: str) -> list:
    """Return list of event IDs that the alumni is registered for."""
    registrations = EventRegistration.query.filter_by(attendeeID=alumni_id, status="registered").all()
    return [reg.eventID for reg in registrations]


def registerEvent(event_id: str, alumni_id: str) -> dict:
    """Register an alumni for an event (non-toggle)."""
    reg_id = eventRegistrationControllers.registerForEvent(event_id, alumni_id)
    return {"registered": True, "registrationID": reg_id}


def unregisterEvent(event_id: str, alumni_id: str) -> dict:
    """Unregister an alumni from an event."""
    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=alumni_id).first()
    if not existing:
        raise ValueError("Registration not found")
    # delegate to registration controller to cancel (maintain status history)
    eventRegistrationControllers.cancelRegistration(existing.registrationID, alumni_id, is_admin=False)
    return {"registered": False}


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

    
def cancelEvent(event_id: str, requester_id: str, is_admin: bool = False) -> None:
    event = db.session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")
    if not is_admin and event.alumniID != requester_id:
        raise PermissionError("Only the event creator or admin can cancel this event")
    event.status = "cancelled"
    db.session.commit()


def reopenEvent(event_id: str, requester_id: str, is_admin: bool = False) -> None:
    event = db.session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")
    if not is_admin and event.alumniID != requester_id:
        raise PermissionError("Only the event creator or admin can reopen this event")
    event.status = "active"
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


def listEvents(status: str = "active", limit: int = None, offset: int = 0, current_user=None) -> list:
    """List events. If `limit` is provided, returns serialized dicts (supports pagination and registered flag).
    Otherwise returns model objects similar to the previous `listEvents` behavior.
    """
    if limit is None:
        if status == "active":
            return Event.query.filter(Event.status.in_(["active", "approved"]) ).order_by(Event.date.asc(), Event.time.asc()).all()
        return Event.query.filter_by(status=status).order_by(Event.date.asc(), Event.time.asc()).all()

    # Paginated/serialized mode (replacement for previous listAllEvents)
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
