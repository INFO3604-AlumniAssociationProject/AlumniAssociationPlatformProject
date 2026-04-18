# File: Backend/App/Controllers/eventRegistrationControllers.py

from datetime import datetime, timezone
from App.database import db
from App.Models import Event, EventRegistration, Message, User

def registerForEvent(event_id: str, attendee_id: str, payment_status: str = "pending") -> str:
    event = db.session.get(Event, event_id)
    if not event or event.status not in {"active", "approved"}:
        raise ValueError("Event not available")
    
    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=attendee_id).first()
    if existing:
        raise ValueError("Already registered")
    
    if EventRegistration.query.filter_by(eventID=event_id, status="registered").count() >= event.maxAttendees:
        raise ValueError("Event is full")
    
    registration = EventRegistration(
        eventID=event_id,
        attendeeID=attendee_id,
        status="registered",
        paymentStatus=payment_status
    )
    db.session.add(registration)
    db.session.commit()

    # Send confirmation message to attendee
    try:
        # Find a valid admin user to be the sender of system messages
        admin = User.query.filter_by(role="admin").first()
        sender_id = admin.userID if admin else None
        
        if sender_id:
            confirmation_msg = Message(
                senderID=sender_id,
                receiverID=attendee_id,
                content=f"You have successfully registered for the event '{event.title}'. We look forward to seeing you!",
                status="sent",
                attachments=[]
            )
            db.session.add(confirmation_msg)
            db.session.commit()
    except Exception:
        # Non‑critical; don't fail registration
        pass

    return registration.registrationID


def cancelRegistration(registration_id: str, requester_id: str, is_admin: bool = False) -> None:
    reg = db.session.get(EventRegistration, registration_id)
    if not reg:
        raise ValueError("Registration not found")
    if not is_admin and reg.attendeeID != requester_id:
        raise PermissionError("Only the attendee or admin can cancel this registration")
    reg.status = "cancelled"
    db.session.commit()


def checkIn(registration_id: str) -> None:
    reg = db.session.get(EventRegistration, registration_id)
    if not reg:
        raise ValueError("Registration not found")
    if reg.status != "registered":
        raise ValueError("Only registered attendees can check in")
    reg.status = "checked_in"
    reg.checkedInAt = datetime.now(timezone.utc)
    db.session.commit()