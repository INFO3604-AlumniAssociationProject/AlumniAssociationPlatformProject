from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, abort
from flask_login import current_user
from ..extensions import db
from ..decorators import alumni_required
from ..models import AlumniUser, ConnectionRequest, Connection

bp = Blueprint("network", __name__, url_prefix="/network")

@bp.get("/directory")
def directory():
    users = AlumniUser.query.filter_by(show_in_directory=True).order_by(AlumniUser.created_at.desc()).limit(50).all()
    return render_template("network/directory.html", users=users)

@bp.post("/connect/<int:user_id>")
@alumni_required
def connect(user_id: int):
    if user_id == current_user.id:
        abort(400)
        
    if Connection.are_connected(current_user.id, user_id):
        flash("You are already connected.", "info")
        return redirect(url_for("profile.view", user_id=user_id))

    existing = ConnectionRequest.query.filter_by(from_user_id=current_user.id, to_user_id=user_id, status="pending").first()
    if existing:
        flash("Connection request already sent.", "info")
        return redirect(url_for("profile.view", user_id=user_id))

    db.session.add(ConnectionRequest(from_user_id=current_user.id, to_user_id=user_id, status="pending", created_at=datetime.utcnow()))
    db.session.commit()
    flash("Connection request sent.", "success")
    return redirect(url_for("profile.view", user_id=user_id))

@bp.get("/requests")
@alumni_required
def requests_page():
    incoming = ConnectionRequest.query.filter_by(to_user_id=current_user.id, status="pending").all()
    return render_template("network/requests.html", incoming=incoming)

@bp.post("/requests/<int:req_id>/accept")
@alumni_required
def accept(req_id: int):
    r = ConnectionRequest.query.get_or_404(req_id)
    if r.to_user_id != current_user.id:
        abort(403)
    r.status = "accepted"
    db.session.add(Connection(user_a=r.from_user_id, user_b=r.to_user_id, created_at=datetime.utcnow()))
    db.session.commit()
    flash("Connected.", "success")
    return redirect(url_for("network.directory"))

@bp.post("/requests/<int:req_id>/reject")
@alumni_required
def reject(req_id: int):
    r = ConnectionRequest.query.get_or_404(req_id)
    if r.to_user_id != current_user.id:
        abort(403)
    r.status = "rejected"
    db.session.commit()
    flash("Request rejected.", "info")
    return redirect(url_for("network.requests_page"))