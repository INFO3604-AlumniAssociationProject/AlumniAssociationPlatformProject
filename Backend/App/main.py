import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from .database import db

migrate = Migrate()
BASE_DIR = Path(__file__).resolve().parent


def _build_cors_origins() -> list[str]:
    env_origins = os.getenv("FRONTEND_ORIGINS")
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]

    # Allow localhost, loopback, and typical private network ranges so others on the LAN can reach the API.
    return [
        r"https?://localhost(?::\d+)?",
        r"https?://127\.0\.0\.1(?::\d+)?",
        r"https?://\[::1\](?::\d+)?",
        r"https?://192\.168\.\d+\.\d+(?::\d+)?",
        r"https?://10\.\d+\.\d+\.\d+(?::\d+)?",
        r"https?://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(?::\d+)?",
    ]


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'

    uploads_path = BASE_DIR / "uploads"
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.config['UPLOADED_PHOTOS_DEST'] = str(uploads_path.resolve())

    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_COOKIE_SECURE"] = True
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config['FLASK_ADMIN_SWATCH'] = 'darkly'

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        resources={r"/api/*": {
            "origins": _build_cors_origins(),
            "allow_headers": ["Authorization", "Content-Type"],
            "supports_credentials": True,
        }},
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
