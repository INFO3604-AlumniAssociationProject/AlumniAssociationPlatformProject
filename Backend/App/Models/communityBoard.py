from App.database import db
from sqlalchemy.ext.mutable import MutableList
from uuid import uuid4

class CommunityBoard(db.Model):
    __tablename__ = "community_boards"

    boardID = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    alumniID = db.Column(db.String(36), db.ForeignKey("alumni.alumniID"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    memberIDs = db.Column(MutableList.as_mutable(db.JSON), nullable=False, default=list)
    
    owner = db.relationship("Alumni", back_populates="boards")
    posts = db.relationship("BoardPost", back_populates="board", lazy="dynamic")
    jobs = db.relationship("Job", back_populates="board", lazy="dynamic")
    events = db.relationship("Event", back_populates="board", lazy="dynamic")

    def __repr__(self):
        return f'<CommunityBoard {self.name}>'
    
    def to_dict(self):
        return {
            "boardID": self.boardID,
            "alumniID": self.alumniID,
            "name": self.name,
            "description": self.description
        }
    
    