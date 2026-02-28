from App.Controllers.adminControllers import admin_bp
from App.Controllers.alumniControllers import alumni_bp
from App.Controllers.communityBoardController import community_board_bp
from App.Controllers.eventController import event_bp
from App.Controllers.eventRegistrationControllers import event_registration_bp
from App.Controllers.jobController import job_bp
from App.Controllers.messageController import message_bp
from App.Controllers.profileController import profile_bp
from App.Controllers.userControllers import user_bp

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
