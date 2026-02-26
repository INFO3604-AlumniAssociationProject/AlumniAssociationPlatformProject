import os
from flask import Flask
from .config import DevConfig
from .extensions import db, login_manager, migrate
from .models import AlumniUser

def create_app():
    app = Flask(__name__)
    app.config.from_object(DevConfig())

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "resumes"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "avatars"), exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "warning"

    @login_manager.user_loader
    def load_user(user_id: str):
        return AlumniUser.query.get(int(user_id))

    # Blueprints (comtrollers)
    from .blueprints.auth import bp as auth_bp
    from .blueprints.sso import bp as sso_bp
    from .blueprints.feed import bp as feed_bp
    from .blueprints.profile import bp as profile_bp
    from .blueprints.communities import bp as communities_bp
    from .blueprints.career import bp as career_bp
    from .blueprints.messages import bp as messages_bp
    from .blueprints.network import bp as network_bp
    from .blueprints.admin import bp as admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(sso_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(communities_bp)
    app.register_blueprint(career_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(admin_bp)

    return app