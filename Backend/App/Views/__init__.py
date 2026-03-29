from .adminViews import admin_bp
from .alumniViews import alumni_bp
from .communityBoardViews import community_board_bp
from .eventViews import event_bp
from .eventRegistrationViews import event_registration_bp
from .jobViews import job_bp
from .messageViews import message_bp
from .profileViews import profile_bp
from .userController import user_bp

all_blueprints = [
    user_bp,
    alumni_bp,
    admin_bp,
    community_board_bp,
    event_bp,
    event_registration_bp,
    job_bp,
    message_bp,
    profile_bp,
]