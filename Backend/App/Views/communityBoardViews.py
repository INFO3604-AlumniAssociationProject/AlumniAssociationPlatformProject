from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from App.Controllers import communityBoardController
from App.Controllers import jobController
from App.Controllers import eventController
from App.utils import _payload
from App.Controllers.userController import currentUser


community_board_bp = Blueprint("community_board", __name__, url_prefix="/boards")


@community_board_bp.route("", methods=["GET"])
@jwt_required()
def listBoards():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    boards = communityBoardController.listBoardsForUser(user.userID)
    serialized = []
    for entry in boards:
        board = entry["board"]
        serialized.append({
            "boardID": board.boardID,
            "name": board.name,
            "description": board.description,
            "alumniID": board.alumniID,
            "adminName": entry.get("adminName") or (board.owner.name if board.owner else "Unknown"),
            "members": entry.get("members", len(board.memberIDs or [])),
            "isMember": entry.get("isMember", False),
        })
    return jsonify({"boards": serialized}), 200


@community_board_bp.route("/<board_id>/members", methods=["GET"])
@jwt_required()
def getBoardMembers(board_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    try:
        members = communityBoardController.listBoardMembers(board_id)
        return jsonify({"members": members}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404 if "not found" in str(e).lower() else 400


@community_board_bp.route("", methods=["POST"])
@jwt_required()
def createBoard():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    name = data.get("name")
    description = data.get("description")
    if not name:
        return jsonify({"error": "name is required"}), 400
    try:
        board_id = communityBoardController.createBoard(user.userID, name, description)
        return jsonify({"message": "Board created", "boardID": board_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@community_board_bp.route("/<board_id>/join", methods=["POST"])
@jwt_required()
def joinBoard(board_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    try:
        communityBoardController.joinBoard(user.userID, board_id)
        return jsonify({"message": "Joined community", "boardID": board_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        if "already" in msg:
            return jsonify({"error": str(e)}), 409
        return jsonify({"error": str(e)}), 400


@community_board_bp.route("/<board_id>/leave", methods=["POST"])
@jwt_required()
def leaveBoard(board_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    try:
        communityBoardController.leaveBoard(user.userID, board_id)
        return jsonify({"message": "Left community", "boardID": board_id}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@community_board_bp.route("/<board_id>", methods=["GET"])
@jwt_required()
def boardPage(board_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    try:
        data = communityBoardController.viewBoardDetails(board_id, user.userID)
        return jsonify({
            "board": data["board"].to_dict(),
            "posts": [post.to_dict() for post in data["posts"]],
            "jobs": [job.to_dict() for job in data["jobs"]],
            "events": [event.to_dict() for event in data["events"]],
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404 if "not found" in str(e).lower() else 400


@community_board_bp.route("/<board_id>/posts", methods=["POST"])
@jwt_required()
def createPost(board_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    content = data.get("content")
    if not content:
        return jsonify({"error": "content is required"}), 400
    try:
        post_id = communityBoardController.createPostInBoard(board_id, user.userID, content)
        return jsonify({"message": "Post created", "postID": post_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@community_board_bp.route("/<board_id>/jobs", methods=["POST"])
@jwt_required()
def createBoardJob(board_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    required = ["title", "company", "description", "expiryDate"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    try:
        admin_id = user.userID if user.role == "admin" else None
        job_id = jobController.createJob(
            alumni_id=user.userID,
            board_id=board_id,
            title=data.get("title"),
            company=data.get("company"),
            description=data.get("description"),
            expiry_date_str=data.get("expiryDate"),
            salary_range=data.get("salaryRange"),
            location=data.get("location"),
            admin_id=admin_id,
        )
        return jsonify({"message": "Job submitted", "jobID": job_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@community_board_bp.route("/<board_id>/events", methods=["POST"])
@jwt_required()
def createBoardEvent(board_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    required = ["title", "date", "time", "location"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    try:
        event_id = eventController.createEvent(
            alumni_id=user.userID,
            board_id=board_id,
            title=data.get("title"),
            description=data.get("description", ""),
            date_str=data.get("date"),
            time_str=data.get("time"),
            location=data.get("location"),
            max_attendees=data.get("maxAttendees", 100),
        )
        return jsonify({"message": "Event submitted", "eventID": event_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403