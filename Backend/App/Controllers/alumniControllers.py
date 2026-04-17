from App.database import db
from App.Models import Alumni


def searchAlumni(query: str = None, faculty: str = None, graduation_year: int = None) -> list:
    q = Alumni.query.filter(Alumni.isPublicProfile.is_(True))
    if query:
        like = f"%{query}%"
        q = q.filter(Alumni.name.ilike(like) | Alumni.email.ilike(like))
    if faculty:
        q = q.filter(Alumni.faculty.ilike(f"%{faculty}%"))
    if graduation_year:
        q = q.filter(Alumni.graduationYear == graduation_year)
    
    results = []
    for a in q.order_by(Alumni.name.asc()).all():
        results.append({
            "alumniID": a.alumniID,
            "name": a.name,
            "email": a.email,
            "graduationYear": a.graduationYear,
            "faculty": a.faculty,
            "degree": a.degree,
            "currentJobTitle": a.currentJobTitle,
            "company": a.company,
            "location": a.location,
            "isPublicProfile": a.isPublicProfile,  
        })
    return results