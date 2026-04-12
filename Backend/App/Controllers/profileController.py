from App.database import db
from App.Models import Profile
from App.utils import _to_bool


def getOrCreateProfile(alumni_id: str):
    profile = Profile.query.filter_by(alumniID=alumni_id).first()
    if not profile:
        profile = Profile(alumniID=alumni_id)
        db.session.add(profile)
        db.session.commit()
    return profile


def updateBio(alumni_id: str, bio: str = None, contact_info: list = None,
              social_links: list = None, profile_visibility: str = None,
              show_current_job: bool = None, allow_messages: bool = None,
              show_email: bool = None):
    profile = getOrCreateProfile(alumni_id)
    
    if bio is not None:
        profile.bio = bio.strip()
    if contact_info is not None:
        profile.contactInfo = contact_info or []
    if social_links is not None:
        profile.socialLinks = social_links or []
    if profile_visibility:
        profile.profileVisibility = profile_visibility.strip().lower()
    if show_current_job is not None:
        profile.showCurrentJob = _to_bool(show_current_job, default=True)
    if allow_messages is not None:
        profile.allowMessages = _to_bool(allow_messages, default=True)
    if show_email is not None:
        profile.showEmail = _to_bool(show_email, default=False)
    
    db.session.commit()
    return profile


def updateProfilePhoto(alumni_id: str, photo_url: str):
    if not photo_url:
        raise ValueError("profilePicture URL is required")
    profile = getOrCreateProfile(alumni_id)
    profile.profilePicture = photo_url.strip()
    db.session.commit()
    return profile


def getProfile(alumni_id: str):
    profile = Profile.query.filter_by(alumniID=alumni_id).first()
    if not profile:
        profile = Profile(alumniID=alumni_id)
        db.session.add(profile)
        db.session.commit()
    return profile.to_dict()