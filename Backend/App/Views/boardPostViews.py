from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from App.Controllers import boardPostController
from App.Models import Alumni
from App.database import db
from App.utils import _payload
from App.Controllers.userController import currentUser


board_post_bp = Blueprint("board_posts", __name__, url_prefix="/boardposts")


@board_post_bp.route("", methods=["GET"])
@jwt_required()
def listBoardPosts():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    board_id = request.args.get("board_id")
    posts = boardPostController.listBoardPosts(board_id)
    return jsonify({"posts": posts}), 200


@board_post_bp.route("/<post_id>", methods=["GET"])
@jwt_required()
def getBoardPost(post_id):
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    try:
        post = boardPostController.viewBoardPost(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        return jsonify({"post": post.to_dict()}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@board_post_bp.route("", methods=["POST"])
@jwt_required()
def createBoardPost():
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Alumni access required"}), 403
    data = _payload()
    board_id = data.get("boardID")
    content = data.get("content")
    if not board_id or not content:
        return jsonify({"error": "boardID and content are required"}), 400
    try:
        post = boardPostController.createBoardPost(user.userID, board_id, content)
        return jsonify({"message": "Post created", "post": post.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@board_post_bp.route("/all", methods=["GET"])
@jwt_required()
def getAllPosts():
    user = currentUser()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    posts = boardPostController.listAllPosts()
    return jsonify({"posts": posts}), 200


@board_post_bp.route("/<post_id>", methods=["PATCH"])
@jwt_required()
def updateBoardPost(post_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    data = _payload()
    content = data.get("content")
    if not content:
        return jsonify({"error": "content is required"}), 400
    is_admin = (user.role == "admin")
    try:
        post = boardPostController.updateBoardPost(post_id, user.userID, content, is_admin)
        return jsonify({"message": "Post updated", "post": post.to_dict()}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@board_post_bp.route("/<post_id>", methods=["DELETE"])
@jwt_required()
def deleteBoardPost(post_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    is_admin = (user.role == "admin")
    try:
        boardPostController.deleteBoardPost(post_id, user.userID, is_admin)
        return jsonify({"message": "Post deleted"}), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@board_post_bp.route("/<post_id>/like", methods=["POST"])
@jwt_required()
def likePost(post_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    try:
        result = boardPostController.likePost(post_id, user.userID)
        return jsonify(result), 200
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@board_post_bp.route("/<post_id>/comments", methods=["POST"])
@jwt_required()
def addComment(post_id):
    user = currentUser()
    if not user or user.role not in ("alumni", "admin"):
        return jsonify({"error": "Authentication required"}), 403
    data = _payload()
    content = data.get("content")
    if not content:
        return jsonify({"error": "content is required"}), 400
    alumni = db.session.get(Alumni, user.userID)
    if not alumni:
        return jsonify({"error": "Alumni profile not found"}), 404
    try:
        comment = boardPostController.addComment(post_id, user.userID, alumni.name, content)
        return jsonify({"message": "Comment added", "comment": comment}), 201
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
