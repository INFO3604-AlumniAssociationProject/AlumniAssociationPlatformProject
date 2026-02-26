import secrets
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user
from ..extensions import db
from ..models import AlumniUser, EmailVerificationToken
from ..services.email_service import send_verification_email

bp = Blueprint("auth", __name__, url_prefix="/auth")

def is_edu_email(email: str) -> bool:
    return email.lower().endswith(".edu")

@bp.get("/register")
def register():
    return render_template("auth/register.html")

@bp.post("/register")
def register_post():
    email = request.form.get("email","").strip().lower()
    pw = request.form.get("password","")
    name = request.form.get("full_name","").strip()
    faculty = request.form.get("faculty","").strip()
    grad_year = request.form.get("grad_year","").strip()

    if not is_edu_email(email):
        flash("Email must be a .edu address.", "error")
        return redirect(url_for("auth.register"))

    if AlumniUser.query.filter_by(email=email).first():
        flash("Account already exists. Please sign in.", "warning")
        return redirect(url_for("auth.login"))

    user = AlumniUser(email=email, full_name=name, faculty=faculty)
    if grad_year.isdigit():
        user.grad_year = int(grad_year)
    user.set_password(pw)
    user.is_verified = False

    db.session.add(user)
    db.session.commit()

    token = secrets.token_urlsafe(32)
    t = EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.session.add(t)
    db.session.commit()

    send_verification_email(email=email, token=token)
    flash("Check your email for a verification link.", "success")
    return redirect(url_for("auth.verify_notice"))

@bp.get("/verify-notice")
def verify_notice():
    return render_template("auth/verify_notice.html")

@bp.get("/verify/<token>")
def verify(token: str):
    t = EmailVerificationToken.query.filter_by(token=token).first()
    if not t or t.expires_at < datetime.utcnow():
        flash("Verification link expired or invalid.", "error")
        return redirect(url_for("auth.login"))

    user = AlumniUser.query.get(t.user_id)
    user.is_verified = True
    db.session.delete(t)
    db.session.commit()

    flash("Email verified. You can log in now.", "success")
    return redirect(url_for("auth.login"))

@bp.get("/login")
def login():
    return render_template("auth/login.html")

@bp.post("/login")
def login_post():
    email = request.form.get("email","").strip().lower()
    pw = request.form.get("password","")
    user = AlumniUser.query.filter_by(email=email).first()
    if not user or not user.check_password(pw):
        flash("Invalid credentials.", "error")
        return redirect(url_for("auth.login"))

    if user.is_banned or user.is_suspended():
        flash("Your account is restricted. Contact admin.", "error")
        return redirect(url_for("auth.login"))

    if not user.is_verified:
        flash("Please verify your email first.", "warning")
        return redirect(url_for("auth.verify_notice"))

    login_user(user)
    nxt = request.args.get("next")
    return redirect(nxt or url_for("feed.home"))

@bp.get("/logout")
def logout():
    logout_user()
    flash("Signed out.", "info")
    return redirect(url_for("feed.home"))