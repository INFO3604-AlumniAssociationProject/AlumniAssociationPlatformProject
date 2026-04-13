from .adminViews import admin_bp
from .alumniViews import alumni_bp
from .communityBoardViews import community_board_bp
from .eventViews import event_bp
from .eventRegistrationViews import event_registration_bp
from .jobViews import job_bp
from .messageViews import message_bp
from .profileViews import profile_bp
from .userViews import user_bp
from .boardPostViews import board_post_bp
from .jobApplicationViews import job_application_bp

all_blueprints = [
    user_bp,
    alumni_bp,
    admin_bp,
    community_board_bp,
    board_post_bp,
    event_bp,
    event_registration_bp,
    job_bp,
    job_application_bp,
    message_bp,
    profile_bp,
]
