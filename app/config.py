import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/alumni_app")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = db_url

    BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:5000")

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(os.getcwd(), "app", "static", "uploads"))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  

    # Email verification 
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@alumniapp.edu")

class DevConfig(Config):
    DEBUG = True