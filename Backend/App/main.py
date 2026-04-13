import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from App.Controllers.auth import setup_jwt, add_auth_context

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


def create_app(config_overrides: dict | None = None):
    app = Flask(__name__)
    jwt = setup_jwt(app)
    add_auth_context(app)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24).hex())
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', os.urandom(24).hex())
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'

    uploads_path = BASE_DIR / "uploads"
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.config['UPLOADED_PHOTOS_DEST'] = str(uploads_path.resolve())

    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_COOKIE_SECURE"] = os.environ.get('PRODUCTION', 'false').lower() == 'true'
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config['FLASK_ADMIN_SWATCH'] = 'darkly'

    if config_overrides:
        app.config.update(config_overrides)

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
    from .Views import all_blueprints
    blueprints = all_blueprints
    for blueprint in blueprints:
        blueprint_prefix = blueprint.url_prefix or ""
        app.register_blueprint(blueprint, url_prefix=f"/api{blueprint_prefix}")

    # Legacy aliases (no /api) keep older frontend calls working.
    # Use unique blueprint names to avoid endpoint collisions.
    legacy_blueprints = [blueprint for blueprint in all_blueprints if blueprint.name != "users" and blueprint.name != "admin"]
    for blueprint in legacy_blueprints:
        blueprint_prefix = blueprint.url_prefix or ""
        app.register_blueprint(blueprint, url_prefix=blueprint_prefix, name=f"legacy_{blueprint.name}")

    return app
