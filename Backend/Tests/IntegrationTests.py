import sys
import os
import unittest
from datetime import date, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from App.main import create_app
from App.database import db
from App.Models import User, Alumni, Admin, Event, Job, JobApplication, Message, CommunityBoard, EventRegistration
from App.Controllers import (
    userController,
    adminControllers,
    alumniControllers,
    eventController,
    eventRegistrationControllers,
    jobController,
    jobApplicationController,
    messageController,
    boardPostController,
    profileController,
    communityBoardController
)


class UsersIntegrationTests(unittest.TestCase):
    """Test full workflows combining multiple controllers"""

    def setUp(self):
        self.app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'TESTING': True})
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['TESTING'] = True
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        # Create admin
        self.admin = userController.registerUser(
            email="admin@system.com", password="admin123", name="System Admin", role="admin",
            adminLevel="super", department="IT"
        )
        self.admin_id = self.admin["userID"]
        # Create two alumni
        self.alum1 = userController.registerUser(
            email="alice@test.com", password="pass", name="Alice", role="alumni",
            graduationYear=2020, faculty="FST", degree="CS"
        )
        self.alum1_id = self.alum1["userID"]
        adminControllers.approveUser(self.alum1_id)
        self.alum2 = userController.registerUser(
            email="bob@test.com", password="pass", name="Bob", role="alumni",
            graduationYear=2021, faculty="Law", degree="LLB"
        )
        self.alum2_id = self.alum2["userID"]
        adminControllers.approveUser(self.alum2_id)
        # Create a community board owned by alum1
        self.board_id = communityBoardController.createBoard(self.alum1_id, "CS Alumni", "For CS grads")

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # ---------- Positive Tests ----------
    def testFullEventWorkflow(self):
        # Create event
        event_id = eventController.createEvent(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Tech Talk", description="AI", date_str="2025-12-31",
            time_str="18:00", location="Online", max_attendees=10
        )
        # Alumni2 registers
        reg_id = eventRegistrationControllers.registerForEvent(event_id, self.alum2_id)
        self.assertIsNotNone(reg_id)
        reg = db.session.get(EventRegistration, reg_id)
        self.assertEqual(reg.status, "registered")
        # Cancel event as creator
        eventController.cancelEvent(event_id, self.alum1_id, is_admin=False)
        event = db.session.get(Event, event_id)
        self.assertEqual(event.status, "cancelled")

    def testFullJobApplicationWorkflow(self):
        # Create job
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Software Engineer", company="TechCorp",
            description="Python dev", expiry_date_str="2025-12-31"
        )
        # Alumni2 applies
        app = jobApplicationController.createApplication(self.alum2_id, job_id)
        self.assertEqual(app.status, "pending")
        # Admin approves application
        jobApplicationController.updateApplicationStatus(app.applicationID, "approved", is_admin=True)
        updated = jobApplicationController.viewApplication(app.applicationID, self.alum2_id, is_admin=False)
        self.assertEqual(updated.status, "approved")
        # Admin closes job
        jobController.closeJob(job_id, self.admin_id, is_admin=True)
        job = db.session.get(Job, job_id)
        self.assertEqual(job.status, "closed")

    def testFullMessagingWorkflow(self):
        # Alumni1 requests connection to Alumni2
        msg_id = messageController.requestMessage(self.alum1_id, self.alum2_id, "Let's connect")
        # Alumni2 accepts
        messageController.acceptMessageRequest(msg_id, self.alum2_id)
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "accepted")
        # Alumni1 sends direct message
        direct_id = messageController.sendMessage(self.alum1_id, self.alum2_id, "Thanks for connecting")
        direct = db.session.get(Message, direct_id)
        self.assertEqual(direct.status, "sent")
        # Check inbox of Alumni2
        inbox = messageController.showInbox(self.alum2_id)
        self.assertGreaterEqual(len(inbox), 2)

    def testFullBoardPostInteraction(self):
        # Alumni1 creates a post
        post = boardPostController.createBoardPost(self.alum1_id, self.board_id, "Hello community")
        # Alumni2 likes the post
        result = boardPostController.likePost(post.postID, self.alum2_id)
        self.assertTrue(result["liked"])
        # Alumni2 comments
        comment = boardPostController.addComment(post.postID, self.alum2_id, "Bob", "Great post!")
        self.assertEqual(comment["content"], "Great post!")
        # Alumni1 updates post
        updated = boardPostController.updateBoardPost(post.postID, self.alum1_id, "Updated content", is_admin=False)
        self.assertEqual(updated.content, "Updated content")
        # Alumni2 tries to delete (should fail)
        with self.assertRaises(PermissionError):
            boardPostController.deleteBoardPost(post.postID, self.alum2_id, is_admin=False)
        # Alumni1 deletes
        boardPostController.deleteBoardPost(post.postID, self.alum1_id, is_admin=False)
        self.assertIsNone(boardPostController.viewBoardPost(post.postID))

    def testAdminAnnouncementAndModeration(self):
        # Admin sends announcement
        count = adminControllers.sendAnnouncement(self.admin_id, "System maintenance tonight")
        self.assertEqual(count, 2)  # two approved alumni
        # Admin moderates a job (create job first)
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Inappropriate", company="BadCo",
            description="Spam", expiry_date_str="2025-12-31"
        )
        adminControllers.moderateContent("job", job_id, "hide")
        job = db.session.get(Job, job_id)
        self.assertEqual(job.status, "hidden")
        # Admin generates report
        report = adminControllers.generateReport()
        self.assertEqual(report["users"]["total"], 3)  # admin + 2 alumni
        self.assertEqual(report["jobs"]["total"], 1)
        self.assertEqual(report["jobs"]["open"], 0)  # hidden not open

    def testProfileUpdateAndVisibility(self):
        # Alumni1 updates bio and photo
        profileController.updateBio(self.alum1_id, "Software engineer", contact_info=["alice@work.com"])
        profileController.updateProfilePhoto(self.alum1_id, "https://cdn.com/alice.jpg")
        # Alumni2 views Alumni1's public profile
        prof = profileController.viewProfile(self.alum1_id)
        self.assertEqual(prof["bio"], "Software engineer")
        self.assertEqual(prof["profilePicture"], "https://cdn.com/alice.jpg")
        # Alumni1 updates email via userController
        userController.updateProfile(self.alum1_id, email="alice.new@test.com")
        user = db.session.get(User, self.alum1_id)
        self.assertEqual(user.email, "alice.new@test.com")

    def testAlumniSearchAndConnection(self):
        # Search for alumni by name
        results = alumniControllers.searchAlumni(query="Alice")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Alice")
        # Search by faculty
        results = alumniControllers.searchAlumni(faculty="Law")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Bob")
        # Send connection request
        msg_id = messageController.requestMessage(self.alum2_id, self.alum1_id, "Hi Alice")
        msg = db.session.get(Message, msg_id)
        self.assertEqual(msg.status, "requested")
        # Accept request
        messageController.acceptMessageRequest(msg_id, self.alum1_id)
        self.assertEqual(msg.status, "accepted")

    def testEventRegistrationCancellationByUser(self):
        # Create event with max 1 attendee
        event_id = eventController.createEvent(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Exclusive", description="", date_str="2025-12-31",
            time_str="18:00", location="Room", max_attendees=1
        )
        # Alumni2 registers
        reg_id = eventRegistrationControllers.registerForEvent(event_id, self.alum2_id)
        # Alumni2 cancels
        eventRegistrationControllers.cancelRegistration(reg_id, self.alum2_id, is_admin=False)
        reg = db.session.get(EventRegistration, reg_id)
        self.assertEqual(reg.status, "cancelled")
        # Now Alumni1 can register
        reg2_id = eventRegistrationControllers.registerForEvent(event_id, self.alum1_id)
        self.assertIsNotNone(reg2_id)

    def testCreateCommunityAndJoin(self):
        # Alumni2 creates a new community board
        new_board_id = communityBoardController.createBoard(self.alum2_id, "Law Network", "For legal professionals")
        # Alumni1 joins
        communityBoardController.joinBoard(self.alum1_id, new_board_id)
        # Verify membership by checking members list
        members = communityBoardController.listBoardMembers(new_board_id)
        self.assertTrue(any(m["userID"] == self.alum1_id for m in members))
        # Alumni1 leaves
        communityBoardController.leaveBoard(self.alum1_id, new_board_id)
        members = communityBoardController.listBoardMembers(new_board_id)
        self.assertFalse(any(m["userID"] == self.alum1_id for m in members))

    def testSaveJobWorkflow(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Platform Engineer", company="CloudCo",
            description="Maintain platform", expiry_date_str="2025-12-31"
        )
        save_result = jobController.saveJob(self.alum2_id, job_id)
        self.assertTrue(save_result["saved"])
        saved_ids = jobController.showSavedJobs(self.alum2_id)
        self.assertIn(job_id, saved_ids)

    def testTestimonialWorkflow(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="QA Engineer", company="QualityCorp",
            description="Testing", expiry_date_str="2025-12-31"
        )
        testimonial = jobController.addTestimonial(job_id, self.alum2_id, "Bob", "avatar", 5, "Great job!")
        job = db.session.get(Job, job_id)
        self.assertEqual(len(job.testimonials), 1)
        jobController.deleteTestimonial(job_id, testimonial["id"], is_admin=True)
        job = db.session.get(Job, job_id)
        self.assertEqual(len(job.testimonials or []), 0)

    def testEventRegistrationWorkflow(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Hackathon", description="24h build", date_str="2025-12-31",
            time_str="09:00", location="Campus", max_attendees=20
        )
        result = eventController.registerEvent(event_id, self.alum2_id)
        self.assertTrue(result["registered"])
        registered = eventController.listRegisteredEvents(self.alum2_id)
        self.assertIn(event_id, registered)

    def testBoardJoinCountsMembers(self):
        board_id = communityBoardController.createBoard(self.alum2_id, "Data Board", "Data discussions")
        pre_members = communityBoardController.listBoardMembers(board_id)
        communityBoardController.joinBoard(self.alum1_id, board_id)
        post_members = communityBoardController.listBoardMembers(board_id)
        self.assertGreater(len(post_members), len(pre_members))

    def testAdminApprovesApplication(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Ops Engineer", company="OpsCo",
            description="Ops", expiry_date_str="2025-12-31"
        )
        app_obj = jobApplicationController.createApplication(self.alum2_id, job_id)
        jobApplicationController.updateApplicationStatus(app_obj.applicationID, "approved", is_admin=True)
        updated = db.session.get(JobApplication, app_obj.applicationID)
        self.assertEqual(updated.status, "approved")

    # ---------- Negative Tests ----------
    def testApplyForAlreadyAppliedJobFails(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Duplicate Apply", company="TestCo",
            description="Test", expiry_date_str="2025-12-31"
        )
        jobApplicationController.createApplication(self.alum2_id, job_id)
        with self.assertRaises(ValueError) as ctx:
            jobApplicationController.createApplication(self.alum2_id, job_id)
        self.assertIn("already applied", str(ctx.exception))

    def testRegisterForFullEventFails(self):
        # Create event with max 1 attendee
        event_id = eventController.createEvent(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Full Event", description="", date_str="2025-12-31",
            time_str="18:00", location="Room", max_attendees=1
        )
        eventRegistrationControllers.registerForEvent(event_id, self.alum2_id)
        with self.assertRaises(ValueError) as ctx:
            eventRegistrationControllers.registerForEvent(event_id, self.alum1_id)
        self.assertIn("full", str(ctx.exception).lower())

    def testConnectToAlreadyConnectedFails(self):
        messageController.requestMessage(self.alum1_id, self.alum2_id, "Hello")
        with self.assertRaises(ValueError) as ctx:
            messageController.requestMessage(self.alum1_id, self.alum2_id, "Again")
        self.assertIn("already sent", str(ctx.exception))

    def testDeleteTestimonialAsNonAdminFails(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Testimonial Job", company="Co",
            description="", expiry_date_str="2025-12-31"
        )
        testimonial = jobController.addTestimonial(job_id, self.alum2_id, "Bob", "avatar", 5, "Great!")
        with self.assertRaises(PermissionError):
            jobController.deleteTestimonial(job_id, testimonial["id"], is_admin=False)

    def testLeaveBoardNotMemberFails(self):
        board_id = communityBoardController.createBoard(self.alum1_id, "Test Board", "")
        with self.assertRaises(ValueError):
            communityBoardController.leaveBoard(self.alum2_id, board_id)

    def testUpdateJobAsNonOwnerFails(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Hack Attempt", company="Co", description="", expiry_date_str="2025-12-31"
        )
        with self.assertRaises(PermissionError):
            jobController.updateJob(job_id, self.alum2_id, is_admin=False, title="Hacked")

    def testCancelEventAsNonCreatorFails(self):
        event_id = eventController.createEvent(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="My Event", description="", date_str="2025-12-31",
            time_str="18:00", location="", max_attendees=5
        )
        with self.assertRaises(PermissionError):
            eventController.cancelEvent(event_id, self.alum2_id, is_admin=False)

    def testMessageBlockPreventsCommunication(self):
        # Alumni1 blocks Alumni2
        messageController.blockUser(self.alum1_id, self.alum2_id)
        # Alumni2 tries to send request, should fail
        with self.assertRaises(PermissionError):
            messageController.requestMessage(self.alum2_id, self.alum1_id, "Hi")
        # Alumni1 tries to send to Alumni2 (should also fail)
        with self.assertRaises(PermissionError):
            messageController.sendMessage(self.alum1_id, self.alum2_id, "Hi")

    def testApplyForClosedJobFails(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Closed Job", company="Co", description="", expiry_date_str="2025-12-31"
        )
        jobController.closeJob(job_id, self.alum1_id, is_admin=False)
        with self.assertRaises(ValueError) as ctx:
            jobApplicationController.createApplication(self.alum2_id, job_id)
        self.assertIn("not available", str(ctx.exception))

    def testWithdrawApplicationTwiceFails(self):
        job_id = jobController.createJob(
            alumni_id=self.alum1_id, board_id=self.board_id,
            title="Withdraw Job", company="Co", description="", expiry_date_str="2025-12-31"
        )
        app = jobApplicationController.createApplication(self.alum2_id, job_id)
        jobApplicationController.withdrawApplication(app.applicationID, self.alum2_id)
        with self.assertRaises(ValueError) as ctx:
            jobApplicationController.withdrawApplication(app.applicationID, self.alum2_id)
        self.assertIn("already withdrawn", str(ctx.exception))

    def testAddCommentToDeletedPostFails(self):
        post = boardPostController.createBoardPost(self.alum1_id, self.board_id, "To be deleted")
        boardPostController.deleteBoardPost(post.postID, self.alum1_id, is_admin=False)
        with self.assertRaises(ValueError):
            boardPostController.addComment(post.postID, self.alum2_id, "Bob", "Late comment")
