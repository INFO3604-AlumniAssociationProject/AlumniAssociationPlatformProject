"""
initialize.py - Database initialization and sample data seeding (200+ realistic records).
"""
import logging
import random
from datetime import date, time, timedelta, datetime, timezone
from werkzeug.security import generate_password_hash
from flask import current_app
from App.Models import (
    User, Admin, Alumni, Profile, CommunityBoard, Job, Event, BoardPost,
    JobApplication, Message, EventRegistration
)
from App.database import db
from uuid import uuid4

LOGGER = logging.getLogger(__name__)

# ----- Helper functions for realistic random data -----
def random_name():
    first = random.choice(["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"])
    last = random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"])
    return f"{first} {last}"

def random_email(first_name, last_name):
    f = first_name.lower().replace(" ", ".")
    l = last_name.lower().replace(" ", ".")
    return f"{f}.{l}@gmail.com"

faculties = ["FST", "Engineering", "Law", "Social Sciences", "Humanities", "Medical Sciences", "Food & Agriculture", "Sport"]
degrees = ["BSc Computer Science", "BSc Information Technology", "BSc Mechanical Engineering", "LLB", "MBA", "MSc Data Science", "BA Communications", "BSc Electrical Engineering", "BSc Civil Engineering", "BSc Chemistry", "BA Economics", "BSc Nursing"]
job_titles = ["Software Engineer", "Data Analyst", "Project Manager", "Research Assistant", "Lecturer", "Consultant", "Product Manager", "UX Designer", "Systems Administrator", "DevOps Engineer", "Network Engineer", "Security Analyst", "Business Analyst", "Marketing Specialist", "HR Manager"]
companies = ["Massy Technologies", "Guardian Group", "First Citizens", "Shell", "Microsoft", "Amazon", "bpTT", "Scotiabank", "Caribbean Airlines", "Digicel", "KPMG", "PwC", "Deloitte", "EY", "Flow", "TSTT", "RBTT", "Republic Bank", "Sagicor", "Ansa McAL"]
locations = ["Port of Spain", "San Fernando", "Chaguanas", "Arima", "Point Fortin", "Scarborough", "Couva", "Tunapuna", "St. Augustine", "Maraval", "Diego Martin", "Siparia", "Princes Town", "Rio Claro", "Mayaro"]

def random_future_date(days_min=15, days_max=365):
    return date.today() + timedelta(days=random.randint(days_min, days_max))

def random_past_date(days_min=1, days_max=365):
    return date.today() - timedelta(days=random.randint(days_min, days_max))

def random_time():
    return time(random.randint(8, 20), random.choice([0, 15, 30, 45]))

# ----- Main seeding function -----
def add_sample_data(app=None):
    """Insert 200+ sample records only if database is empty."""
    target_app = app or current_app
    if not target_app:
        return
    with target_app.app_context():
        if Alumni.query.count() > 0:
            LOGGER.info("Alumni already present; skipping seeding.")
            return
        _seed()

def _seed():
    LOGGER.info("Generating sample data...")
    # ---- 1. Alumni (150) ----
    alumni_list = []
    alumni_map = {}
    # Known accounts for testing (realistic emails & easier passwords)
    known = [
        ("alice@gmail.com", "Alice Johnson", 2020, "FST", "BSc Computer Science", "Software Engineer", "TechWave", "Port of Spain"),
        ("bob@gmail.com", "Bob Singh", 2021, "Engineering", "BSc Electrical Engineering", "Hardware Engineer", "CircuitWorks", "San Fernando"),
        ("carol@gmail.com", "Carol Peters", 2019, "Law", "LLB", "Associate", "Lex Partners", "Chaguanas"),
    ]
    for email, name, grad, fac, deg, job, co, loc in known:
        alumni = Alumni(
            email=email,
            password=generate_password_hash(f"{name.split()[0].lower()}pass"),
            name=name,
            role="alumni",
            graduationYear=grad,
            faculty=fac,
            degree=deg,
            currentJobTitle=job,
            company=co,
            location=loc,
            isApproved=True,
            isPublicProfile=True,
        )
        db.session.add(alumni)
        db.session.flush()
        alumni_map[email] = alumni
        alumni_list.append(alumni)

    # Generate additional 147 alumni
    used_names = set()
    for _ in range(147):
        while True:
            first = random.choice(["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"])
            last = random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"])
            name = f"{first} {last}"
            if name not in used_names:
                used_names.add(name)
                break
        email = random_email(first, last)
        grad = random.randint(1990, 2025)
        fac = random.choice(faculties)
        deg = random.choice(degrees)
        job = random.choice(job_titles)
        co = random.choice(companies)
        alumni = Alumni(
            email=email,
            password=generate_password_hash("password123"),
            name=name,
            role="alumni",
            graduationYear=grad,
            faculty=fac,
            degree=deg,
            currentJobTitle=job,
            company=co,
            location=random.choice(locations),
            isApproved=True,
            isPublicProfile=True,
        )
        db.session.add(alumni)
        db.session.flush()
        alumni_map[email] = alumni
        alumni_list.append(alumni)

    db.session.flush()
    alumni_ids = [a.alumniID for a in alumni_list]

    # ---- 2. Profiles for every alumni (only existing fields) ----
    for alum in alumni_list:
        profile = Profile(
            alumniID=alum.alumniID,
            bio=f"Experienced {alum.currentJobTitle} with a passion for {random.choice(['tech', 'law', 'business', 'healthcare'])}. Loves {random.choice(['coding', 'reading', 'sports', 'music'])}.",
            contactInfo=[f"{alum.name.lower().replace(' ', '.')}@example.com"],
            socialLinks=[f"https://linkedin.com/in/{alum.name.replace(' ', '')}"],
            profileVisibility="public",
            showCurrentJob=True,
            allowMessages=True,
            showEmail=False,
        )
        db.session.add(profile)
    db.session.flush()

    # ---- 3. Community Boards (20) ----
    boards = []
    board_names = ["Tech Innovators", "Legal Eagles", "Engineering Hub", "Medical Alumni", "Business Leaders", "Creative Arts", "Sports Club", "Entrepreneurs Network", "Data Science Group", "Cyber Security Forum", "Green Energy Initiative", "Women in STEM", "Caribbean Culture", "Global Alumni", "Startup Weekend", "Finance & Investment", "Public Policy", "Education Reform", "Mental Health Advocates", "Volunteer Corps"]
    for i in range(20):
        owner = random.choice(alumni_list)
        board = CommunityBoard(
            name=board_names[i % len(board_names)],
            description=f"A community for {board_names[i % len(board_names)]} alumni.",
            alumniID=owner.alumniID,
            memberIDs=[]
        )
        boards.append(board)
    db.session.add_all(boards)
    db.session.flush()

    # Assign members: each board gets 5-20 members (including owner)
    for board in boards:
        members = random.sample(alumni_ids, k=random.randint(5, 20))
        if board.alumniID not in members:
            members.append(board.alumniID)
        board.memberIDs = members
    db.session.flush()

    # ---- 4. Jobs (60) ----
    jobs = []
    for _ in range(60):
        board = random.choice(boards)
        poster = random.choice(board.memberIDs)
        status = random.choice(["open", "closed", "pending_vote"])
        expiry = random_future_date()
        low = random.randint(40, 120)
        high = low + random.randint(10, 80)
        job = Job(
            boardID=board.boardID,
            alumniID=poster,
            title=random.choice(job_titles),
            company=random.choice(companies),
            description=f"We are looking for a {random.choice(job_titles)} to join our team.",
            salaryRange=f"${low}k-${high}k",
            location=random.choice(locations),
            expiryDate=expiry,
            status=status,
            testimonials=[],
        )
        jobs.append(job)
    db.session.add_all(jobs)
    db.session.flush()
    job_ids = [j.jobID for j in jobs]

    # Add testimonials for first 30 jobs
    for job in jobs[:30]:
        for _ in range(random.randint(2,3)):
            testimonial = {
                "id": str(uuid4()),
                "alumniID": random.choice(alumni_ids),
                "name": random.choice([a.name for a in alumni_list]),
                "avatar": f"https://ui-avatars.com/api/?name={random.choice(['A','B','C'])}",
                "stars": random.randint(3,5),
                "comment": random.choice(["Great company!", "Amazing culture", "Good salary", "Would recommend"]),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            job.testimonials = (job.testimonials or []) + [testimonial]
            db.session.add(job)

    # ---- 5. Events (40) ----
    events = []
    event_titles = ["Annual Gala", "Tech Symposium", "Career Fair", "Networking Mixer", "Alumni Lecture", "Panel Discussion", "Workshop", "Hackathon", "Charity Run", "Cultural Show", "Sport Day", "Webinar Series", "Industry Meetup", "Startup Pitch", "Book Launch", "Film Screening", "Concert", "Food Festival", "Art Exhibition", "Health Fair"]
    for _ in range(40):
        board = random.choice(boards)
        creator = random.choice(board.memberIDs)
        event_date = random.choice([random_future_date(), random_past_date()])
        if event_date < date.today():
            status = "cancelled"
        else:
            status = random.choice(["active", "pending_vote"])
        event = Event(
            alumniID=creator,
            boardID=board.boardID,
            title=random.choice(event_titles),
            description="Join us for an exciting event!",
            date=event_date,
            time=random_time(),
            location=random.choice(locations),
            maxAttendees=random.randint(20, 200),
            status=status,
        )
        events.append(event)
    db.session.add_all(events)
    db.session.flush()
    event_ids = [e.eventID for e in events]

    # ---- 6. Board Posts (200) ----
    posts = []
    for _ in range(200):
        board = random.choice(boards)
        author = random.choice(board.memberIDs)
        liked_by = random.sample(board.memberIDs, k=random.randint(0, min(10, len(board.memberIDs))))
        comments = []
        for _ in range(random.randint(0, 5)):
            commenter = random.choice(board.memberIDs)
            commenter_name = next((a.name for a in alumni_list if a.alumniID == commenter), "Alumni")
            comments.append({
                "commentID": str(random.randint(10000, 99999)),
                "authorID": commenter,
                "authorName": commenter_name,
                "content": random.choice(["Great post!", "Thanks for sharing!", "Interesting perspective.", "I agree.", "Well said."]),
                "time": random_past_date().isoformat(),
                "avatar": f"https://ui-avatars.com/api/?name={commenter_name}"
            })
        post = BoardPost(
            boardID=board.boardID,
            alumniID=author,
            content=random.choice(["Excited about the upcoming event!", "Looking for job opportunities.", "Let's collaborate!", "Check out this resource.", "Happy to be part of this community."]),
            likesCount=len(liked_by),
            likedBy=liked_by,
            comments=comments
        )
        posts.append(post)
    db.session.add_all(posts)
    db.session.flush()

    # ---- 7. Job Applications (80) ----
    apps = []
    for _ in range(80):
        job = random.choice(jobs)
        possible = [aid for aid in alumni_ids if aid != job.alumniID]
        if not possible:
            continue
        applicant = random.choice(possible)
        status = random.choice(["pending", "approved", "rejected", "withdrawn"])
        app = JobApplication(jobID=job.jobID, alumniID=applicant, status=status)
        apps.append(app)
    db.session.add_all(apps)

    # ---- 8. Event Registrations (100) ----
    regs = []
    seen = set()
    for _ in range(100):
        event = random.choice(events)
        board = db.session.get(CommunityBoard, event.boardID)
        if not board or not board.memberIDs:
            continue
        attendee = random.choice(board.memberIDs)
        key = (event.eventID, attendee)
        if key in seen:
            continue
        seen.add(key)
        reg = EventRegistration(eventID=event.eventID, attendeeID=attendee, status="registered")
        regs.append(reg)
    db.session.add_all(regs)

    # ---- 9. Messages: ensure test users receive 5-10 messages each ----
    msgs = []
    statuses = ["requested", "accepted", "sent", "rejected"]
    # Ensure alice, bob, carol get a handful of messages
    for test_email in ["alice@gmail.com", "bob@gmail.com", "carol@gmail.com"]:
        user = alumni_map.get(test_email)
        if not user:
            continue
        for _ in range(random.randint(5,10)):
            sender = random.choice([a.alumniID for a in alumni_list if a.alumniID != user.alumniID])
            msg = Message(
                senderID=sender,
                receiverID=user.alumniID,
                content=random.choice(["Hi, how are you?", "Let's connect!", "Interested in your experience.", "Can we chat?", "Great profile!"]),
                status=random.choice(statuses),
                attachments=[]
            )
            msgs.append(msg)
    # Fill up additional random messages to reach a sizable corpus
    for _ in range(120):
        sender, receiver = random.sample(alumni_ids, 2)
        msg = Message(
            senderID=sender,
            receiverID=receiver,
            content=random.choice(["Hi, how are you?", "Let's connect!", "Interested in your experience.", "Can we chat?", "Great profile!"]),
            status=random.choice(statuses),
            attachments=[]
        )
        msgs.append(msg)
    db.session.add_all(msgs)

    db.session.commit()
    LOGGER.info("Sample data generation complete: %d alumni, %d boards, %d jobs, %d events, %d posts, %d applications, %d registrations, %d messages",
                len(alumni_list), len(boards), len(jobs), len(events), len(posts), len(apps), len(regs), len(msgs))


def initialize_database(app, create_default_admin=True):
    with app.app_context():
        db.create_all()
        if create_default_admin:
            _create_default_admin()

def _create_default_admin():
    admin_email = "admin@uwi.edu"
    existing = User.query.filter_by(email=admin_email).first()
    if existing:
        return
    admin = Admin(
        email=admin_email,
        password=generate_password_hash("Admin@123"),
        name="System Administrator",
        role="admin",
        adminLevel="super",
        department="Alumni Association",
        isApproved=True,
        notificationPreferences={"email": True, "moderation": True, "reports": True}
    )
    db.session.add(admin)
    db.session.commit()
    LOGGER.info("Default admin created: %s", admin_email)

def reset_database(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        _create_default_admin()
