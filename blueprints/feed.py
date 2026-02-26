from flask import Blueprint, render_template
from flask_login import current_user
from ..services.feed_service import guest_feed

bp = Blueprint("feed", __name__)

@bp.get("/")
def home():
    announcements, sponsored, trending = guest_feed()
    return render_template(
        "feed/home.html",
        announcements=announcements,
        sponsored=sponsored,
        trending=trending,
        is_guest=not current_user.is_authenticated,
    )