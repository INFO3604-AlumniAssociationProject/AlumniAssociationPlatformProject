from ..database import db
from datetime import datetime, timezone
from uuid import uuid4

class BoardPost(db.Model):
    __tablename__ = "board_posts"

    postID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    boardID = db.Column(db.String(36), db.ForeignKey("community_boards.boardID"), nullable=False)
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    postedDate = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    likesCount = db.Column(db.Integer, nullable=False, default=0)
    likedBy = db.Column(db.JSON, nullable=False, default=list)
    comments = db.Column(db.JSON, nullable=False, default=list)

    board = db.relationship("CommunityBoard", back_populates="posts")
    author = db.relationship("Alumni", back_populates="posts")

    def __repr__(self):
        return f'<BoardPost {self.postID}>'
    
    def __init__(self, *args, **kwargs):
        # Call base constructor, then set defaults without overwriting provided values
        super().__init__(*args, **kwargs)
        from datetime import datetime, timezone as _tz
        if getattr(self, 'postedDate', None) is None:
            self.postedDate = datetime.now(_tz.utc)
        if getattr(self, 'likesCount', None) is None:
            self.likesCount = 0
        if getattr(self, 'likedBy', None) is None:
            self.likedBy = []
        if getattr(self, 'comments', None) is None:
            self.comments = []
    
    def to_dict(self):
        return {
            "postID": self.postID,
            "boardID": self.boardID,
            "alumniID": self.alumniID,
            "content": self.content,
            "postedDate": self.postedDate.isoformat(),
            "likesCount": self.likesCount,
            "likedBy": self.likedBy or [],
            "comments": self.comments or [],
        }
