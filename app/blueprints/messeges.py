from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort
from flask_login import current_user
from ..extensions import db
from ..decorators import alumni_required
from ..models import AlumniUser

bp = Blueprint("messages", __name__, url_prefix="/messages")

from ..models import MessageRequest, Thread, ThreadParticipant, Message

def get_or_create_dm_thread(user_a: int, user_b: int) -> Thread:
  
    thread = (Thread.query
              .filter(Thread.thread_type == "dm")
              .join(ThreadParticipant, ThreadParticipant.thread_id == Thread.id)
              .filter(ThreadParticipant.user_id.in_([user_a, user_b]))
              .group_by(Thread.id)
              .having(db.func.count(ThreadParticipant.id) == 2)
              .first())
    if thread:
        return thread
    thread = Thread(thread_type="dm", created_at=datetime.utcnow())
    db.session.add(thread)
    db.session.commit()
    db.session.add(ThreadParticipant(thread_id=thread.id, user_id=user_a))
    db.session.add(ThreadParticipant(thread_id=thread.id, user_id=user_b))
    db.session.commit()
    return thread

@bp.get("/")
@alumni_required
def inbox():
    threads = (Thread.query
               .join(ThreadParticipant, ThreadParticipant.thread_id == Thread.id)
               .filter(ThreadParticipant.user_id == current_user.id)
               .order_by(Thread.updated_at.desc())
               .all())
    return render_template("messages/inbox.html", threads=threads)

@bp.get("/requests")
@alumni_required
def requests_page():
    incoming = MessageRequest.query.filter_by(to_user_id=current_user.id, status="pending").all()
    return render_template("messages/requests.html", incoming=incoming)

@bp.post("/request/<int:to_user_id>")
@alumni_required
def send_request(to_user_id: int):
    if to_user_id == current_user.id:
        abort(400)
    u = AlumniUser.query.get_or_404(to_user_id)

    existing = MessageRequest.query.filter_by(from_user_id=current_user.id, to_user_id=u.id, status="pending").first()
    if existing:
        flash("Request already sent.", "info")
        return redirect(url_for("profile.view", user_id=u.id))

    mr = MessageRequest(from_user_id=current_user.id, to_user_id=u.id, status="pending", created_at=datetime.utcnow())
    db.session.add(mr)
    db.session.commit()
    flash("Message request sent.", "success")
    return redirect(url_for("profile.view", user_id=u.id))

@bp.post("/requests/<int:req_id>/accept")
@alumni_required
def accept_request(req_id: int):
    mr = MessageRequest.query.get_or_404(req_id)
    if mr.to_user_id != current_user.id:
        abort(403)
    mr.status = "accepted"
    db.session.commit()

    thread = get_or_create_dm_thread(mr.from_user_id, mr.to_user_id)
    flash("Request accepted. Chat is open.", "success")
    return redirect(url_for("messages.thread", thread_id=thread.id))

@bp.post("/requests/<int:req_id>/reject")
@alumni_required
def reject_request(req_id: int):
    mr = MessageRequest.query.get_or_404(req_id)
    if mr.to_user_id != current_user.id:
        abort(403)
    mr.status = "rejected"
    db.session.commit()
    flash("Request rejected.", "info")
    return redirect(url_for("messages.requests_page"))

@bp.get("/t/<int:thread_id>")
@alumni_required
def thread(thread_id: int):
    t = Thread.query.get_or_404(thread_id)
    is_participant = ThreadParticipant.query.filter_by(thread_id=t.id, user_id=current_user.id).first()
    if not is_participant:
        abort(403)

    msgs = Message.query.filter_by(thread_id=t.id).order_by(Message.created_at.asc()).all()
    return render_template("messages/thread.html", thread=t, msgs=msgs)

@bp.post("/t/<int:thread_id>/send")
@alumni_required
def send_message(thread_id: int):
    t = Thread.query.get_or_404(thread_id)
    is_participant = ThreadParticipant.query.filter_by(thread_id=t.id, user_id=current_user.id).first()
    if not is_participant:
        abort(403)

    body = request.form.get("body","").strip()
    if not body:
        return redirect(url_for("messages.thread", thread_id=t.id))

    m = Message(thread_id=t.id, sender_id=current_user.id, body=body, created_at=datetime.utcnow())
    t.updated_at = datetime.utcnow()
    db.session.add(m)
    db.session.commit()
    return redirect(url_for("messages.thread", thread_id=t.id))