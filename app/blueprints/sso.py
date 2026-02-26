from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user
from ..extensions import db
from ..models import AlumniUser

bp = Blueprint("sso", __name__, url_prefix="/auth/uwi")

def is_edu_email(email: str) -> bool:
    return email.lower().endswith(".edu")

@bp.get("/mock")
def mock_form():
    return render_template("sso/mock_login.html")

@bp.post("/mock")
def mock_login():
    email = request.form.get("email","").strip().lower()
    if not is_edu_email(email):
        flash("SSO requires a .edu email.", "error")
        return redirect(url_for("sso.mock_form"))

    user = AlumniUser.query.filter_by(email=email).first()
    if not user:
        user = AlumniUser(email=email, full_name="SSO User", is_verified=True)
        user.set_password("temporary-password-not-used")
        db.session.add(user)
        db.session.commit()

    login_user(user)
    flash("Signed in with UWI SSO (mock).", "success")
    return redirect(url_for("feed.home"))