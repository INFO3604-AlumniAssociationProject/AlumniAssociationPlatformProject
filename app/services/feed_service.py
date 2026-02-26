from datetime import datetime, timedelta
from sqlalchemy import func
from ..extensions import db
from ..models import Announcement, SponsorRequest, AdminSettings, CommunityPost, PostLike, SharedJob

def get_settings() -> AdminSettings:
    s = AdminSettings.query.first()
    if not s:
        s = AdminSettings()
        db.session.add(s)
        db.session.commit()
    return s

def guest_feed():
    """Guest sees: admin announcements + active sponsored posts + trending community posts."""
    s = get_settings()

    announcements = (Announcement.query
                     .order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
                     .limit(5).all())

    now = datetime.utcnow()
    active_sponsors = (SponsorRequest.query
                       .filter(SponsorRequest.status == "approved",
                               SponsorRequest.expires_at != None,
                               SponsorRequest.expires_at > now)
                       .order_by(SponsorRequest.tier.desc(), SponsorRequest.approved_at.desc())
                       .limit(s.sponsored_per_page)
                       .all())

    # Trending- most likes in last 7 days
    since = now - timedelta(days=7)
    trending = (db.session.query(CommunityPost)
                .outerjoin(PostLike, PostLike.post_id == CommunityPost.id)
                .filter(CommunityPost.created_at >= since)
                .group_by(CommunityPost.id)
                .order_by(func.count(PostLike.id).desc(), CommunityPost.created_at.desc())
                .limit(10)
                .all())

    return announcements, active_sponsors, trending