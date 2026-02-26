from flask import current_app

def send_verification_email(email: str, token: str) -> None:
    link = f"{current_app.config['BASE_URL']}/auth/verify/{token}"
    print(f"[VERIFY EMAIL] Send to {email}: {link}")