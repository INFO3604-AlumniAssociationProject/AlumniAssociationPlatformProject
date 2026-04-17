# File: UnitTests.py

import sys
import os
import unittest
import logging
from datetime import date, time, datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

# Add parent directory to path so 'App' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from App.main import create_app
from App.database import db
from App.Models import (
    User, Alumni, Admin, Event, EventRegistration, Job, JobApplication,
    Message, BoardPost, CommunityBoard, Profile
)

from App.Controllers import (
    userController,
    adminControllers,
    alumniControllers,
    eventController,
    eventRegistrationControllers,
    jobController,
    jobApplicationController,
    boardPostController,
    messageController,
    profileController,
    communityBoardController
)

LOGGER = logging.getLogger(__name__)


class UserModelUnitTests(unittest.TestCase):
    """Tests for User model and its subclasses"""

    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['TESTING'] = True
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testInitUser(self):
        u = User(email="test@uwi.edu", password="hash", name="Test User", role="alumni")
        self.assertEqual(u.email, "test@uwi.edu")
        self.assertEqual(u.name, "Test User")
        self.assertEqual(u.role, "alumni")
        self.assertFalse(u.isApproved)
        self.assertIsNotNone(u.registrationDate)

    def testUserSetPassword(self):
        u = User(email="pwd@test.com", password="old", name="Pwd", role="alumni")
        u.set_password("newsecret")
        self.assertTrue(check_password_hash(u.password, "newsecret"))
        self.assertFalse(check_password_hash(u.password, "old"))

    def testUserCheckPassword(self):
        u = User(email="check@test.com", password=generate_password_hash("secret"), name="Check", role="alumni")
        self.assertTrue(u.check_password("secret"))
        self.assertFalse(u.check_password("wrong"))

    def testUserToDict(self):
        u = User(email="dict@test.com", password="hash", name="Dict User", role="admin", isApproved=True)
        d = u.to_dict()
        self.assertEqual(d["email"], "dict@test.com")
        self.assertEqual(d["name"], "Dict User")
        self.assertEqual(d["role"], "admin")
        self.assertTrue(d["isApproved"])
        self.assertIn("userID", d)

    def testAlumniInit(self):
        a = Alumni(
            email="alum@uwi.edu", password="hash", name="Alum", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        self.assertEqual(a.graduationYear, 2020)
        self.assertEqual(a.faculty, "FST")
        self.assertEqual(a.degree, "CS")
        self.assertEqual(a.currentJobTitle, "")
        self.assertTrue(a.isPublicProfile)

    def testAlumniToDict(self):
        a = Alumni(
            email="alum2@uwi.edu", password="hash", name="Alum2", role="alumni",
            graduationYear=2021, faculty="Law", degree="LLB"
        )
        d = a.to_dict()
        self.assertEqual(d["graduationYear"], 2021)
        self.assertEqual(d["faculty"], "Law")
        self.assertEqual(d["role"], "alumni")

    def testAdminInit(self):
        ad = Admin(
            email="admin@uwi.edu", password="hash", name="Admin", role="admin",
            adminLevel="super", department="IT"
        )
        self.assertEqual(ad.adminLevel, "super")
        self.assertEqual(ad.department, "IT")
        self.assertTrue(ad.isApproved)

    def testEventModel(self):
        e = Event(
            alumniID="alum1", boardID="board1", title="Test Event",
            description="Desc", date=date(2025, 12, 31), time=time(18, 0),
            location="Online", maxAttendees=50
        )
        self.assertEqual(e.title, "Test Event")
        self.assertEqual(e.status, "active")
        self.assertEqual(e.maxAttendees, 50)

    def testJobModel(self):
        j = Job(
            boardID="b1", alumniID="a1", title="Dev", company="Tech",
            description="Code", expiryDate=date(2025, 12, 31)
        )
        self.assertEqual(j.title, "Dev")
        self.assertEqual(j.status, "open")

    def testMessageModel(self):
        m = Message(senderID="s1", receiverID="r1", content="Hello", status="requested")
        self.assertEqual(m.content, "Hello")
        self.assertEqual(m.status, "requested")

    def testBoardPostModel(self):
        bp = BoardPost(boardID="b1", alumniID="a1", content="Post content")
        self.assertEqual(bp.content, "Post content")
        self.assertEqual(bp.likesCount, 0)
        self.assertEqual(bp.likedBy, [])

    def testProfileModel(self):
        p = Profile(alumniID="a1")
        self.assertEqual(p.profileVisibility, "public")
        self.assertTrue(p.showCurrentJob)
        self.assertTrue(p.allowMessages)
        self.assertFalse(p.showEmail)

    # ---------- Negative Tests ----------
    def testUserInvalidEmailFormatNotCheckedInModel(self):
        # Model does not validate email format, but we can still create.
        u = User(email="notanemail", password="hash", name="Bad", role="alumni")
        self.assertEqual(u.email, "notanemail")

    def testUserPasswordNotSetRaisesNoError(self):
        u = User(email="nopass@test.com", password=None, name="NoPass", role="alumni")
        self.assertIsNone(u.password)


class UserControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['TESTING'] = True
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testRegisterAlumniSuccess(self):
        result = userController.registerUser(
            email="newalum@test.com", password="pass123", name="New Alum", role="alumni",
            graduationYear=2022, faculty="Engineering", degree="BSc"
        )
        self.assertEqual(result["email"], "newalum@test.com")
        self.assertTrue(result["requiresApproval"])
        self.assertEqual(result["role"], "alumni")
        user = User.query.filter_by(email="newalum@test.com").first()
        self.assertIsNotNone(user)
        self.assertFalse(user.isApproved)

    def testRegisterAdminSuccess(self):
        result = userController.registerUser(
            email="newadmin@test.com", password="admin123", name="New Admin", role="admin",
            adminLevel="super", department="Alumni"
        )
        self.assertEqual(result["email"], "newadmin@test.com")
        self.assertFalse(result["requiresApproval"])
        admin = Admin.query.filter_by(email="newadmin@test.com").first()
        self.assertIsNotNone(admin)
        self.assertTrue(admin.isApproved)

    def testLoginUserSuccess(self):
        userController.registerUser(
            email="login@test.com", password="secret", name="Login", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        u = User.query.filter_by(email="login@test.com").first()
        u.isApproved = True
        db.session.commit()
        result = userController.loginUser(email="login@test.com", password="secret")
        self.assertIn("token", result)
        self.assertEqual(result["user"]["email"], "login@test.com")

    def testUpdateProfileSuccess(self):
        u = userController.registerUser(
            email="update@test.com", password="p", name="Old", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        uid = u["userID"]
        updated = userController.updateProfile(uid, name="New Name", email="new@test.com")
        self.assertEqual(updated["name"], "New Name")
        self.assertEqual(updated["email"], "new@test.com")
        user = db.session.get(User, uid)
        self.assertEqual(user.name, "New Name")
        self.assertEqual(user.email, "new@test.com")

    def testResetPasswordSuccess(self):
        u = userController.registerUser(
            email="reset@test.com", password="oldpass", name="Reset", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        uid = u["userID"]
        userController.resetPassword(uid, "oldpass", "newpass456")
        user = db.session.get(User, uid)
        self.assertTrue(user.check_password("newpass456"))
        self.assertFalse(user.check_password("oldpass"))

    def testGetNotificationPreferences(self):
        u = userController.registerUser(
            email="prefs@test.com", password="p", name="Prefs", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        prefs = userController.showNotificationPreferences(u["userID"])
        self.assertIsInstance(prefs, dict)
        self.assertTrue(prefs.get("email", False))

    def testUpdateNotificationPreferences(self):
        u = userController.registerUser(
            email="updprefs@test.com", password="p", name="Upd", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        uid = u["userID"]
        newPrefs = userController.updateNotificationPreferences(uid, {"email": False, "events": True})
        self.assertFalse(newPrefs["email"])
        self.assertTrue(newPrefs["events"])

    # ---------- Negative Tests ----------
    def testRegisterDuplicateEmailFails(self):
        userController.registerUser(
            email="dup@test.com", password="p1", name="First", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        with self.assertRaises(ValueError) as ctx:
            userController.registerUser(
                email="dup@test.com", password="p2", name="Second", role="alumni",
                graduationYear=2021, faculty="Law", degree="LLB"
            )
        self.assertIn("Email already registered", str(ctx.exception))

    def testRegisterMissingAlumniFieldsFails(self):
        with self.assertRaises(ValueError) as ctx:
            userController.registerUser(
                email="bad@test.com", password="p", name="Bad", role="alumni"
            )
        self.assertIn("Missing alumni fields", str(ctx.exception))

    def testRegisterInvalidRoleFails(self):
        with self.assertRaises(ValueError) as ctx:
            userController.registerUser(
                email="bad@test.com", password="p", name="Bad", role="student"
            )
        self.assertIn("Role must be", str(ctx.exception))

    def testLoginUnapprovedFails(self):
        userController.registerUser(
            email="pending@test.com", password="secret", name="Pending", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        with self.assertRaises(ValueError) as ctx:
            userController.loginUser(email="pending@test.com", password="secret")
        self.assertIn("pending admin approval", str(ctx.exception))

    def testLoginWrongPasswordFails(self):
        userController.registerUser(
            email="wrong@test.com", password="correct", name="Wrong", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        u = User.query.filter_by(email="wrong@test.com").first()
        u.isApproved = True
        db.session.commit()
        with self.assertRaises(ValueError) as ctx:
            userController.loginUser(email="wrong@test.com", password="incorrect")
        self.assertIn("Invalid email or password", str(ctx.exception))

    def testUpdateProfileDuplicateEmailFails(self):
        userController.registerUser(
            email="first@test.com", password="p", name="First", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        u2 = userController.registerUser(
            email="second@test.com", password="p", name="Second", role="alumni",
            graduationYear=2021, faculty="Law", degree="LLB"
        )
        with self.assertRaises(ValueError) as ctx:
            userController.updateProfile(u2["userID"], email="first@test.com")
        self.assertIn("Email already in use", str(ctx.exception))

    def testResetPasswordWrongOldFails(self):
        u = userController.registerUser(
            email="resetwrong@test.com", password="correct", name="Reset", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        uid = u["userID"]
        with self.assertRaises(ValueError) as ctx:
            userController.resetPassword(uid, "wrong", "newpass")
        self.assertIn("Current password is incorrect", str(ctx.exception))

    def testResetPasswordTooShortFails(self):
        u = userController.registerUser(
            email="short@test.com", password="oldpass", name="Short", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        uid = u["userID"]
        with self.assertRaises(ValueError) as ctx:
            userController.resetPassword(uid, "oldpass", "short")
        self.assertIn("at least 8 characters", str(ctx.exception))


class AdminControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.admin = Admin(
            email="admin@test.com", password="hash", name="Test Admin",
            role="admin", adminLevel="super", department="IT", isApproved=True
        )
        db.session.add(self.admin)
        db.session.commit()
        self.admin_id = self.admin.userID

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testApproveUserSuccess(self):
        alum = Alumni(
            email="pending@test.com", password="hash", name="Pending",
            role="alumni", graduationYear=2020, faculty="FST", degree="CS",
            isApproved=False
        )
        db.session.add(alum)
        db.session.commit()
        adminControllers.approveUser(alum.userID)
        self.assertTrue(alum.isApproved)

    def testGenerateReport(self):
        alum1 = Alumni(email="a1@test.com", password="h", name="A1", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        alum2 = Alumni(email="a2@test.com", password="h", name="A2", role="alumni",
                       graduationYear=2021, faculty="Law", degree="LLB", isApproved=False)
        db.session.add_all([alum1, alum2])
        db.session.commit()
        report = adminControllers.generateReport()
        self.assertEqual(report["users"]["total"], 3)  # + admin
        self.assertEqual(report["users"]["pendingApproval"], 1)
        self.assertEqual(report["users"]["alumni"], 2)

    def testSendAnnouncement(self):
        for i in range(3):
            a = Alumni(email=f"a{i}@test.com", password="h", name=f"A{i}", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
            db.session.add(a)
        db.session.commit()
        count = adminControllers.sendAnnouncement(self.admin_id, "Test announcement")
        self.assertEqual(count, 3)
        msgs = Message.query.filter_by(senderID=self.admin_id).all()
        self.assertEqual(len(msgs), 3)
        for msg in msgs:
            self.assertEqual(msg.content, "Test announcement")
            self.assertEqual(msg.status, "sent")

    # ---------- Negative Tests ----------
    def testApproveNonExistentFails(self):
        with self.assertRaises(ValueError):
            adminControllers.approveUser("nonexistent")

    def testApproveNonAlumniFails(self):
        with self.assertRaises(ValueError):
            adminControllers.approveUser(self.admin_id)


class AlumniControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum1 = Alumni(email="alum1@test.com", password="h", name="Alum1", role="alumni",
                            graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        self.alum2 = Alumni(email="alum2@test.com", password="h", name="Alum2", role="alumni",
                            graduationYear=2021, faculty="Law", degree="LLB", isApproved=True)
        db.session.add_all([self.alum1, self.alum2])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testRequestMessageSuccess(self):
        msg_id = messageController.requestMessage(self.alum1.userID, self.alum2.userID, "Hello")
        self.assertIsNotNone(msg_id)
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.senderID, self.alum1.userID)
        self.assertEqual(msg.receiverID, self.alum2.userID)
        self.assertEqual(msg.status, "requested")

    def testSearchAlumniByName(self):
        results = alumniControllers.searchAlumni(query="Alum1")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Alum1")

    def testSearchAlumniByFaculty(self):
        results = alumniControllers.searchAlumni(faculty="Law")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Alum2")

    def testSearchAlumniEmptyReturnsAllPublic(self):
        results = alumniControllers.searchAlumni()
        self.assertEqual(len(results), 2)

    # ---------- Negative Tests ----------
    def testRequestMessageToSelfFails(self):
        with self.assertRaises(ValueError) as ctx:
            messageController.requestMessage(self.alum1.userID, self.alum1.userID)
        self.assertIn("Cannot connect to yourself", str(ctx.exception))

    def testRequestMessageToNonexistentFails(self):
        with self.assertRaises(ValueError) as ctx:
            messageController.requestMessage(self.alum1.userID, "nonexistent")
        self.assertIn("Target alumni not found", str(ctx.exception))


class EventControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="eventuser@test.com", password="h", name="EventUser", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()
        self.board = CommunityBoard(alumniID=self.alum.userID, name="Test Board")
        db.session.add(self.board)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testCreateEventSuccess(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Test Event", description="Desc", date_str="2025-12-31",
            time_str="18:00", location="Hall", max_attendees=50
        )
        event = db.session.get(Event, event_id)
        self.assertIsNotNone(event)
        self.assertEqual(event.title, "Test Event")
        self.assertEqual(event.status, "active")

    def testRegisterAttendeeSuccess(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Reg Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        reg_id = eventRegistrationControllers.registerForEvent(event_id, self.alum.userID)
        self.assertIsNotNone(reg_id)
        reg = db.session.get(EventRegistration, reg_id)
        self.assertEqual(reg.status, "registered")

    def testCancelEventAsCreator(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Cancel Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        eventController.cancelEvent(event_id, self.alum.userID, is_admin=False)
        event = db.session.get(Event, event_id)
        self.assertEqual(event.status, "cancelled")

    def testListEvents(self):
        eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Event1", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        events = eventController.listEvents()
        self.assertEqual(len(events), 1)

    def testRegisterAndUnregisterEvent(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Toggle Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        result = eventController.registerEvent(event_id, self.alum.userID)
        self.assertTrue(result["registered"])
        result = eventController.unregisterEvent(event_id, self.alum.userID)
        self.assertFalse(result["registered"])

    # ---------- Negative Tests ----------
    def testCreateEventInvalidDateFails(self):
        with self.assertRaises(ValueError):
            eventController.createEvent(
                alumni_id=self.alum.userID, board_id=self.board.boardID,
                title="Bad", description="", date_str="invalid", time_str="18:00",
                location="", max_attendees=10
            )

    def testRegisterAttendeeAlreadyRegisteredFails(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Dup Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        eventRegistrationControllers.registerForEvent(event_id, self.alum.userID)
        with self.assertRaises(ValueError) as ctx:
            eventRegistrationControllers.registerForEvent(event_id, self.alum.userID)
        self.assertIn("already registered", str(ctx.exception).lower())

    def testCancelEventAsNonCreatorFails(self):
        other = Alumni(email="other@test.com", password="h", name="Other", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        event_id = eventController.createEvent(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Cancel Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        with self.assertRaises(PermissionError):
            eventController.cancelEvent(event_id, other.userID, is_admin=False)


class JobControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="jobuser@test.com", password="h", name="JobUser", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()
        self.board = CommunityBoard(alumniID=self.alum.userID, name="Job Board")
        db.session.add(self.board)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testCreateJobSuccess(self):
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Developer", company="Tech", description="Code",
            expiry_date_str="2025-12-31"
        )
        job = db.session.get(Job, job_id)
        self.assertEqual(job.title, "Developer")
        self.assertEqual(job.status, "open")

    def testUpdateJobAsOwner(self):
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Old", company="OldCo", description="", expiry_date_str="2025-12-31"
        )
        jobController.updateJob(job_id, self.alum.userID, is_admin=False, title="New Title", company="NewCo")
        job = db.session.get(Job, job_id)
        self.assertEqual(job.title, "New Title")
        self.assertEqual(job.company, "NewCo")

    def testCloseJob(self):
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Close Me", company="Co", description="", expiry_date_str="2025-12-31"
        )
        jobController.closeJob(job_id, self.alum.userID, is_admin=False)
        job = db.session.get(Job, job_id)
        self.assertEqual(job.status, "closed")

    def testListJobs(self):
        jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Job1", company="C1", description="", expiry_date_str="2025-12-31"
        )
        jobs = jobController.listJobs()
        self.assertEqual(len(jobs), 1)

    def testSaveAndGetSavedJobs(self):
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Save Job", company="Co", description="", expiry_date_str="2025-12-31"
        )
        save_result = jobController.saveJob(self.alum.userID, job_id)
        self.assertTrue(save_result["saved"])
        saved_ids = jobController.showSavedJobs(self.alum.userID)
        self.assertIn(job_id, saved_ids)
        # toggle off
        save_result = jobController.saveJob(self.alum.userID, job_id)
        self.assertFalse(save_result["saved"])
        self.assertNotIn(job_id, jobController.showSavedJobs(self.alum.userID))

    def testAddAndDeleteTestimonial(self):
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Testimonial Job", company="Co", description="", expiry_date_str="2025-12-31"
        )
        testimonial = jobController.addTestimonial(job_id, self.alum.userID, "Author", "avatar", 5, "Great place")
        self.assertEqual(testimonial["stars"], 5)
        with self.assertRaises(ValueError):
            jobController.addTestimonial(job_id, self.alum.userID, "Author", "avatar", 4, "Duplicate")
        jobController.deleteTestimonial(job_id, testimonial["id"], is_admin=True)
        job = db.session.get(Job, job_id)
        self.assertEqual(job.testimonials, [])

    # ---------- Negative Tests ----------
    def testCreateJobInvalidExpiryFails(self):
        with self.assertRaises(ValueError):
            jobController.createJob(
                alumni_id=self.alum.userID, board_id=self.board.boardID,
                title="Dev", company="Tech", description="Code",
                expiry_date_str="invalid"
            )

    def testUpdateJobAsNonOwnerFails(self):
        other = Alumni(email="otherjob@test.com", password="h", name="Other", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        job_id = jobController.createJob(
            alumni_id=self.alum.userID, board_id=self.board.boardID,
            title="Original", company="Co", description="", expiry_date_str="2025-12-31"
        )
        with self.assertRaises(PermissionError):
            jobController.updateJob(job_id, other.userID, is_admin=False, title="Hacked")


class JobApplicationControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="appuser@test.com", password="h", name="AppUser", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()
        self.board = CommunityBoard(alumniID=self.alum.userID, name="Job Board")
        db.session.add(self.board)
        db.session.commit()
        self.job = Job(
            boardID=self.board.boardID, alumniID=self.alum.userID,
            title="Test Job", company="Co", description="Desc",
            expiryDate=date(2025, 12, 31), status="open"
        )
        db.session.add(self.job)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testCreateApplicationSuccess(self):
        app_obj = jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        self.assertIsNotNone(app_obj)
        self.assertEqual(app_obj.status, "pending")

    def testViewApplicationAsOwner(self):
        app = jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        fetched = jobApplicationController.viewApplication(app.applicationID, self.alum.userID, is_admin=False)
        self.assertEqual(fetched.applicationID, app.applicationID)

    def testWithdrawApplication(self):
        app = jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        withdrawn = jobApplicationController.withdrawApplication(app.applicationID, self.alum.userID)
        self.assertEqual(withdrawn.status, "withdrawn")

    def testUpdateApplicationStatusAsAdmin(self):
        app = jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        updated = jobApplicationController.updateApplicationStatus(app.applicationID, "approved", is_admin=True)
        self.assertEqual(updated.status, "approved")

    # ---------- Negative Tests ----------
    def testCreateApplicationAlreadyExistsFails(self):
        jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        with self.assertRaises(ValueError) as ctx:
            jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        self.assertIn("already applied", str(ctx.exception))

    def testViewApplicationAsNonOwnerFails(self):
        other = Alumni(email="other@test.com", password="h", name="Other", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        app = jobApplicationController.createApplication(self.alum.userID, self.job.jobID)
        with self.assertRaises(PermissionError):
            jobApplicationController.viewApplication(app.applicationID, other.userID, is_admin=False)


class BoardPostControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="postuser@test.com", password="h", name="PostUser", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()
        self.board = CommunityBoard(alumniID=self.alum.userID, name="Board", memberIDs=[self.alum.userID])
        db.session.add(self.board)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testCreateBoardPostSuccess(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Hello world")
        self.assertEqual(post.content, "Hello world")
        self.assertEqual(post.likesCount, 0)

    def testViewBoardPost(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Content")
        fetched = boardPostController.viewBoardPost(post.postID)
        self.assertEqual(fetched.postID, post.postID)

    def testUpdateBoardPostAsAuthor(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Original")
        updated = boardPostController.updateBoardPost(post.postID, self.alum.userID, "Updated", is_admin=False)
        self.assertEqual(updated.content, "Updated")

    def testDeleteBoardPostAsAuthor(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "ToDelete")
        boardPostController.deleteBoardPost(post.postID, self.alum.userID, is_admin=False)
        self.assertIsNone(db.session.get(BoardPost, post.postID))

    def testToggleLike(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Like me")
        result = boardPostController.likePost(post.postID, self.alum.userID)
        self.assertTrue(result["liked"])
        self.assertEqual(result["likesCount"], 1)
        result2 = boardPostController.likePost(post.postID, self.alum.userID)
        self.assertFalse(result2["liked"])
        self.assertEqual(result2["likesCount"], 0)

    def testAddComment(self):
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Post")
        comment = boardPostController.addComment(post.postID, self.alum.userID, "Author Name", "Nice post")
        self.assertEqual(comment["content"], "Nice post")
        post_refresh = db.session.get(BoardPost, post.postID)
        self.assertEqual(len(post_refresh.comments), 1)

    def testListAllPosts(self):
        boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Hello world")
        posts = boardPostController.listAllPosts()
        self.assertGreaterEqual(len(posts), 1)
        first = posts[0]
        self.assertIn("authorName", first)
        self.assertIn("commentsCount", first)

    # ---------- Negative Tests ----------
    def testCreateBoardPostEmptyContentFails(self):
        with self.assertRaises(ValueError):
            boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "")

    def testUpdateBoardPostAsNonAuthorFails(self):
        other = Alumni(email="otherpost@test.com", password="h", name="Other", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        post = boardPostController.createBoardPost(self.alum.userID, self.board.boardID, "Original")
        with self.assertRaises(PermissionError):
            boardPostController.updateBoardPost(post.postID, other.userID, "Hacked", is_admin=False)


class MessageControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.sender = Alumni(email="sender@test.com", password="h", name="Sender", role="alumni",
                             graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        self.receiver = Alumni(email="receiver@test.com", password="h", name="Receiver", role="alumni",
                               graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add_all([self.sender, self.receiver])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testRequestMessage(self):
        msg_id = messageController.requestMessage(self.sender.userID, self.receiver.userID, "Hi")
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "requested")
        self.assertEqual(msg.content, "Hi")

    def testAcceptMessageRequest(self):
        msg_id = messageController.requestMessage(self.sender.userID, self.receiver.userID, "Hi")
        messageController.acceptMessageRequest(msg_id, self.receiver.userID)
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "accepted")

    def testRejectMessageRequest(self):
        msg_id = messageController.requestMessage(self.sender.userID, self.receiver.userID, "Hi")
        messageController.rejectMessageRequest(msg_id, self.receiver.userID)
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "rejected")

    def testSendDirectMessage(self):
        msg_id = messageController.sendMessage(self.sender.userID, self.receiver.userID, "Direct")
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "sent")

    def testGetInbox(self):
        messageController.sendMessage(self.sender.userID, self.receiver.userID, "Hello")
        inbox = messageController.showInbox(self.receiver.userID)
        self.assertEqual(len(inbox), 1)
        self.assertEqual(inbox[0].content, "Hello")

    def testGetMessageRequests(self):
        messageController.requestMessage(self.sender.userID, self.receiver.userID, "Hi")
        requests = messageController.showMessageRequests(self.receiver.userID)
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0].status, "requested")

    # ---------- Negative Tests ----------
    def testRequestMessageToBlockedUserFails(self):
        # Block receiver
        messageController.blockUser(self.receiver.userID, self.sender.userID)
        with self.assertRaises(PermissionError):
            messageController.requestMessage(self.sender.userID, self.receiver.userID, "Hi")


class ProfileControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="profile@test.com", password="h", name="ProfileUser", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testEnsureProfile(self):
        prof = profileController.ensureProfile(self.alum.userID)
        self.assertIsNotNone(prof)
        self.assertEqual(prof.alumniID, self.alum.userID)

    def testUpdateBio(self):
        prof = profileController.updateBio(self.alum.userID, "My bio", contact_info=["email@test.com"])
        self.assertEqual(prof.bio, "My bio")
        self.assertEqual(prof.contactInfo, ["email@test.com"])

    def testUpdateProfilePhoto(self):
        prof = profileController.updateProfilePhoto(self.alum.userID, "https://example.com/photo.jpg")
        self.assertEqual(prof.profilePicture, "https://example.com/photo.jpg")

    def testViewProfile(self):
        profileController.updateBio(self.alum.userID, "Test bio")
        prof_dict = profileController.viewProfile(self.alum.userID)
        self.assertEqual(prof_dict["bio"], "Test bio")

    # ---------- Negative Tests ----------
    def testUpdateProfilePhotoEmptyUrlFails(self):
        with self.assertRaises(ValueError):
            profileController.updateProfilePhoto(self.alum.userID, "")


class CommunityBoardControllerUnitTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.alum = Alumni(email="boardowner@test.com", password="h", name="Owner", role="alumni",
                           graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(self.alum)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testCreateBoard(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Test Board", "Description")
        board = db.session.get(CommunityBoard, board_id)
        self.assertEqual(board.name, "Test Board")
        self.assertEqual(board.alumniID, self.alum.userID)

    def testListBoardsForUser(self):
        communityBoardController.createBoard(self.alum.userID, "Board1", "")
        communityBoardController.createBoard(self.alum.userID, "Board2", "")
        boards = communityBoardController.listBoardsForUser(self.alum.userID)
        self.assertEqual(len(boards), 2)

    def testViewBoardDetails(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Details Board", "")
        details = communityBoardController.viewBoardDetails(board_id, self.alum.userID)
        self.assertEqual(details["board"].name, "Details Board")

    def testCreatePostInBoard(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Post Board", "")
        post_id = communityBoardController.createPostInBoard(board_id, self.alum.userID, "Post content")
        post = db.session.get(BoardPost, post_id)
        self.assertEqual(post.content, "Post content")

    def testGetBoardMembers(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Members Board", "")
        members = communityBoardController.listBoardMembers(board_id)
        self.assertGreaterEqual(len(members), 1)
        self.assertTrue(any(m["isAdmin"] for m in members))

    def testJoinAndLeaveBoard(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Join Board", "")
        other = Alumni(email="joiner@test.com", password="h", name="Joiner", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        communityBoardController.joinBoard(other.userID, board_id)
        members = communityBoardController.listBoardMembers(board_id)
        self.assertTrue(any(m["userID"] == other.userID for m in members))
        communityBoardController.leaveBoard(other.userID, board_id)
        members = communityBoardController.listBoardMembers(board_id)
        self.assertFalse(any(m["userID"] == other.userID for m in members))

    # ---------- Negative Tests ----------
    def testCreateBoardMissingNameFails(self):
        with self.assertRaises(ValueError):
            communityBoardController.createBoard(self.alum.userID, "", "No name")

    def testJoinBoardAlreadyMemberFails(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Join Board", "")
        with self.assertRaises(ValueError):
            communityBoardController.joinBoard(self.alum.userID, board_id)  # owner already member

    def testLeaveBoardAsOwnerFails(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Owner Board", "")
        with self.assertRaises(ValueError):
            communityBoardController.leaveBoard(self.alum.userID, board_id)

    def testLeaveBoardNonMemberFails(self):
        board_id = communityBoardController.createBoard(self.alum.userID, "Leave Board", "")
        other = Alumni(email="nonmember@test.com", password="h", name="NonMember", role="alumni",
                       graduationYear=2020, faculty="FST", degree="CS", isApproved=True)
        db.session.add(other)
        db.session.commit()
        with self.assertRaises(ValueError):
            communityBoardController.leaveBoard(other.userID, board_id)