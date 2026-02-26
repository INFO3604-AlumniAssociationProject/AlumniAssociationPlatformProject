from .models import RoleAssignment, RolePermission, CommunityRole
from .extensions import db

PRESIDENT_ROLE_NAME = "President"

DEFAULT_PERMISSIONS = {
    # president default includes everything
    PRESIDENT_ROLE_NAME: [
        "manage_community",
        "manage_members",
        "manage_roles",
        "manage_posts",
        "manage_events",
        "manage_positions",   
        "manage_shared_jobs",
        "sponsor_post",
        "moderate_content",
    ]
}

def user_has_permission(user_id: int, community_id: int, perm_key: str) -> bool:
    ra = (db.session.query(RoleAssignment, RolePermission)
          .join(RolePermission, RolePermission.role_id == RoleAssignment.role_id)
          .filter(RoleAssignment.user_id == user_id,
                  RoleAssignment.community_id == community_id,
                  RolePermission.key == perm_key)
          .first())
    return ra is not None