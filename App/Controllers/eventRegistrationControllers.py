from datetime import datetime

from flask import g, jsonify, request

from App.Models import Event, EventRegistration
from App.database import db


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def register():
    data = _payload()
    event_id = (data.get("eventID") or "").strip()
    attendee_id = (data.get("attendeeID") or g.current_user.userID).strip()

    event = db.session.get(Event, event_id)
    if not event or event.status != "active":
        return jsonify({"error": "Event not available"}), 404

    existing = EventRegistration.query.filter_by(eventID=event_id, attendeeID=attendee_id).first()
    if existing:
        return jsonify({"message": "Already registered", "registrationID": existing.registrationID})

    if EventRegistration.query.filter_by(eventID=event_id, status="registered").count() >= event.maxAttendees:
        return jsonify({"error": "Event is full"}), 409

    registration = EventRegistration(
        eventID=event_id,
        attendeeID=attendee_id,
        status="registered",
        paymentStatus=(data.get("paymentStatus") or "pending").strip().lower(),
    )
    db.session.add(registration)
    db.session.commit()
    return jsonify({"message": "Registration complete", "registrationID": registration.registrationID}), 201


def cancelRegistration(registration_id):
    registration = db.session.get(EventRegistration, registration_id)
    if not registration:
        return jsonify({"error": "Registration not found"}), 404

    registration.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Registration cancelled", "registrationID": registration.registrationID})


def checkIn(registration_id):
    registration = db.session.get(EventRegistration, registration_id)
    if not registration:
        return jsonify({"error": "Registration not found"}), 404
    if registration.status != "registered":
        return jsonify({"error": "Only registered attendees can check in"}), 400

    registration.status = "checked_in"
    registration.checkedInAt = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Attendee checked in", "registrationID": registration.registrationID})
