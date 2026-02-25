from datetime import datetime

from flask import jsonify, render_template, request

from App.Models import Event, EventRegistration, Message
from App.database import db


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _event_dict(event):
    return {
        "eventID": event.eventID,
        "title": event.title,
        "description": event.description,
        "date": event.date.isoformat(),
        "time": event.time.isoformat(),
        "location": event.location,
        "maxAttendees": event.maxAttendees,
        "status": event.status,
        "boardID": event.boardID,
    }


def list_events_page():
    events = Event.query.order_by(Event.date.asc(), Event.time.asc()).all()
    return render_template("events.html", events=events)


def createEvent():
    from flask import g

    data = _payload()
    required = ["title", "description", "date", "time", "location", "maxAttendees", "boardID"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        event_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        event_time = datetime.strptime(data["time"], "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid date/time format; expected YYYY-MM-DD and HH:MM"}), 400

    event = Event(
        alumniID=g.current_user.userID,
        boardID=data["boardID"],
        title=data["title"].strip(),
        description=data["description"].strip(),
        date=event_date,
        time=event_time,
        location=data["location"].strip(),
        maxAttendees=int(data["maxAttendees"]),
        status="active",
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({"message": "Event created", "event": _event_dict(event)}), 201


def registerAttendee(event_id):
    data = _payload()
    attendee_id = (data.get("attendeeID") or "").strip()
    if not attendee_id:
        return jsonify({"error": "attendeeID is required"}), 400

    event = db.session.get(Event, event_id)
    if not event or event.status != "active":
        return jsonify({"error": "Event not available"}), 404

    already_registered = EventRegistration.query.filter_by(
        eventID=event_id, attendeeID=attendee_id
    ).first()
    if already_registered:
        return jsonify({"message": "Attendee already registered"}), 200

    if EventRegistration.query.filter_by(eventID=event_id, status="registered").count() >= event.maxAttendees:
        return jsonify({"error": "Event is full"}), 409

    registration = EventRegistration(eventID=event_id, attendeeID=attendee_id, status="registered")
    db.session.add(registration)
    db.session.commit()
    return jsonify({"message": "Attendee registered", "registrationID": registration.registrationID}), 201


def cancelEvent(event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    event.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Event cancelled", "eventID": event.eventID})


def sendReminders(event_id):
    from flask import g

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    registrations = EventRegistration.query.filter_by(eventID=event_id, status="registered").all()
    for registration in registrations:
        reminder = Message(
            senderID=g.current_user.userID,
            receiverID=registration.attendeeID,
            content=f"Reminder: {event.title} is on {event.date.isoformat()} at {event.time.strftime('%H:%M')}.",
            status="sent",
            attachments=[],
        )
        db.session.add(reminder)

    db.session.commit()
    return jsonify({"message": "Reminders sent", "count": len(registrations)})
