from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from .extensions import db

# Admin
class AdminUser(db.Model):
    __tablename__ = "admin_users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    pw_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, pw: str) -> None:
        self.pw_hash = generate_password_hash(pw)

    def check_password(self, pw: str) -> bool:
        return check_password_hash(self.pw_hash, pw)

# Alumni
class AlumniUser(UserMixin, db.Model):
    __tablename__ = "alumni_users"
    id = db.Column(db.Integer, primary_key=True)

    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    pw_hash = db.Column(db.String(255), nullable=False)

    full_name = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, default="")
    headline = db.Column(db.String(120), default="")
    company = db.Column(db.String(120), default="")
    location = db.Column(db.String(120), default="")
    faculty = db.Column(db.String(120), default="")
    grad_year = db.Column(db.Integer, nullable=True)

    avatar_path = db.Column(db.String(255), nullable=True)
    resume_path = db.Column(db.String(255), nullable=True)

    is_verified = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    suspended_until = db.Column(db.DateTime, nullable=True)

    show_in_directory = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, pw: str) -> None:
        self.pw_hash = generate_password_hash(pw)

    def check_password(self, pw: str) -> bool:
        return check_password_hash(self.pw_hash, pw)

    def is_suspended(self) -> bool:
        return self.suspended_until is not None and self.suspended_until > datetime.utcnow()

class EmailVerificationToken(db.Model):
    __tablename__ = "email_verification_tokens"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

class Announcement(db.Model):
    __tablename__ = "announcements"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Community(db.Model):
    __tablename__ = "communities"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    created_by = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)

    join_requires_approval = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CommunityMembership(db.Model):
    __tablename__ = "community_memberships"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    status = db.Column(db.String(20), default="approved") 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("community_id", "user_id", name="uq_membership"),
    )

class CommunityRole(db.Model):
    __tablename__ = "community_roles"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False)  

    __table_args__ = (
        db.UniqueConstraint("community_id", "name", name="uq_role_name_per_community"),
    )

class RolePermission(db.Model):
    __tablename__ = "role_permissions"
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey("community_roles.id"), nullable=False)
    key = db.Column(db.String(80), nullable=False)  

    __table_args__ = (
        db.UniqueConstraint("role_id", "key", name="uq_role_perm"),
    )

class RoleAssignment(db.Model):
    __tablename__ = "role_assignments"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("community_roles.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("community_id", "user_id", name="uq_user_role_per_community"),
    )

class CommunityPost(db.Model):
    __tablename__ = "community_posts"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PostLike(db.Model):
    __tablename__ = "post_likes"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("community_posts.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("post_id", "user_id", name="uq_like"),
    )

class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)

    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=True)

    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, default="")
    starts_at = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer, nullable=True)

    member_only_registration = db.Column(db.Boolean, default=False)

    created_by = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=True)  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EventRegistration(db.Model):
    __tablename__ = "event_registrations"
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_event_reg"),
    )

class CommunityPosition(db.Model):
    __tablename__ = "community_positions"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, default="")
    is_role_assignment = db.Column(db.Boolean, default=False)
    role_to_assign_id = db.Column(db.Integer, db.ForeignKey("community_roles.id"), nullable=True)

    status = db.Column(db.String(20), default="open")  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PositionApplication(db.Model):
    __tablename__ = "position_applications"
    id = db.Column(db.Integer, primary_key=True)
    position_id = db.Column(db.Integer, db.ForeignKey("community_positions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    note = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="pending")  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("position_id", "user_id", name="uq_position_apply"),
    )

class SharedJob(db.Model):
    __tablename__ = "shared_jobs"
    id = db.Column(db.Integer, primary_key=True)

    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    posted_by = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)

    company = db.Column(db.String(140), nullable=False)
    title = db.Column(db.String(140), nullable=False)
    location = db.Column(db.String(140), default="")
    link = db.Column(db.String(500), default="")
    description = db.Column(db.Text, default="")

    status = db.Column(db.String(20), default="pending")  # pending/approved/rejected
    reviewed_by_admin_id = db.Column(db.Integer, db.ForeignKey("admin_users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SponsorRequest(db.Model):
    __tablename__ = "sponsor_requests"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("community_posts.id"), nullable=False)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=False)
    requested_by = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)

    tier = db.Column(db.String(20), default="free")  # free/priority
    status = db.Column(db.String(20), default="pending")  # pending/approved/rejected

    paid_ok = db.Column(db.Boolean, default=False)
    approved_by_admin_id = db.Column(db.Integer, db.ForeignKey("admin_users.id"), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)

    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AdminSettings(db.Model):
    __tablename__ = "admin_settings"
    id = db.Column(db.Integer, primary_key=True)

    sponsored_per_page = db.Column(db.Integer, default=2)
    sponsorship_expiry_days = db.Column(db.Integer, default=7)
    priority_fee_cents = db.Column(db.Integer, default=5000) 

    weight_trending = db.Column(db.Integer, default=50)
    weight_similarity = db.Column(db.Integer, default=50)
    suggestions_per_page = db.Column(db.Integer, default=6)

    def ensure_defaults(self):
        if self.sponsored_per_page is None:
            self.sponsored_per_page = 2
        if self.sponsorship_expiry_days is None:
            self.sponsorship_expiry_days = 7

# Messaging 
class MessageRequest(db.Model):
    __tablename__ = "message_requests"
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending/accepted/rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("from_user_id", "to_user_id", "status", name="uq_msg_req_pending_once"),
    )


class Thread(db.Model):
    __tablename__ = "threads"
    id = db.Column(db.Integer, primary_key=True)

    # dming 1:1 thread
    thread_type = db.Column(db.String(20), default="dm")  
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id"), nullable=True) 

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


class ThreadParticipant(db.Model):
    __tablename__ = "thread_participants"
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey("threads.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("thread_id", "user_id", name="uq_thread_participant"),
    )


class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey("threads.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Networking / Connections
class ConnectionRequest(db.Model):
    __tablename__ = "connection_requests"
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending/accepted/rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("from_user_id", "to_user_id", "status", name="uq_conn_req_pending_once"),
    )


class Connection(db.Model):
    __tablename__ = "connections"
    id = db.Column(db.Integer, primary_key=True)
    user_a = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    user_b = db.Column(db.Integer, db.ForeignKey("alumni_users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_a", "user_b", name="uq_connection_pair"),
    )

    @staticmethod
    def normalize_pair(u1: int, u2: int):
        return (u1, u2) if u1 < u2 else (u2, u1)

    @staticmethod
    def are_connected(u1: int, u2: int) -> bool:
        a, b = Connection.normalize_pair(u1, u2)
        return Connection.query.filter_by(user_a=a, user_b=b).first() is not None