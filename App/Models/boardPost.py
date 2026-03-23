from ..database import db
from datetime import datetime
from uuid import uuid4

class BoardPost(db.Model):
    __tablename__ = "board_posts"

    postID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    boardID = db.Column(db.String(36), db.ForeignKey("community_boards.boardID"), nullable=False)
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    postedDate = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    likesCount = db.Column(db.Integer, nullable=False, default=0)
    likedBy = db.Column(db.JSON, nullable=False, default=list)
    comments = db.Column(db.JSON, nullable=False, default=list)

    board = db.relationship("CommunityBoard", back_populates="posts")
    author = db.relationship("Alumni", back_populates="posts")

    def __repr__(self):
        return f'<BoardPost {self.postID}>'