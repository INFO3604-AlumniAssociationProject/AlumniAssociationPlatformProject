from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from .database import db

migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    app.config['UPLOADED_PHOTOS_DEST'] = "App/uploads"
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_COOKIE_SECURE"] = True
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config['FLASK_ADMIN_SWATCH'] = 'darkly'

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3001",
                ],
                "allow_headers": ["Authorization", "Content-Type"],
                "supports_credentials": True,
            }
        },
    )

    # Register API routes under /api while preserving each blueprint prefix.
    from .Views import admin_bp, alumni_bp, community_board_bp, event_bp, event_registration_bp, job_bp, message_bp, profile_bp, user_bp
    blueprints = [admin_bp, alumni_bp, community_board_bp, event_bp, event_registration_bp, job_bp, message_bp, profile_bp, user_bp]
    for blueprint in blueprints:
        blueprint_prefix = blueprint.url_prefix or ""
        app.register_blueprint(blueprint, url_prefix=f"/api{blueprint_prefix}")

    # Legacy aliases (no /api) keep older frontend calls working.
    # Use unique blueprint names to avoid endpoint collisions.
    legacy_blueprints = [alumni_bp, community_board_bp, event_bp, event_registration_bp, job_bp, message_bp, profile_bp]
    for blueprint in legacy_blueprints:
        blueprint_prefix = blueprint.url_prefix or ""
        app.register_blueprint(blueprint, url_prefix=blueprint_prefix, name=f"legacy_{blueprint.name}")

    return app