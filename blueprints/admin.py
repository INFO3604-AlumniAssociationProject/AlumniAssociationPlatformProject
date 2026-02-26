from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from ..extensions import db
from ..decorators import admin_required
from ..models import AdminUser, SharedJob, SponsorRequest, AdminSettings, AlumniUser, Announcement

bp = Blueprint("admin", __name__, url_prefix="/admin")

@bp.get("/login")
def login():
    return render_template("admin/login.html")

@bp.post("/login")
def login_post():
    username = request.form.get("username","").strip()
    pw = request.form.get("password","")
    admin = AdminUser.query.filter_by(username=username).first()
    if not admin or not admin.check_password(pw) or not admin.is_active:
        flash("Invalid admin credentials.", "error")
        return redirect(url_for("admin.login"))

    session["admin_id"] = admin.id
    nxt = request.args.get("next")
    return redirect(nxt or url_for("admin.dashboard"))

@bp.get("/logout")
def logout():
    session.pop("admin_id", None)
    flash("Admin signed out.", "info")
    return redirect(url_for("feed.home"))

@bp.get("/")
@admin_required
def dashboard():
    pending_jobs = SharedJob.query.filter_by(status="pending").count()
    pending_sponsors = SponsorRequest.query.filter_by(status="pending").count()
    return render_template("admin/dashboard.html", pending_jobs=pending_jobs, pending_sponsors=pending_sponsors)

@bp.get("/approvals/jobs")
@admin_required
def approvals_jobs():
    jobs = SharedJob.query.filter_by(status="pending").order_by(SharedJob.created_at.desc()).all()
    return render_template("admin/approvals_jobs.html", jobs=jobs)

@bp.post("/approvals/jobs/<int:job_id>/approve")
@admin_required
def approve_job(job_id: int):
    job = SharedJob.query.get_or_404(job_id)
    job.status = "approved"
    job.reviewed_by_admin_id = session["admin_id"]
    job.reviewed_at = datetime.utcnow()
    db.session.commit()
    flash("Job approved and is now live.", "success")
    return redirect(url_for("admin.approvals_jobs"))

@bp.post("/approvals/jobs/<int:job_id>/reject")
@admin_required
def reject_job(job_id: int):
    job = SharedJob.query.get_or_404(job_id)
    job.status = "rejected"
    job.reviewed_by_admin_id = session["admin_id"]
    job.reviewed_at = datetime.utcnow()
    db.session.commit()
    flash("Job rejected.", "info")
    return redirect(url_for("admin.approvals_jobs"))

@bp.get("/approvals/sponsorships")
@admin_required
def approvals_sponsors():
    reqs = SponsorRequest.query.filter_by(status="pending").order_by(SponsorRequest.created_at.desc()).all()
    return render_template("admin/approvals_sponsors.html", reqs=reqs)

@bp.post("/approvals/sponsorships/<int:req_id>/approve")
@admin_required
def approve_sponsorship(req_id: int):
    s = AdminSettings.query.first() or AdminSettings()
    if not s.id:
        db.session.add(s)
        db.session.commit()

    req = SponsorRequest.query.get_or_404(req_id)
    req.status = "approved"
    req.approved_by_admin_id = session["admin_id"]
    req.approved_at = datetime.utcnow()
    req.expires_at = datetime.utcnow() + timedelta(days=s.sponsorship_expiry_days)
    db.session.commit()
    flash("Sponsorship approved and active until expiry.", "success")
    return redirect(url_for("admin.approvals_sponsors"))

@bp.post("/approvals/sponsorships/<int:req_id>/reject")
@admin_required
def reject_sponsorship(req_id: int):
    req = SponsorRequest.query.get_or_404(req_id)
    req.status = "rejected"
    req.approved_by_admin_id = session["admin_id"]
    req.approved_at = datetime.utcnow()
    db.session.commit()
    flash("Sponsorship rejected.", "info")
    return redirect(url_for("admin.approvals_sponsors"))

@bp.get("/settings")
@admin_required
def settings():
    s = AdminSettings.query.first()
    if not s:
        s = AdminSettings()
        db.session.add(s)
        db.session.commit()
    return render_template("admin/settings.html", s=s)

@bp.post("/settings")
@admin_required
def settings_post():
    s = AdminSettings.query.first() or AdminSettings()
    if not s.id:
        db.session.add(s)

    s.sponsored_per_page = int(request.form.get("sponsored_per_page", s.sponsored_per_page))
    s.sponsorship_expiry_days = int(request.form.get("sponsorship_expiry_days", s.sponsorship_expiry_days))
    s.priority_fee_cents = int(float(request.form.get("priority_fee", "50")) * 100)
    s.weight_trending = int(request.form.get("weight_trending", s.weight_trending))
    s.weight_similarity = int(request.form.get("weight_similarity", s.weight_similarity))
    s.suggestions_per_page = int(request.form.get("suggestions_per_page", s.suggestions_per_page))

    db.session.commit()
    flash("Settings updated.", "success")
    return redirect(url_for("admin.settings"))