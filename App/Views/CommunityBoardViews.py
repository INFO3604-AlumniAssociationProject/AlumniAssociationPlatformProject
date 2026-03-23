from datetime import datetime
from uuid import uuid4

from flask import Blueprint, g, jsonify, request

from .userController import login_required, role_required
from ..Models import Alumni, BoardPost, CommunityBoard, Event, Job
from ..database import db

community_board_bp = Blueprint("community_board", __name__, url_prefix="/boards")


def _payload():
    return request.get_json(silent=True) or request.form.to_dict(flat=True)


def _joined_board_ids(user):
    prefs = user.notificationPreferences or {}
    raw_ids = prefs.get("joinedBoards") or []
    return {str(board_id).strip() for board_id in raw_ids if str(board_id).strip()}


def _set_joined_board_ids(user, board_ids):
    prefs = dict(user.notificationPreferences or {})
    prefs["joinedBoards"] = sorted({str(board_id).strip() for board_id in board_ids if str(board_id).strip()})
    user.notificationPreferences = prefs


def _is_member(user, board):
    if not user or not board:
        return False
    if user.role == "admin":
        return True
    if board.alumniID == user.userID:
        return True
    return board.boardID in _joined_board_ids(user)


def _join_board(user, board):
    board_ids = _joined_board_ids(user)
    board_ids.add(board.boardID)
    _set_joined_board_ids(user, board_ids)


def _leave_board(user, board):
    board_ids = _joined_board_ids(user)
    if board.boardID in board_ids:
        board_ids.remove(board.boardID)
        _set_joined_board_ids(user, board_ids)


def _board_members(board):
    members = {}
    if board.owner:
        members[board.owner.alumniID] = {
            "userID": board.owner.alumniID,
            "name": board.owner.name,
            "email": board.owner.email,
            "role": board.owner.role,
            "avatar": f"https://ui-avatars.com/api/?name={board.owner.name.replace(' ', '+')}&background=0D8ABC&color=fff",
            "isAdmin": True,
        }

    for alumni in Alumni.query.order_by(Alumni.name.asc()).all():
        if board.boardID in _joined_board_ids(alumni):
            members[alumni.alumniID] = {
                "userID": alumni.alumniID,
                "name": alumni.name,
                "email": alumni.email,
                "role": alumni.role,
                "avatar": f"https://ui-avatars.com/api/?name={alumni.name.replace(' ', '+')}&background=random",
                "isAdmin": board.alumniID == alumni.alumniID,
            }

    return list(members.values())


def _post_dict(post, viewer=None):
    liked_by = [str(user_id) for user_id in (post.likedBy or [])]
    comments = []
    for comment in post.comments or []:
        comments.append(
            {
                "commentID": str(comment.get("commentID") or uuid4()),
                "authorID": str(comment.get("authorID") or ""),
                "authorName": comment.get("authorName") or "Unknown User",
                "content": comment.get("content") or "",
                "time": comment.get("time") or datetime.utcnow().isoformat(),
                "avatar": comment.get("avatar")
                or f"https://ui-avatars.com/api/?name={(comment.get('authorName') or 'User').replace(' ', '+')}&background=random",
            }
        )

    return {
        "postID": post.postID,
        "boardID": post.boardID,
        "alumniID": post.alumniID,
        "authorName": post.author.name if post.author else post.alumniID,
        "content": post.content,
        "postedDate": post.postedDate.isoformat(),
        "likesCount": int(post.likesCount or len(liked_by)),
        "likedBy": liked_by,
        "liked": bool(viewer and str(viewer.userID) in liked_by),
        "comments": comments,
        "commentsCount": len(comments),
    }


def _job_dict(job):
    return {
        "jobID": job.jobID,
        "boardID": job.boardID,
        "alumniID": job.alumniID,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salaryRange": job.salaryRange,
        "status": job.status,
        "postedDate": job.postedDate.isoformat(),
        "expiryDate": job.expiryDate.isoformat(),
    }


def _event_dict(event):
    return {
        "eventID": event.eventID,
        "boardID": event.boardID,
        "alumniID": event.alumniID,
        "title": event.title,
        "description": event.description,
        "date": event.date.isoformat(),
        "time": event.time.isoformat(),
        "location": event.location,
        "status": event.status,
    }


@community_board_bp.get("")
@login_required
def list_boards():
    boards = CommunityBoard.query.order_by(CommunityBoard.name.asc()).all()
    payload = []
    for board in boards:
        members = _board_members(board)
        payload.append(
            {
                "boardID": board.boardID,
                "name": board.name,
                "description": board.description or "",
                "alumniID": board.alumniID,
                "adminName": board.owner.name if board.owner else "Community Admin",
                "members": len(members),
                "isMember": _is_member(g.current_user, board),
            }
        )
    return jsonify({"boards": payload})


@community_board_bp.post("")
@role_required("alumni", "admin")
def create_board():
    data = _payload()
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    board = CommunityBoard(
        alumniID=g.current_user.userID,
        name=name,
        description=description,
    )
    db.session.add(board)
    db.session.flush()
    _join_board(g.current_user, board)
    db.session.commit()
    return jsonify({"message": "Board created", "boardID": board.boardID}), 201


@community_board_bp.post("/<board_id>/join")
@role_required("alumni", "admin")
def join_board(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    _join_board(g.current_user, board)
    db.session.commit()
    return jsonify({"message": "Joined community", "boardID": board.boardID})


@community_board_bp.post("/<board_id>/leave")
@role_required("alumni", "admin")
def leave_board(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    if board.alumniID == g.current_user.userID:
        return jsonify({"error": "Community admin cannot leave their own board"}), 400
    _leave_board(g.current_user, board)
    db.session.commit()
    return jsonify({"message": "Left community", "boardID": board.boardID})


@community_board_bp.get("/<board_id>/members")
@login_required
def list_members(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    members = _board_members(board)
    return jsonify({"boardID": board.boardID, "members": members, "count": len(members)})


@community_board_bp.get("/posts/all")
@login_required
def list_all_posts():
    posts = BoardPost.query.order_by(BoardPost.postedDate.desc()).all()
    return jsonify({"posts": [_post_dict(post, g.current_user) for post in posts]})


@community_board_bp.get("/<board_id>")
@login_required
def board_page(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    posts = BoardPost.query.filter_by(boardID=board_id).order_by(BoardPost.postedDate.desc()).limit(50).all()
    jobs = Job.query.filter_by(boardID=board_id).order_by(Job.postedDate.desc()).limit(50).all()
    events = Event.query.filter_by(boardID=board_id).order_by(Event.date.asc(), Event.time.asc()).limit(50).all()
    members = _board_members(board)
    return jsonify(
        {
            "board": {
                "boardID": board.boardID,
                "name": board.name,
                "description": board.description or "",
                "alumniID": board.alumniID,
                "adminName": board.owner.name if board.owner else "Community Admin",
                "isMember": _is_member(g.current_user, board),
                "members": len(members),
            },
            "members": members,
            "posts": [_post_dict(post, g.current_user) for post in posts],
            "jobs": [_job_dict(job) for job in jobs],
            "events": [_event_dict(event) for event in events],
        }
    )


@community_board_bp.get("/<board_id>/posts")
@login_required
def list_posts(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    posts = BoardPost.query.filter_by(boardID=board_id).order_by(BoardPost.postedDate.desc()).all()
    return jsonify({"posts": [_post_dict(post, g.current_user) for post in posts]})


@community_board_bp.post("/<board_id>/posts")
@role_required("alumni", "admin")
def createPost(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    if not _is_member(g.current_user, board):
        return jsonify({"error": "Join this community before posting discussions"}), 403

    data = _payload()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    post = BoardPost(boardID=board_id, alumniID=g.current_user.userID, content=content)
    db.session.add(post)
    db.session.commit()
    return jsonify({"message": "Post created", "post": _post_dict(post, g.current_user)}), 201


@community_board_bp.post("/posts/<post_id>/like")
@role_required("alumni", "admin")
def toggle_like(post_id):
    post = db.session.get(BoardPost, post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    board = db.session.get(CommunityBoard, post.boardID)
    if not _is_member(g.current_user, board):
        return jsonify({"error": "Join this community before liking posts"}), 403

    liked_by = {str(user_id) for user_id in (post.likedBy or [])}
    current_id = str(g.current_user.userID)
    if current_id in liked_by:
        liked_by.remove(current_id)
        liked = False
    else:
        liked_by.add(current_id)
        liked = True

    post.likedBy = sorted(liked_by)
    post.likesCount = len(liked_by)
    db.session.commit()
    return jsonify({"postID": post.postID, "likesCount": post.likesCount, "liked": liked})


@community_board_bp.post("/posts/<post_id>/comments")
@role_required("alumni", "admin")
def add_comment(post_id):
    post = db.session.get(BoardPost, post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    board = db.session.get(CommunityBoard, post.boardID)
    if not _is_member(g.current_user, board):
        return jsonify({"error": "Join this community before commenting"}), 403

    data = _payload()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    comments = list(post.comments or [])
    comment = {
        "commentID": str(uuid4()),
        "authorID": g.current_user.userID,
        "authorName": g.current_user.name,
        "content": content,
        "time": datetime.utcnow().isoformat(),
        "avatar": f"https://ui-avatars.com/api/?name={g.current_user.name.replace(' ', '+')}&background=0D8ABC&color=fff",
    }
    comments.append(comment)
    post.comments = comments
    db.session.commit()
    return jsonify(
        {
            "message": "Comment added",
            "postID": post.postID,
            "comment": comment,
            "commentsCount": len(comments),
            "comments": comments,
        }
    )


@community_board_bp.get("/<board_id>/jobs")
@login_required
def listJobs(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    jobs = Job.query.filter_by(boardID=board_id).order_by(Job.postedDate.desc()).all()
    return jsonify({"jobs": [_job_dict(job) for job in jobs]})

@community_board_bp.put("/<board_id>/events")
@role_required("alumni", "admin")
def createEvent(board_id):
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    data = _payload()
    required = ["title", "date", "time", "location", "maxAttendees"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        event_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        event_time = datetime.strptime(data["time"], "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid date/time format; expected YYYY-MM-DD and HH:MM"}), 400

    event = Event(
        alumniID=g.current_user.userID,
        boardID=board_id,
        title=data["title"].strip(),
        description=(data.get("description") or "").strip(),
        date=event_date,
        time=event_time,
        location=data["location"].strip(),
        maxAttendees=int(data["maxAttendees"]),
        status="active",
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({"message": "Event created", "event": _event_dict(event)}), 201