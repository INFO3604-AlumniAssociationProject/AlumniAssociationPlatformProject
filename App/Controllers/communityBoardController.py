from flask import Blueprint, g, jsonify, render_template, request

from App.Controllers.userControllers import login_required, role_required
from App.Models import BoardPost, CommunityBoard, Job
from App.database import db

community_board_bp = Blueprint("community_board", __name__, url_prefix="/boards")


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _job_dict(job):
    return {
        "jobID": job.jobID,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salaryRange": job.salaryRange,
        "status": job.status,
        "expiryDate": job.expiryDate.isoformat(),
    }


@community_board_bp.get("")
@login_required
def list_boards():
    boards = CommunityBoard.query.order_by(CommunityBoard.name.asc()).all()
    return jsonify(
        {
            "boards": [
                {"boardID": b.boardID, "name": b.name, "description": b.description}
                for b in boards
            ]
        }
    )


@community_board_bp.post("")
@role_required("alumni")
def create_board():
    data = _payload()
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    board = CommunityBoard(
        alumniID=g.current_user.userID,
        name=name,
        description=(data.get("description") or "").strip(),
    )
    db.session.add(board)
    db.session.commit()
    return jsonify({"message": "Board created", "boardID": board.boardID}), 201


@community_board_bp.get("/<board_id>")
@login_required
def board_page(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    posts = (
        BoardPost.query.filter_by(boardID=board_id, status="active")
        .order_by(BoardPost.createdAt.desc())
        .limit(20)
        .all()
    )
    jobs = Job.query.filter_by(boardID=board_id).order_by(Job.postedDate.desc()).limit(20).all()
    return render_template("community_board.html", board=board, posts=posts, jobs=jobs)


@community_board_bp.post("/<board_id>/posts")
@role_required("alumni", "admin")
def createPost(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    data = _payload()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    post = BoardPost(boardID=board_id, authorID=g.current_user.userID, content=content)
    db.session.add(post)
    db.session.commit()
    return jsonify({"message": "Post created", "postID": post.postID}), 201


@community_board_bp.get("/<board_id>/jobs")
@login_required
def listJobs(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    jobs = Job.query.filter_by(boardID=board_id).order_by(Job.postedDate.desc()).all()
    return jsonify({"jobs": [_job_dict(job) for job in jobs]})
