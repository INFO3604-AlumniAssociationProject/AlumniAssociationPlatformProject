import click
import pytest
import sys
from flask.cli import AppGroup
from flask_migrate import Migrate

from App.main import create_app
from App.database import db
from App.Models import User, Alumni, Admin, Event, Job, BoardPost, CommunityBoard, Message
from App.Controllers.initialize import initialize_database, reset_database, add_sample_data
from App.Controllers.userController import registerUser, loginUser, updateProfile, resetPassword
from App.Controllers.adminControllers import approveUser, moderateContent, generateReport, manageEvent, sendAnnouncement
from App.Controllers.alumniControllers import searchAlumni
from App.Controllers.eventRegistrationControllers import registerForEvent as register_event_ctrl
from App.Controllers.eventController import createEvent, cancelEvent, sendReminders, listEvents, registerEvent, unregisterEvent
from App.Controllers.jobController import createJob, updateJob, closeJob, listJobs, saveJob, showSavedJobs, addTestimonial, deleteTestimonial
from App.Controllers.jobApplicationController import createApplication, viewApplication, listApplications, withdrawApplication, updateApplicationStatus
from App.Controllers.boardPostController import createBoardPost, viewBoardPost, listBoardPosts, updateBoardPost, deleteBoardPost, likePost, addComment, listAllPosts
from App.Controllers.messageController import requestMessage, acceptMessageRequest, rejectMessageRequest, sendMessage, showInbox, showSentMessages, showMessageRequests, blockUser
from App.Controllers.profileController import ensureProfile, updateBio, updateProfilePhoto, viewProfile
from App.Controllers.communityBoardController import createBoard, joinBoard, leaveBoard, listBoardsForUser, viewBoardDetails, createPostInBoard

app = create_app()
migrate = Migrate(app, db)


# ----------------------------------------------------------------------
# Auto‑initialize database on first deploy (e.g., Render)
# ----------------------------------------------------------------------
with app.app_context():
    # First, create all tables if they don't exist
    db.create_all()
    
    # Now check if any users exist; if not, add sample data
    if not User.query.first():
        print("No users found. Adding sample data...")
        # The default admin is already created by initialize_database, but we need
        # to call it to set up the admin user. We pass create_default_admin=True.
        initialize_database(app, create_default_admin=True)
        add_sample_data(app)
        print("Database initialized and sample data added.")


# ---------------------------
# Core database commands
# ---------------------------
@app.cli.command("init", help="Creates and initializes the database with sample data")
def init():
    initialize_database(app, create_default_admin=True)
    add_sample_data(app)
    print("Database initialized and sample data added.")

@app.cli.command("reset", help="Drop all tables, recreate, and add sample data")
def reset():
    reset_database(app)
    add_sample_data(app)
    print("Database reset and sample data added.")

@app.cli.command("seed", help="Add sample data to existing database (idempotent)")
def seed():
    add_sample_data(app)
    print("Sample data added.")

@app.cli.command("run", help="Run the Flask development server")
def run_server():
    app.run(debug=True, host="0.0.0.0", port=5000)


# ---------------------------
# Generic listing commands
# ---------------------------
@app.cli.command("listAlumni", help="Lists all alumni")
def list_alumni():
    alumni = Alumni.query.all()
    for a in alumni:
        print(f"{a.name} ({a.email}) - {a.faculty} {a.graduationYear}")

@app.cli.command("listJobs", help="Lists all jobs")
def list_jobs():
    jobs = Job.query.all()
    for j in jobs:
        print(f"{j.title} at {j.company} - {j.status}")

@app.cli.command("listEvents", help="Lists all events")
def list_events():
    events = Event.query.all()
    for e in events:
        print(f"{e.title} on {e.date} - {e.status}")

@app.cli.command("listBoards", help="Lists all community boards")
def list_boards():
    boards = CommunityBoard.query.all()
    for b in boards:
        print(f"{b.name} (owner: {b.owner.name}) - members: {len(b.memberIDs)}")

@app.cli.command("listPosts", help="Lists all board posts")
def list_posts():
    posts = BoardPost.query.all()
    for p in posts:
        print(f"Post {p.postID}: {p.content[:50]}...")

@app.cli.command("listMessages", help="Lists all messages")
def list_messages():
    msgs = Message.query.all()
    for m in msgs:
        print(f"From {m.sender.email} to {m.receiver.email}: {m.content[:50]}...")


# ---------------------------
# Alumni interactive commands (AppGroup)
# ---------------------------
alumni_cli = AppGroup('alumni', help='Alumni object commands')
app.cli.add_command(alumni_cli)

@alumni_cli.command("list", help="List all alumni")
def list_all_alumni():
    for a in Alumni.query.all():
        print(f"{a.name} ({a.email}) - {a.currentJobTitle} at {a.company}")

@alumni_cli.command("create", help="Create a new alumni")
@click.argument("email", default="alum@example.com")
@click.argument("password", default="pass123")
@click.argument("name", default="New Alum")
@click.argument("grad_year", default=2020)
@click.argument("faculty", default="FST")
@click.argument("degree", default="BSc CS")
@click.argument("job_title", default="")
@click.argument("company", default="")
def create_alumni(email, password, name, grad_year, faculty, degree, job_title, company):
    try:
        result = registerUser(
            email=email, password=password, name=name, role="alumni",
            graduationYear=grad_year, faculty=faculty, degree=degree,
            currentJobTitle=job_title, company=company
        )
        print(f"Created alumni: {result['name']} (requires approval: {result['requiresApproval']})")
    except Exception as e:
        print(f"Error: {e}")

@alumni_cli.command("search", help="Search alumni by name or faculty")
@click.option('--name', '-n', help="Name to search")
@click.option('--faculty', '-f', help="Faculty to filter")
def search_alumni_cmd(name, faculty):
    query = Alumni.query
    if name:
        query = query.filter(Alumni.name.ilike(f"%{name}%"))
    if faculty:
        query = query.filter(Alumni.faculty.ilike(f"%{faculty}%"))
    for a in query.all():
        print(f"{a.name} ({a.email}) - {a.faculty} {a.graduationYear}")


@alumni_cli.command("connect", help="Send a connection message from one alumni to another")
@click.argument("from_id")
@click.argument("to_id")
@click.option('--message', '-m', default='', help='Optional message content')
def connect_cmd(from_id, to_id, message):
    try:
        mid = requestMessage(from_id, to_id, message or None)
        print(f"Connection request created: {mid}")
    except Exception as e:
        print(f"Error: {e}")


@alumni_cli.command("register-event", help="Register an alumni for an event")
@click.argument("alumni_id")
@click.argument("event_id")
def register_event_cmd(alumni_id, event_id):
    try:
        reg = register_event_ctrl(event_id, alumni_id)
        print(f"Registered: {reg}")
    except Exception as e:
        print(f"Error: {e}")


@alumni_cli.command("apply-job", help="Apply an alumni for a job")
@click.argument("alumni_id")
@click.argument("job_id")
def apply_job_cmd(alumni_id, job_id):
    try:
        app_obj = createApplication(alumni_id, job_id)
        app_id = getattr(app_obj, 'applicationID', None) or getattr(app_obj, 'applicationId', None) or str(app_obj)
        print(f"Application submitted: {app_id}")
    except Exception as e:
        print(f"Error: {e}")


# ---------------------------
# Jobs interactive commands
# ---------------------------
jobs_cli = AppGroup('jobs', help='Job commands')
app.cli.add_command(jobs_cli)

@jobs_cli.command("list", help="List all jobs with status")
@click.option('--status', '-s', default='open', help="Filter by status (open, closed, pending)")
def list_jobs_status(status):
    jobs = Job.query.filter_by(status=status).all()
    for j in jobs:
        print(f"{j.title} at {j.company} - {j.location} - expires {j.expiryDate}")

@jobs_cli.command("create", help="Create a new job")
@click.argument("board_id")
@click.argument("title")
@click.argument("company")
@click.argument("description")
@click.argument("expiry_date")
@click.argument("salary_range", default="")
@click.argument("location", default="")
def create_job_cmd(board_id, title, company, description, expiry_date, salary_range, location):
    alumni = Alumni.query.filter_by(isApproved=True).first()
    if not alumni:
        print("No approved alumni found.")
        return
    try:
        job_id = createJob(
            alumni_id=alumni.alumniID, board_id=board_id, title=title, company=company,
            description=description, expiry_date_str=expiry_date, salary_range=salary_range, location=location
        )
        print(f"Job created with ID: {job_id}")
    except Exception as e:
        print(f"Error: {e}")


# ---------------------------
# Events interactive commands
# ---------------------------
events_cli = AppGroup('events', help='Event commands')
app.cli.add_command(events_cli)

@events_cli.command("list", help="List upcoming events")
def list_upcoming_events():
    from datetime import date
    events = Event.query.filter(Event.date >= date.today()).order_by(Event.date.asc()).all()
    for e in events:
        print(f"{e.title} on {e.date} at {e.location}")

@events_cli.command("create", help="Create a new event")
@click.argument("board_id")
@click.argument("title")
@click.argument("description")
@click.argument("date_str")
@click.argument("time_str")
@click.argument("location")
@click.argument("max_attendees", type=int)
def create_event_cmd(board_id, title, description, date_str, time_str, location, max_attendees):
    alumni = Alumni.query.filter_by(isApproved=True).first()
    if not alumni:
        print("No approved alumni found.")
        return
    try:
        event_id = createEvent(
            alumni_id=alumni.alumniID, board_id=board_id, title=title, description=description,
            date_str=date_str, time_str=time_str, location=location, max_attendees=max_attendees
        )
        print(f"Event created with ID: {event_id}")
    except Exception as e:
        print(f"Error: {e}")


# ---------------------------
# Boards interactive commands
# ---------------------------
boards_cli = AppGroup('boards', help='Community board commands')
app.cli.add_command(boards_cli)

@boards_cli.command("list", help="List all boards with member counts")
def list_all_boards():
    boards = CommunityBoard.query.all()
    for b in boards:
        print(f"{b.name} (owner: {b.owner.name}) - members: {len(b.memberIDs)}")

@boards_cli.command("create", help="Create a new board")
@click.argument("name")
@click.argument("description", default="")
def create_board_cmd(name, description):
    alumni = Alumni.query.filter_by(isApproved=True).first()
    if not alumni:
        print("No approved alumni found.")
        return
    board_id = createBoard(alumni.alumniID, name, description)
    print(f"Board created with ID: {board_id}")


# ---------------------------
# Admin interactive commands
# ---------------------------
admin_cli = AppGroup('admin', help='Admin management commands')
app.cli.add_command(admin_cli)

@admin_cli.command("approve-user", help="Approve an alumni user")
@click.argument("user_id")
def approve_user_cmd(user_id):
    try:
        approveUser(user_id)
        print(f"User {user_id} approved")
    except Exception as e:
        print(f"Error: {e}")

@admin_cli.command("moderate", help="Moderate content: job|event|message <id> <action>")
@click.argument("content_type")
@click.argument("content_id")
@click.argument("action")
def moderate_cmd(content_type, content_id, action):
    try:
        moderateContent(content_type, content_id, action)
        print("Moderation applied")
    except Exception as e:
        print(f"Error: {e}")

@admin_cli.command("report", help="Generate a site report summary")
def report_cmd():
    try:
        report = generateReport()
        print(report)
    except Exception as e:
        print(f"Error: {e}")

@admin_cli.command("manage-event", help="Manage event status: cancel|reopen <event_id>")
@click.argument("event_id")
@click.argument("action")
def manage_event_cmd(event_id, action):
    try:
        manageEvent(event_id, action)
        print(f"Event {event_id} action={action} applied")
    except Exception as e:
        print(f"Error: {e}")

@admin_cli.command("announce", help="Send announcement as admin_id 'content'")
@click.argument("admin_id")
@click.argument("content")
def announce_cmd(admin_id, content):
    try:
        count = sendAnnouncement(admin_id, content)
        print(f"Announcement sent to {count} recipients")
    except Exception as e:
        print(f"Error: {e}")


# ---------------------------
# Test commands (optional)
# ---------------------------
test_cli = AppGroup('test', help='Testing commands')
app.cli.add_command(test_cli)

@test_cli.command("all", help="Run all tests")
def run_all_tests():
    sys.exit(pytest.main(["App/Tests"]))

@test_cli.command("unit", help="Run unit tests")
def run_unit_tests():
    sys.exit(pytest.main(["App/Tests/UnitTests.py"]))

@test_cli.command("integration", help="Run integration tests")
def run_integration_tests():
    sys.exit(pytest.main(["App/Tests/IntegrationTests.py"]))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)