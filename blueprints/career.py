from flask import Blueprint, render_template
from ..models import SharedJob

bp = Blueprint("career", __name__, url_prefix="/career")

@bp.get("/")
def index():
    jobs = (SharedJob.query
            .filter_by(status="approved")
            .order_by(SharedJob.created_at.desc())
            .limit(50).all())
    return render_template("career/index.html", jobs=jobs)

@bp.get("/<int:job_id>")
def detail(job_id: int):
    job = SharedJob.query.get_or_404(job_id)

    if job.status != "approved":
        from flask import abort
        abort(404)
    return render_template("career/detail.html", job=job)