from functools import wraps
from flask import redirect, url_for, request, flash, session
from flask_login import current_user

def alumni_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Create an account to continue.", "info")
            return redirect(url_for("auth.login", next=request.url))
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_id"):
            flash("Admin login required.", "warning")
            return redirect(url_for("admin.login", next=request.url))
        return fn(*args, **kwargs)
    return wrapper