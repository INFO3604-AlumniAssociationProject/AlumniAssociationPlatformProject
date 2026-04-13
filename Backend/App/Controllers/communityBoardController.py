from datetime import datetime
from uuid import uuid4
from App.database import db
from App.Models import CommunityBoard, BoardPost, Job, Event, Alumni


def listAllPostsRaw() -> list:
    """Return all posts across all boards for the feed (raw model objects)."""
    return BoardPost.query.order_by(BoardPost.postedDate.desc()).all()


def listBoardMembers(board_id: str) -> list:
    """Return list of members (alumni) for a board."""
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError("Board not found")

    member_ids = list({*(board.memberIDs or []), board.alumniID})
    members = []
    for uid in member_ids:
        alumni = db.session.get(Alumni, uid)
        if alumni:
            members.append({
                "userID": alumni.alumniID,
                "name": alumni.name,
                "email": alumni.email,
                "role": "alumni",
                "avatar": f"https://ui-avatars.com/api/?name={alumni.name}&background=random",
                "isAdmin": (uid == board.alumniID)
            })
    return members


def createBoard(owner_id: str, name: str, description: str = None) -> str:
    if not name or not name.strip():
        raise ValueError("name is required")
    board = CommunityBoard(
        boardID=str(uuid4()),
        alumniID=owner_id,
        name=name.strip(),
        description=description.strip() if description else None,
        memberIDs=[owner_id],
    )
    db.session.add(board)
    db.session.commit()
    return board.boardID


def joinBoard(alumni_id: str, board_id: str) -> None:
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError("Board not found")
    members = board.memberIDs or []
    if alumni_id in members or alumni_id == board.alumniID:
        raise ValueError("Already a member of the board")
    members.append(alumni_id)
    board.memberIDs = members
    db.session.commit()


def leaveBoard(alumni_id: str, board_id: str) -> None:
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError("Board not found")
    if board.alumniID == alumni_id:
        raise ValueError("Community admin cannot leave their own board")
    members = board.memberIDs or []
    if alumni_id not in members:
        raise ValueError("Not a member of the board")
    members = [mid for mid in members if mid != alumni_id]
    board.memberIDs = members
    db.session.commit()


def listBoardsForUser(alumni_id: str) -> list:
    boards = CommunityBoard.query.all()
    results = []
    for board in boards:
        member_ids = board.memberIDs or []
        if board.alumniID not in member_ids:
            member_ids.append(board.alumniID)
        results.append({
            "board": board,
            "members": len(member_ids),
            "isMember": alumni_id in member_ids,
            "adminName": board.owner.name if board.owner else None
        })
    return results


def viewBoardDetails(board_id: str, alumni_id: str = None) -> dict:
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError("Board not found")

    posts = BoardPost.query.filter_by(boardID=board_id).order_by(BoardPost.postedDate.desc()).limit(50).all()
    jobs = Job.query.filter_by(boardID=board_id).order_by(Job.postedDate.desc()).limit(50).all()
    events = Event.query.filter_by(boardID=board_id).order_by(Event.date.asc(), Event.time.asc()).limit(50).all()

    return {
        "board": board,
        "posts": posts,
        "jobs": jobs,
        "events": events,
    }


def createPostInBoard(board_id: str, alumni_id: str, content: str) -> str:
    board = db.session.get(CommunityBoard, board_id)
    if not board:
        raise ValueError("Board not found")

    member_ids = list({*(board.memberIDs or []), board.alumniID})
    if alumni_id not in member_ids:
        raise PermissionError("Join the board before contributing")

    if not content.strip():
        raise ValueError("content is required")

    post = BoardPost(
        boardID=board_id,
        alumniID=alumni_id,
        content=content.strip(),
        likesCount=0,
        likedBy=[],
        comments=[]
    )
    db.session.add(post)
    db.session.commit()
    return post.postID