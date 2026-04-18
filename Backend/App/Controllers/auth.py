# File: App/Controllers/auth.py

from flask_jwt_extended import (
    create_access_token,
    decode_token,
    get_jwt_identity,
    verify_jwt_in_request,
    JWTManager,
)
from App.Models import User
from App.database import db


def authenticate_user(email: str, password: str):
    """
    Verify email and password.
    Returns User object if credentials are valid, otherwise None.
    """
    user = User.query.filter_by(email=email.strip().lower()).first()
    if user and user.check_password(password):
        return user
    return None


def issue_access_token(user: User) -> str:
    """
    Generate a JWT access token for the given user.
    """
    return create_access_token(identity=user)


def decode_access_token(token: str):
    """
    Decode a JWT token and return (payload, error).
    Returns (payload_dict, None) on success, (None, error_message) on failure.
    """
    try:
        payload = decode_token(token)
        return payload, None
    except Exception as e:
        return None, str(e)


def extract_bearer_token(request):
    """
    Extract JWT token from Authorization: Bearer <token> header.
    Returns token string or None.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def setup_jwt(app):
    """
    Initialize JWT manager and configure user loader callbacks.
    """
    jwt = JWTManager(app)

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        # Return the string userID as the JWT subject
        return user.userID

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return db.session.get(User, identity)

    return jwt


def add_auth_context(app):
    """
    Add authentication context to all templates (for server‑side rendering).
    Injects `is_authenticated` and `user` into Jinja2 context.
    """
    @app.context_processor
    def inject_user():
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            user = db.session.get(User, user_id) if user_id else None
            is_authenticated = user is not None
        except Exception:
            is_authenticated = False
            user = None
        return dict(is_authenticated=is_authenticated, user=user)