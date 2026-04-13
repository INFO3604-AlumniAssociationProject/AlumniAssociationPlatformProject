from datetime import datetime, timezone
from uuid import uuid4
from App.database import db
from App.Models import BoardPost, CommunityBoard, Alumni


def createBoardPost(alumni_id: str, board_id: str, content: str):
    if not content.strip():
        raise ValueError("Content cannot be empty")
    
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError(f"Board {board_id} not found")
    members = board.memberIDs or []
    if alumni_id != board.alumniID and alumni_id not in members:
        raise PermissionError("Join board before posting")
    
    post = BoardPost(
        postID=str(uuid4()),
        boardID=board_id,
        alumniID=alumni_id,
        content=content.strip(),
        postedDate=datetime.now(timezone.utc),
        likesCount=0,
        likedBy=[],
        comments=[]
    )
    db.session.add(post)
    db.session.commit()
    return post


def viewBoardPost(post_id: str):
    post = db.session.get(BoardPost, post_id)
    return post


def listBoardPosts(board_id: str = None) -> list:
    query = BoardPost.query.order_by(BoardPost.postedDate.desc())
    if board_id:
        query = query.filter_by(boardID=board_id)
    return [post.to_dict() for post in query.all()]


def updateBoardPost(post_id: str, alumni_id: str, content: str, is_admin: bool = False):
    post = db.session.get(BoardPost, post_id)
    if not post:
        raise ValueError(f"Post {post_id} not found")
    
    if not is_admin and post.alumniID != alumni_id:
        raise PermissionError("Only author or admin can edit this post")
    
    if content:
        post.content = content.strip()
    
    db.session.commit()
    return post


def deleteBoardPost(post_id: str, alumni_id: str, is_admin: bool = False) -> None:
    post = db.session.get(BoardPost, post_id)
    if not post:
        raise ValueError(f"Post {post_id} not found")
    
    if not is_admin and post.alumniID != alumni_id:
        raise PermissionError("Only author or admin can delete this post")
    
    db.session.delete(post)
    db.session.commit()


def likePost(post_id: str, alumni_id: str) -> dict:
    post = db.session.get(BoardPost, post_id)
    if not post:
        raise ValueError(f"Post {post_id} not found")
    
    liked_by = set(post.likedBy or [])
    if alumni_id in liked_by:
        liked_by.remove(alumni_id)
        liked = False
    else:
        liked_by.add(alumni_id)
        liked = True
    
    post.likedBy = sorted(liked_by)
    post.likesCount = len(liked_by)
    db.session.commit()
    
    return {"likesCount": post.likesCount, "liked": liked, "likedBy": post.likedBy or []}


def addComment(post_id: str, alumni_id: str, alumni_name: str, content: str) -> dict:
    if not content.strip():
        raise ValueError("Comment content cannot be empty")
    
    post = db.session.get(BoardPost, post_id)
    if not post:
        raise ValueError(f"Post {post_id} not found")
    
    comments = list(post.comments or [])
    comment = {
        "commentID": str(uuid4()),
        "authorID": alumni_id,
        "authorName": alumni_name,
        "content": content.strip(),
        "time": datetime.now(timezone.utc).isoformat(),
        "avatar": f"https://ui-avatars.com/api/?name={alumni_name.replace(' ', '+')}&background=0D8ABC&color=fff"
    }
    comments.append(comment)
    post.comments = comments
    db.session.commit()
    return comment


def listAllPosts() -> list:
    """Return serialized posts with author names and comment counts."""
    posts = BoardPost.query.order_by(BoardPost.postedDate.desc()).all()
    result = []
    for post in posts:
        author = db.session.get(Alumni, post.alumniID)
        result.append({
            "postID": post.postID,
            "boardID": post.boardID,
            "authorName": author.name if author else "Unknown",
            "content": post.content,
            "postedDate": post.postedDate.isoformat(),
            "likesCount": post.likesCount,
            "likedBy": post.likedBy or [],
            "comments": post.comments or [],
            "commentsCount": len(post.comments or []),
        })
    return result
