import os
from werkzeug.utils import secure_filename
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, abort
from flask_login import current_user
from ..decorators import alumni_required
from ..extensions import db
from ..models import AlumniUser

bp = Blueprint("profile", __name__, url_prefix="/profile")

@bp.get("/<int:user_id>")
def view(user_id: int):
    u = AlumniUser.query.get_or_404(user_id)
    return render_template("profile/view.html", u=u)

@bp.get("/me/edit")
@alumni_required
def edit():
    return render_template("profile/edit.html", u=current_user)

@bp.post("/me/edit")
@alumni_required
def edit_post():
    current_user.full_name = request.form.get("full_name","").strip()
    current_user.bio = request.form.get("bio","").strip()
    current_user.headline = request.form.get("headline","").strip()
    current_user.company = request.form.get("company","").strip()
    current_user.location = request.form.get("location","").strip()
    current_user.faculty = request.form.get("faculty","").strip()
    gy = request.form.get("grad_year","").strip()
    if gy.isdigit():
        current_user.grad_year = int(gy)

    db.session.commit()
    flash("Profile updated.", "success")
    return redirect(url_for("profile.view", user_id=current_user.id))

@bp.post("/me/resume")
@alumni_required
def upload_resume():
    f = request.files.get("resume")
    if not f:
        flash("No file selected.", "error")
        return redirect(url_for("profile.edit"))

    filename = secure_filename(f.filename)
    if not filename:
        flash("Invalid file name.", "error")
        return redirect(url_for("profile.edit"))

    dest_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "resumes")
    os.makedirs(dest_dir, exist_ok=True)
    path = os.path.join(dest_dir, f"{current_user.id}_{filename}")
    f.save(path)

    current_user.resume_path = f"uploads/resumes/{current_user.id}_{filename}"
    db.session.commit()
    flash("Resume uploaded.", "success")
    return redirect(url_for("profile.view", user_id=current_user.id))