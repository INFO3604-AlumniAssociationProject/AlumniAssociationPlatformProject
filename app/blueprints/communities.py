from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort
from flask_login import current_user
from ..extensions import db
from ..decorators import alumni_required
from ..models import (
    Community, CommunityMembership,
    CommunityRole, RolePermission, RoleAssignment,
    CommunityPost, SponsorRequest,
    CommunityPosition, PositionApplication,
    SharedJob
)
from ..permissions import user_has_permission, PRESIDENT_ROLE_NAME, DEFAULT_PERMISSIONS
from ..services.payment_service import is_valid_card_16, is_valid_cvv, is_valid_expiry

bp = Blueprint("communities", __name__, url_prefix="/communities")

def ensure_president_setup(community: Community, user_id: int):
    """Create President role + default permissions + assign creator as President."""
    president = CommunityRole.query.filter_by(community_id=community.id, name=PRESIDENT_ROLE_NAME).first()
    if not president:
        president = CommunityRole(community_id=community.id, name=PRESIDENT_ROLE_NAME)
        db.session.add(president)
        db.session.commit()
    for key in DEFAULT_PERMISSIONS[PRESIDENT_ROLE_NAME]:
        if not RolePermission.query.filter_by(role_id=president.id, key=key).first():
            db.session.add(RolePermission(role_id=president.id, key=key))
    db.session.commit()

    if not RoleAssignment.query.filter_by(community_id=community.id, user_id=user_id).first():
        db.session.add(RoleAssignment(community_id=community.id, role_id=president.id, user_id=user_id))
        db.session.commit()

    m = CommunityMembership.query.filter_by(community_id=community.id, user_id=user_id).first()
    if not m:
        db.session.add(CommunityMembership(community_id=community.id, user_id=user_id, status="approved"))
    else:
        m.status = "approved"
    db.session.commit()

def is_member(user_id: int, community_id: int) -> bool:
    m = CommunityMembership.query.filter_by(community_id=community_id, user_id=user_id, status="approved").first()
    return m is not None

def require_perm(community_id: int, perm: str):
    if not current_user.is_authenticated:
        abort(401)
    if not user_has_permission(current_user.id, community_id, perm):
        abort(403)

@bp.get("/")
def list_communities():
    comms = Community.query.order_by(Community.created_at.desc()).all()
    return render_template("communities/list.html", comms=comms)

@bp.get("/<int:community_id>")
def view_community(community_id: int):
    c = Community.query.get_or_404(community_id)
    posts = (CommunityPost.query
             .filter_by(community_id=c.id)
             .order_by(CommunityPost.created_at.desc())
             .limit(25).all())
    positions = (CommunityPosition.query
                 .filter_by(community_id=c.id)
                 .order_by(CommunityPosition.created_at.desc())
                 .limit(25).all())
    shared_jobs = (SharedJob.query
                   .filter_by(community_id=c.id, status="approved")
                   .order_by(SharedJob.created_at.desc())
                   .limit(25).all())

    member = current_user.is_authenticated and is_member(current_user.id, c.id)

    return render_template(
        "communities/view.html",
        c=c, posts=posts, positions=positions, shared_jobs=shared_jobs, member=member
    )

@bp.get("/create")
@alumni_required
def create_community():
    return render_template("communities/create.html")

@bp.post("/create")
@alumni_required
def create_community_post():
    name = request.form.get("name","").strip()
    description = request.form.get("description","").strip()
    join_mode = request.form.get("join_mode","open")  # open / request

    if not name:
        flash("Community name required.", "error")
        return redirect(url_for("communities.create_community"))

    if Community.query.filter_by(name=name).first():
        flash("Community name already exists.", "error")
        return redirect(url_for("communities.create_community"))

    c = Community(
        name=name,
        description=description,
        created_by=current_user.id,
        join_requires_approval=(join_mode == "request"),
    )
    db.session.add(c)
    db.session.commit()

    ensure_president_setup(c, current_user.id)

    flash("Community created.", "success")
    return redirect(url_for("communities.view_community", community_id=c.id))
@bp.post("/<int:community_id>/join")
@alumni_required
def join_community(community_id: int):
    c = Community.query.get_or_404(community_id)

    m = CommunityMembership.query.filter_by(community_id=c.id, user_id=current_user.id).first()
    if m and m.status == "approved":
        flash("You are already a member.", "info")
        return redirect(url_for("communities.view_community", community_id=c.id))

    if c.join_requires_approval:
        if not m:
            db.session.add(CommunityMembership(community_id=c.id, user_id=current_user.id, status="pending"))
        else:
            m.status = "pending"
        db.session.commit()
        flash("Join request sent.", "success")
    else:
        if not m:
            db.session.add(CommunityMembership(community_id=c.id, user_id=current_user.id, status="approved"))
        else:
            m.status = "approved"
        db.session.commit()
        flash("Joined community.", "success")

    return redirect(url_for("communities.view_community", community_id=c.id))
@bp.get("/<int:community_id>/members/requests")
@alumni_required
def member_requests(community_id: int):
    require_perm(community_id, "manage_members")
    c = Community.query.get_or_404(community_id)
    pending = CommunityMembership.query.filter_by(community_id=c.id, status="pending").all()
    return render_template("communities/roles.html", c=c, pending=pending)

@bp.post("/<int:community_id>/members/<int:membership_id>/approve")
@alumni_required
def approve_member(community_id: int, membership_id: int):
    require_perm(community_id, "manage_members")
    m = CommunityMembership.query.get_or_404(membership_id)
    if m.community_id != community_id:
        abort(400)
    m.status = "approved"
    db.session.commit()
    flash("Member approved.", "success")
    return redirect(url_for("communities.member_requests", community_id=community_id))

@bp.post("/<int:community_id>/posts")
@alumni_required
def create_post(community_id: int):
    if not is_member(current_user.id, community_id):
        flash("Join the community to post.", "warning")
        return redirect(url_for("communities.view_community", community_id=community_id))

    body = request.form.get("body","").strip()
    if not body:
        flash("Post cannot be empty.", "error")
        return redirect(url_for("communities.view_community", community_id=community_id))

    p = CommunityPost(community_id=community_id, author_id=current_user.id, body=body)
    db.session.add(p)
    db.session.commit()
    flash("Posted.", "success")
    return redirect(url_for("communities.view_community", community_id=community_id))

@bp.post("/<int:community_id>/posts/<int:post_id>/sponsor")
@alumni_required
def request_sponsor(community_id: int, post_id: int):
    require_perm(community_id, "sponsor_post")

    tier = request.form.get("tier", "free")  # free/priority

    post = CommunityPost.query.get_or_404(post_id)
    if post.community_id != community_id:
        abort(400)

    req = SponsorRequest(
        post_id=post.id,
        community_id=community_id,
        requested_by=current_user.id,
        tier=tier,
        status="pending",
        paid_ok=(tier == "free")
    )
    db.session.add(req)
    db.session.commit()

    if tier == "priority":
        return redirect(url_for("communities.priority_payment", sponsor_request_id=req.id))

    flash("Sponsorship request submitted for admin approval.", "success")
    return redirect(url_for("communities.view_community", community_id=community_id))

@bp.get("/sponsor/<int:sponsor_request_id>/payment")
@alumni_required
def priority_payment(sponsor_request_id: int):
    req = SponsorRequest.query.get_or_404(sponsor_request_id)
    # Ensure requester owns it
    if req.requested_by != current_user.id:
        abort(403)
    return render_template("admin/payment_simulator.html", req=req)

@bp.post("/sponsor/<int:sponsor_request_id>/payment")
@alumni_required
def priority_payment_post(sponsor_request_id: int):
    req = SponsorRequest.query.get_or_404(sponsor_request_id)
    if req.requested_by != current_user.id:
        abort(403)

    card = request.form.get("card","")
    expiry = request.form.get("expiry","")
    cvv = request.form.get("cvv","")

    ok = is_valid_card_16(card) and is_valid_expiry(expiry) and is_valid_cvv(cvv)
    if not ok:
        flash("Payment failed. Please check card format.", "error")
        return redirect(url_for("communities.priority_payment", sponsor_request_id=req.id))

    req.paid_ok = True
    db.session.commit()
    flash("Payment successful. Sponsorship is pending admin approval.", "success")
    return redirect(url_for("communities.view_community", community_id=req.community_id))

@bp.get("/<int:community_id>/positions")
def positions_page(community_id: int):
    c = Community.query.get_or_404(community_id)
    positions = CommunityPosition.query.filter_by(community_id=c.id).order_by(CommunityPosition.created_at.desc()).all()
    return render_template("communities/positions.html", c=c, positions=positions)

@bp.post("/<int:community_id>/positions/create")
@alumni_required
def create_position(community_id: int):
    require_perm(community_id, "manage_positions")

    title = request.form.get("title","").strip()
    description = request.form.get("description","").strip()
    is_role_assignment = request.form.get("is_role_assignment") == "on"
    role_to_assign_id = request.form.get("role_to_assign_id") or None

    pos = CommunityPosition(
        community_id=community_id,
        title=title,
        description=description,
        is_role_assignment=is_role_assignment,
        role_to_assign_id=int(role_to_assign_id) if role_to_assign_id else None
    )
    db.session.add(pos)
    db.session.commit()

    flash("Position created.", "success")
    return redirect(url_for("communities.positions_page", community_id=community_id))

@bp.post("/positions/<int:position_id>/apply")
@alumni_required
def apply_position(position_id: int):
    pos = CommunityPosition.query.get_or_404(position_id)
    if not is_member(current_user.id, pos.community_id):
        flash("Join the community to apply.", "warning")
        return redirect(url_for("communities.view_community", community_id=pos.community_id))

    note = request.form.get("note","").strip()
    app = PositionApplication(position_id=pos.id, user_id=current_user.id, note=note, status="pending")
    db.session.add(app)
    db.session.commit()
    flash("Application submitted.", "success")
    return redirect(url_for("communities.positions_page", community_id=pos.community_id))

@bp.post("/positions/<int:position_id>/applications/<int:app_id>/accept")
@alumni_required
def accept_application(position_id: int, app_id: int):
    pos = CommunityPosition.query.get_or_404(position_id)
    require_perm(pos.community_id, "manage_positions")

    app = PositionApplication.query.get_or_404(app_id)
    if app.position_id != pos.id:
        abort(400)

    app.status = "accepted"
    
    if pos.is_role_assignment and pos.role_to_assign_id:
        existing = RoleAssignment.query.filter_by(community_id=pos.community_id, user_id=app.user_id).first()
        if not existing:
            db.session.add(RoleAssignment(community_id=pos.community_id, role_id=pos.role_to_assign_id, user_id=app.user_id))
    db.session.commit()

    flash("Application accepted.", "success")
    return redirect(url_for("communities.positions_page", community_id=pos.community_id))


@bp.get("/<int:community_id>/shared-jobs")
def shared_jobs_page(community_id: int):
    c = Community.query.get_or_404(community_id)
    jobs = SharedJob.query.filter_by(community_id=c.id, status="approved").order_by(SharedJob.created_at.desc()).all()
    return render_template("communities/shared_jobs.html", c=c, jobs=jobs)

@bp.post("/<int:community_id>/shared-jobs/create")
@alumni_required
def create_shared_job(community_id: int):
    require_perm(community_id, "manage_shared_jobs")

    company = request.form.get("company","").strip()
    title = request.form.get("title","").strip()
    location = request.form.get("location","").strip()
    link = request.form.get("link","").strip()
    description = request.form.get("description","").strip()

    job = SharedJob(
        community_id=community_id,
        posted_by=current_user.id,
        company=company,
        title=title,
        location=location,
        link=link,
        description=description,
        status="pending",
    )
    db.session.add(job)
    db.session.commit()

    flash("Job submitted for admin approval.", "success")
    return redirect(url_for("communities.view_community", community_id=community_id))