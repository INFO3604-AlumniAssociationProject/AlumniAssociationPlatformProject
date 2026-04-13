import re
from flask import request


def _payload():
    """
    Safely extract payload from request (JSON or form data).
    Returns a dict.
    """
    if request.is_json:
        return request.get_json(silent=True) or {}
    return request.form.to_dict(flat=True)


def _wants_json():
    """
    Determine if the client expects a JSON response.
    Used to decide between JSON API responses and HTML pages.
    """
    best = request.accept_mimetypes.best_match(['application/json', 'text/html'])
    return best == 'application/json' and request.accept_mimetypes[best] > request.accept_mimetypes['text/html']


def _to_bool(value, default=False):
    """
    Convert various representations to boolean.
    Supports: bool, string 'true'/'1'/'yes'/'on', etc.
    """
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}