```from datetime import date, time

import click
from werkzeug.security import generate_password_hash

from App.database import db
from App.main import create_app
from App.Models import (
    Admin,
    Alumni,
    BoardPost,
    CommunityBoard,
    Event,
    EventRegistration,
    Job,
    JobApplication,
    Message,
    Profile,
)

app = create_app()


def initialize():
    """Reset and seed database with richer sample records."""
    db.drop_all()
    db.create_all()

    # Admins
    admins = [
        Admin(
            email="kelvin@mail.com",
            password=generate_password_hash("pass"),
            name="Kelvin Richards",
            role="admin",
            adminLevel="super",
            department="IT",
            isApproved=True,
        ),
        Admin(
            email="tanya@mail.com",
            password=generate_password_hash("pass"),
            name="Tanya Joseph",
            role="admin",
            adminLevel="moderator",
            department="Communications",
            isApproved=True,
        ),
        Admin(
            email="marlon@mail.com",
            password=generate_password_hash("pass"),
            name="Marlon Singh",
            role="admin",
            adminLevel="moderator",
            department="Alumni Relations",
            isApproved=True,
        ),
    ]
    db.session.add_all(admins)
    db.session.flush()

    # Alumni + profiles
    alumni_data = [
        {"name": "Aaron Baptiste", "email": "aaron@mail.com", "grad": 2020, "faculty": "Engineering", "degree": "BSc Computer Science", "job": "Software Engineer", "company": "Google"},
        {"name": "Priya Nair", "email": "priya@mail.com", "grad": 2021, "faculty": "Science & Tech", "degree": "BSc Data Science", "job": "Data Analyst", "company": "Massy Group"},
        {"name": "Sarah James", "email": "sarah@mail.com", "grad": 2019, "faculty": "Engineering", "degree": "BSc Computer Science", "job": "Software Engineer", "company": "Google"},
        {"name": "Michael Lee", "email": "michael@mail.com", "grad": 2018, "faculty": "Social Sciences", "degree": "BSc Management Studies", "job": "Data Scientist", "company": "Amazon"},
        {"name": "David Chen", "email": "david@mail.com", "grad": 2017, "faculty": "Engineering", "degree": "BSc Engineering", "job": "Frontend Developer", "company": "Netflix"},
        {"name": "Aisha Mohammed", "email": "aisha@mail.com", "grad": 2016, "faculty": "Medical Sciences", "degree": "MBBS", "job": "Resident Doctor", "company": "POS General Hospital"},
        {"name": "Ravi Persad", "email": "ravi@mail.com", "grad": 2015, "faculty": "Law", "degree": "LLB", "job": "Attorney-at-Law", "company": "Lex Caribbean"},
        {"name": "Natalie George", "email": "natalie@mail.com", "grad": 2022, "faculty": "Humanities", "degree": "BA Digital Media", "job": "Product Designer", "company": "Digicel"},
        {"name": "Omar Williams", "email": "omar@mail.com", "grad": 2014, "faculty": "Engineering", "degree": "MSc Systems Engineering", "job": "DevOps Engineer", "company": "Microsoft"},
        {"name": "Leah Adams", "email": "leah@mail.com", "grad": 2023, "faculty": "Science & Tech", "degree": "BSc Information Technology", "job": "QA Engineer", "company": "TSTT"},
    ]
    alumni_data.extend(
        [
            {"name": "Jerome Hunt", "email": "jerome@mail.com", "grad": 2013, "faculty": "Engineering", "degree": "BSc Electrical Engineering", "job": "Cybersecurity Analyst", "company": "First Citizens"},
            {"name": "Shanelle Roberts", "email": "shanelle@mail.com", "grad": 2012, "faculty": "Social Sciences", "degree": "BSc Economics", "job": "Financial Analyst", "company": "Republic Bank"},
            {"name": "Kevin Stewart", "email": "kevin@mail.com", "grad": 2011, "faculty": "Humanities", "degree": "BA Communication Studies", "job": "Communications Manager", "company": "Guardian Media"},
            {"name": "Daniela Khan", "email": "daniela@mail.com", "grad": 2024, "faculty": "Science & Tech", "degree": "BSc Information Technology", "job": "Software Tester", "company": "AMCHAM TT"},
            {"name": "Marissa Wong", "email": "marissa@mail.com", "grad": 2010, "faculty": "Medical Sciences", "degree": "MSc Public Health", "job": "Public Health Analyst", "company": "Ministry of Health"},
            {"name": "Tariq Ali", "email": "tariq@mail.com", "grad": 2016, "faculty": "Engineering", "degree": "BSc Mechanical Engineering", "job": "Operations Engineer", "company": "bpTT"},
            {"name": "Fiona Peters", "email": "fiona@mail.com", "grad": 2018, "faculty": "Law", "degree": "LLB", "job": "Corporate Counsel", "company": "RBC"},
            {"name": "Andre Lewis", "email": "andre@mail.com", "grad": 2020, "faculty": "Food & Agriculture", "degree": "BSc Agribusiness", "job": "Supply Chain Analyst", "company": "NAMDEVCO"},
            {"name": "Chloe Seepersad", "email": "chloe@mail.com", "grad": 2021, "faculty": "Science & Tech", "degree": "BSc Software Engineering", "job": "Backend Developer", "company": "iGovTT"},
            {"name": "Dwayne Grant", "email": "dwayne@mail.com", "grad": 2017, "faculty": "Engineering", "degree": "MSc Data Engineering", "job": "Data Engineer", "company": "Massy Technologies"},
            {"name": "Jamila Brooks", "email": "jamila@mail.com", "grad": 2019, "faculty": "Humanities", "degree": "BA Education", "job": "Instructional Designer", "company": "UWI Open Campus"},
            {"name": "Ethan James", "email": "ethan@mail.com", "grad": 2022, "faculty": "Engineering", "degree": "BSc Computer Engineering", "job": "Platform Engineer", "company": "Courts"},
        ]
    )

    alumni_list = []
    for record in alumni_data:
        alumni = Alumni(
            email=record["email"],
            password=generate_password_hash("pass"),
            name=record["name"],
            role="alumni",
            graduationYear=record["grad"],
            faculty=record["faculty"],
            degree=record["degree"],
            currentJobTitle=record["job"],
            company=record["company"],
            isApproved=True,
            isPublicProfile=True,
        )
        db.session.add(alumni)
        db.session.flush()
        alumni_list.append(alumni)

        profile = Profile(
            alumniID=alumni.alumniID,
            bio=f"{record['job']} at {record['company']}",
            profilePicture=f"https://ui-avatars.com/api/?name={record['name'].replace(' ', '+')}&background=random",
            profileVisibility="public",
        )
        db.session.add(profile)

    db.session.flush()

    # Community Boards
    boards = [
        CommunityBoard(alumniID=alumni_list[2].alumniID, name="Tech Innovators", description="A community for software, data, and product professionals."),
        CommunityBoard(alumniID=alumni_list[3].alumniID, name="UWI Entrepreneurs", description="Connecting alumni founders, operators, and investors."),
        CommunityBoard(alumniID=alumni_list[5].alumniID, name="Health Sciences Alumni", description="Medical, nursing, and public health graduates."),
        CommunityBoard(alumniID=alumni_list[7].alumniID, name="Creative Arts Collective", description="Designers, writers, and media creators network."),
    ]
    boards.extend(
        [
            CommunityBoard(alumniID=alumni_list[10].alumniID, name="Cybersecurity Guild", description="Blue-team, red-team, and security operations discussions."),
            CommunityBoard(alumniID=alumni_list[11].alumniID, name="Finance & Analytics Circle", description="Finance professionals using analytics to drive decisions."),
            CommunityBoard(alumniID=alumni_list[20].alumniID, name="Education Leaders Network", description="Educators and learning designers sharing best practices."),
        ]
    )
    db.session.add_all(boards)
    db.session.flush()

    membership_map = {
        0: [0, 1],
        1: [0, 2],
        2: [0],
        3: [1],
        4: [0, 4],
        5: [2],
        6: [1, 5],
        7: [3],
        8: [0, 4],
        9: [3, 6],
        10: [4],
        11: [5],
        12: [6],
        13: [0, 1],
        14: [2, 6],
        15: [1],
        16: [6],
        17: [3],
        18: [4],
        19: [5],
        20: [6],
        21: [0, 4],
    }

    for alumni_index, board_indexes in membership_map.items():
        prefs = dict(alumni_list[alumni_index].notificationPreferences or {})
        prefs["joinedBoards"] = [boards[index].boardID for index in board_indexes]
        alumni_list[alumni_index].notificationPreferences = prefs

    # Jobs
    jobs = [
        Job(boardID=boards[0].boardID, alumniID=alumni_list[0].alumniID, title="Software Engineer", company="TSTT", description="[Full-time] Build and maintain internal web platforms.", salaryRange="$12k - $15k", location="Port of Spain", postedDate=date(2026, 2, 25), expiryDate=date(2026, 12, 31), status="open"),
        Job(boardID=boards[0].boardID, alumniID=alumni_list[8].alumniID, title="Cloud Engineer", company="Microsoft", description="[Contract] Support Azure migration and IaC rollout.", salaryRange="$14k - $18k", location="Hybrid", postedDate=date(2026, 2, 28), expiryDate=date(2026, 10, 31), status="open"),
        Job(boardID=boards[1].boardID, alumniID=alumni_list[3].alumniID, title="Community Manager", company="Tech Hub", description="[Remote] Drive startup founder engagement and events.", salaryRange="$8k - $10k", location="Remote", postedDate=date(2026, 3, 1), expiryDate=date(2026, 12, 31), status="open"),
        Job(boardID=boards[1].boardID, alumniID=alumni_list[6].alumniID, title="Legal Associate", company="Lex Caribbean", description="[Part-time] Corporate and compliance legal support.", salaryRange="$9k - $12k", location="San Fernando", postedDate=date(2026, 2, 20), expiryDate=date(2026, 9, 30), status="open"),
        Job(boardID=boards[2].boardID, alumniID=alumni_list[5].alumniID, title="Clinical Coordinator", company="POS General Hospital", description="[Full-time] Coordinate outpatient clinic logistics.", salaryRange="$11k - $13k", location="Port of Spain", postedDate=date(2026, 2, 18), expiryDate=date(2026, 8, 30), status="open"),
        Job(boardID=boards[3].boardID, alumniID=alumni_list[7].alumniID, title="UX Designer", company="Digicel", description="[Contract] Design workflows for mobile-first customer journeys.", salaryRange="$10k - $14k", location="Hybrid", postedDate=date(2026, 3, 3), expiryDate=date(2026, 11, 15), status="open"),
    ]
    jobs.extend(
        [
            Job(boardID=boards[4].boardID, alumniID=alumni_list[10].alumniID, title="SOC Analyst", company="First Citizens", description="[Full-time] Monitor and respond to security alerts.", salaryRange="$11k - $14k", location="Port of Spain", postedDate=date(2026, 3, 4), expiryDate=date(2026, 10, 30), status="open"),
            Job(boardID=boards[4].boardID, alumniID=alumni_list[18].alumniID, title="Application Security Engineer", company="iGovTT", description="[Remote] Run code security scans and remediation workflows.", salaryRange="$13k - $16k", location="Remote", postedDate=date(2026, 3, 5), expiryDate=date(2026, 12, 20), status="open"),
            Job(boardID=boards[5].boardID, alumniID=alumni_list[11].alumniID, title="Business Intelligence Analyst", company="Republic Bank", description="[Contract] Build dashboards and KPI reporting pipelines.", salaryRange="$10k - $13k", location="Port of Spain", postedDate=date(2026, 3, 2), expiryDate=date(2026, 11, 30), status="open"),
            Job(boardID=boards[5].boardID, alumniID=alumni_list[19].alumniID, title="Data Engineering Consultant", company="Massy Technologies", description="[Remote] Implement ETL and data quality controls.", salaryRange="$13k - $17k", location="Remote", postedDate=date(2026, 3, 6), expiryDate=date(2026, 12, 12), status="open"),
            Job(boardID=boards[6].boardID, alumniID=alumni_list[20].alumniID, title="Learning Experience Designer", company="UWI Open Campus", description="[Part-time] Design engaging digital learning modules.", salaryRange="$9k - $12k", location="St. Augustine", postedDate=date(2026, 3, 4), expiryDate=date(2026, 9, 15), status="open"),
            Job(boardID=boards[6].boardID, alumniID=alumni_list[12].alumniID, title="Communications Specialist", company="Guardian Media", description="[Part-time] Lead digital communication campaigns.", salaryRange="$8k - $11k", location="Port of Spain", postedDate=date(2026, 3, 1), expiryDate=date(2026, 9, 1), status="open"),
            Job(boardID=boards[0].boardID, alumniID=alumni_list[21].alumniID, title="Platform Reliability Engineer", company="Courts", description="[Full-time] Improve system reliability and observability.", salaryRange="$12k - $16k", location="Hybrid", postedDate=date(2026, 3, 7), expiryDate=date(2026, 12, 25), status="open"),
            Job(boardID=boards[1].boardID, alumniID=alumni_list[15].alumniID, title="Product Operations Associate", company="LaunchTT", description="[Remote] Coordinate product release and feedback cycles.", salaryRange="$7k - $9k", location="Remote", postedDate=date(2026, 3, 5), expiryDate=date(2026, 10, 15), status="open"),
            Job(boardID=boards[2].boardID, alumniID=alumni_list[14].alumniID, title="Health Data Analyst", company="Ministry of Health", description="[Contract] Analyze epidemiology and service delivery data.", salaryRange="$10k - $12k", location="Port of Spain", postedDate=date(2026, 3, 6), expiryDate=date(2026, 11, 1), status="open"),
        ]
    )
    db.session.add_all(jobs)
    db.session.flush()

    # Events
    events = [
        Event(alumniID=alumni_list[2].alumniID, boardID=boards[0].boardID, title="Tech Symposium", description="AI, cloud, and product engineering talks.", date=date(2026, 5, 10), time=time(9, 0), location="Teaching & Learning Complex", maxAttendees=120, status="active"),
        Event(alumniID=alumni_list[0].alumniID, boardID=boards[1].boardID, title="Alumni Networking Mixer", description="Cross-discipline networking evening.", date=date(2026, 3, 15), time=time(18, 0), location="UWI Inn", maxAttendees=100, status="active"),
        Event(alumniID=alumni_list[5].alumniID, boardID=boards[2].boardID, title="Healthcare Careers Panel", description="Clinical and research career pathways.", date=date(2026, 4, 4), time=time(16, 30), location="Faculty of Medical Sciences", maxAttendees=150, status="active"),
        Event(alumniID=alumni_list[7].alumniID, boardID=boards[3].boardID, title="Design Crit Night", description="Portfolio reviews and peer feedback.", date=date(2026, 4, 18), time=time(17, 45), location="Humanities Building", maxAttendees=80, status="active"),
        Event(alumniID=alumni_list[8].alumniID, boardID=boards[0].boardID, title="DevOps Bootcamp", description="Hands-on CI/CD and monitoring workshop.", date=date(2026, 6, 7), time=time(13, 15), location="Computer Lab 2", maxAttendees=60, status="active"),
    ]
    events.extend(
        [
            Event(alumniID=alumni_list[10].alumniID, boardID=boards[4].boardID, title="Blue Team Tabletop", description="Incident response simulation and playbook review.", date=date(2026, 5, 2), time=time(14, 0), location="Engineering Boardroom", maxAttendees=70, status="active"),
            Event(alumniID=alumni_list[11].alumniID, boardID=boards[5].boardID, title="FinTech Analytics Meet", description="Fraud analytics and customer behavior insights.", date=date(2026, 5, 20), time=time(18, 30), location="FSS Seminar Room", maxAttendees=90, status="active"),
            Event(alumniID=alumni_list[20].alumniID, boardID=boards[6].boardID, title="Digital Learning Showcase", description="Showcase modern online teaching practices.", date=date(2026, 6, 12), time=time(15, 0), location="Open Campus Theatre", maxAttendees=110, status="active"),
            Event(alumniID=alumni_list[21].alumniID, boardID=boards[0].boardID, title="SRE Lightning Talks", description="Reliability engineering lessons and demos.", date=date(2026, 7, 8), time=time(17, 0), location="Engineering LT2", maxAttendees=75, status="active"),
            Event(alumniID=alumni_list[13].alumniID, boardID=boards[1].boardID, title="Startup QA Essentials", description="Quality assurance basics for startup teams.", date=date(2026, 4, 28), time=time(12, 45), location="Daaga Auditorium", maxAttendees=85, status="active"),
            Event(alumniID=alumni_list[14].alumniID, boardID=boards[2].boardID, title="Public Health Data Forum", description="Data-informed community health strategies.", date=date(2026, 6, 4), time=time(10, 30), location="Medical Sciences Annex", maxAttendees=140, status="active"),
            Event(alumniID=alumni_list[7].alumniID, boardID=boards[3].boardID, title="Creative Portfolio Night", description="Portfolio showcases and feedback circles.", date=date(2026, 7, 20), time=time(16, 15), location="Daaga Hall", maxAttendees=95, status="active"),
        ]
    )
    db.session.add_all(events)
    db.session.flush()

    # Community Discussions (Board posts)
    posts = [
        BoardPost(boardID=boards[0].boardID, alumniID=alumni_list[2].alumniID, content="Has anyone started the PMP certification this year?"),
        BoardPost(boardID=boards[0].boardID, alumniID=alumni_list[4].alumniID, content="Massy is hiring Junior Data Analysts, DM for referral."),
        BoardPost(boardID=boards[0].boardID, alumniID=alumni_list[8].alumniID, content="Sharing my Terraform templates for review. Feedback welcome."),
        BoardPost(boardID=boards[1].boardID, alumniID=alumni_list[3].alumniID, content="What are the biggest funding gaps for early-stage founders in T&T?"),
        BoardPost(boardID=boards[1].boardID, alumniID=alumni_list[6].alumniID, content="Hosting a legal clinic next month for startup contracts."),
        BoardPost(boardID=boards[1].boardID, alumniID=alumni_list[0].alumniID, content="Anyone open to mentoring student founders this semester?"),
        BoardPost(boardID=boards[2].boardID, alumniID=alumni_list[5].alumniID, content="Looking for volunteers for the blood drive at campus."),
        BoardPost(boardID=boards[2].boardID, alumniID=alumni_list[1].alumniID, content="Data folks: interested in health informatics collaboration?"),
        BoardPost(boardID=boards[3].boardID, alumniID=alumni_list[7].alumniID, content="Who wants to collaborate on a UWI alumni visual archive?"),
        BoardPost(boardID=boards[3].boardID, alumniID=alumni_list[9].alumniID, content="Posting my UI case study tonight, would love critiques."),
    ]
    posts.extend(
        [
            BoardPost(boardID=boards[4].boardID, alumniID=alumni_list[10].alumniID, content="Anyone using OpenVAS for regular internal scans?"),
            BoardPost(boardID=boards[4].boardID, alumniID=alumni_list[18].alumniID, content="Looking for review partners for API security checklists."),
            BoardPost(boardID=boards[4].boardID, alumniID=alumni_list[21].alumniID, content="Posted a secure coding checklist in the files section."),
            BoardPost(boardID=boards[5].boardID, alumniID=alumni_list[11].alumniID, content="Sharing a dashboard template for monthly portfolio performance."),
            BoardPost(boardID=boards[5].boardID, alumniID=alumni_list[19].alumniID, content="What is everyone using for data lineage in finance pipelines?"),
            BoardPost(boardID=boards[5].boardID, alumniID=alumni_list[6].alumniID, content="Quick legal reminder: update data retention clauses this quarter."),
            BoardPost(boardID=boards[6].boardID, alumniID=alumni_list[20].alumniID, content="Who wants to co-host a webinar on student engagement tools?"),
            BoardPost(boardID=boards[6].boardID, alumniID=alumni_list[12].alumniID, content="I can share communication templates for alumni newsletters."),
            BoardPost(boardID=boards[6].boardID, alumniID=alumni_list[16].alumniID, content="Any recommendations for onboarding LMS platforms?"),
            BoardPost(boardID=boards[0].boardID, alumniID=alumni_list[13].alumniID, content="Started a thread for interview prep resources."),
            BoardPost(boardID=boards[1].boardID, alumniID=alumni_list[15].alumniID, content="Looking for mentors for first-time founders in SaaS."),
            BoardPost(boardID=boards[2].boardID, alumniID=alumni_list[14].alumniID, content="Sharing a public health data cleaning workflow I use weekly."),
            BoardPost(boardID=boards[3].boardID, alumniID=alumni_list[17].alumniID, content="Anyone interested in a collaborative alumni photo archive project?"),
            BoardPost(boardID=boards[1].boardID, alumniID=alumni_list[3].alumniID, content="Pitch deck review session next Friday at 6 PM."),
            BoardPost(boardID=boards[0].boardID, alumniID=alumni_list[0].alumniID, content="Happy to review CVs for junior dev roles this week."),
        ]
    )

    for index, post in enumerate(posts):
        like_members = [
            alumni_list[(index + 1) % len(alumni_list)],
            alumni_list[(index + 3) % len(alumni_list)],
            alumni_list[(index + 5) % len(alumni_list)],
        ]
        liked_ids = [member.alumniID for member in like_members[: (index % 3) + 1]]
        post.likedBy = liked_ids
        post.likesCount = len(liked_ids)

        first_comment_author = alumni_list[(index + 2) % len(alumni_list)]
        second_comment_author = alumni_list[(index + 4) % len(alumni_list)]
        comments = [
            {
                "commentID": f"{index}-1",
                "authorID": first_comment_author.alumniID,
                "authorName": first_comment_author.name,
                "content": "Great point. Thanks for sharing this!",
                "time": f"2026-03-{(index % 25) + 1:02d}T10:15:00",
                "avatar": f"https://ui-avatars.com/api/?name={first_comment_author.name.replace(' ', '+')}&background=random",
            }
        ]
        if index % 2 == 0:
            comments.append(
                {
                    "commentID": f"{index}-2",
                    "authorID": second_comment_author.alumniID,
                    "authorName": second_comment_author.name,
                    "content": "I can help with this as well. Let's connect.",
                    "time": f"2026-03-{(index % 25) + 1:02d}T11:30:00",
                    "avatar": f"https://ui-avatars.com/api/?name={second_comment_author.name.replace(' ', '+')}&background=random",
                }
            )
        post.comments = comments

    db.session.add_all(posts)

    # Job Applications
    applications = [
        JobApplication(jobID=jobs[0].jobID, alumniID=alumni_list[1].alumniID, status="pending"),
        JobApplication(jobID=jobs[0].jobID, alumniID=alumni_list[9].alumniID, status="pending"),
        JobApplication(jobID=jobs[5].jobID, alumniID=alumni_list[2].alumniID, status="approved"),
    ]
    applications.extend(
        [
            JobApplication(jobID=jobs[1].jobID, alumniID=alumni_list[13].alumniID, status="pending"),
            JobApplication(jobID=jobs[2].jobID, alumniID=alumni_list[15].alumniID, status="pending"),
            JobApplication(jobID=jobs[6].jobID, alumniID=alumni_list[18].alumniID, status="pending"),
            JobApplication(jobID=jobs[7].jobID, alumniID=alumni_list[21].alumniID, status="approved"),
            JobApplication(jobID=jobs[8].jobID, alumniID=alumni_list[11].alumniID, status="pending"),
            JobApplication(jobID=jobs[9].jobID, alumniID=alumni_list[10].alumniID, status="pending"),
            JobApplication(jobID=jobs[10].jobID, alumniID=alumni_list[20].alumniID, status="approved"),
            JobApplication(jobID=jobs[11].jobID, alumniID=alumni_list[12].alumniID, status="rejected"),
        ]
    )
    db.session.add_all(applications)

    # Event Registrations
    registrations = [
        EventRegistration(eventID=events[0].eventID, attendeeID=alumni_list[0].alumniID, status="registered", paymentStatus="paid"),
        EventRegistration(eventID=events[0].eventID, attendeeID=alumni_list[1].alumniID, status="registered", paymentStatus="pending"),
        EventRegistration(eventID=events[1].eventID, attendeeID=alumni_list[2].alumniID, status="registered", paymentStatus="pending"),
        EventRegistration(eventID=events[2].eventID, attendeeID=alumni_list[4].alumniID, status="registered", paymentStatus="paid"),
    ]
    registrations.extend(
        [
            EventRegistration(eventID=events[3].eventID, attendeeID=alumni_list[7].alumniID, status="registered", paymentStatus="paid"),
            EventRegistration(eventID=events[4].eventID, attendeeID=alumni_list[8].alumniID, status="registered", paymentStatus="paid"),
            EventRegistration(eventID=events[5].eventID, attendeeID=alumni_list[18].alumniID, status="registered", paymentStatus="pending"),
            EventRegistration(eventID=events[6].eventID, attendeeID=alumni_list[11].alumniID, status="registered", paymentStatus="paid"),
            EventRegistration(eventID=events[7].eventID, attendeeID=alumni_list[20].alumniID, status="registered", paymentStatus="pending"),
            EventRegistration(eventID=events[8].eventID, attendeeID=alumni_list[0].alumniID, status="registered", paymentStatus="paid"),
            EventRegistration(eventID=events[9].eventID, attendeeID=alumni_list[13].alumniID, status="registered", paymentStatus="pending"),
            EventRegistration(eventID=events[10].eventID, attendeeID=alumni_list[14].alumniID, status="registered", paymentStatus="paid"),
        ]
    )
    db.session.add_all(registrations)

    # Messages
    messages = [
        Message(senderID=alumni_list[1].alumniID, receiverID=alumni_list[0].alumniID, content="Hi Aaron, saw your cloud post. Can we connect?", status="requested"),
        Message(senderID=alumni_list[0].alumniID, receiverID=alumni_list[1].alumniID, content="Sure Priya, happy to connect.", status="accepted"),
        Message(senderID=alumni_list[7].alumniID, receiverID=alumni_list[9].alumniID, content="Leah, can you review my design portfolio draft?", status="sent"),
        Message(senderID=alumni_list[5].alumniID, receiverID=alumni_list[2].alumniID, content="Sarah, are you joining the healthcare panel?", status="sent"),
        Message(senderID=admins[0].adminID, receiverID=alumni_list[0].alumniID, content="Reminder: update your alumni profile before Friday.", status="sent"),
        Message(senderID=admins[1].adminID, receiverID=alumni_list[3].alumniID, content="Your community event was approved.", status="sent"),
    ]
    messages.extend(
        [
            Message(senderID=alumni_list[10].alumniID, receiverID=alumni_list[18].alumniID, content="Can you share your API security checklist?", status="requested"),
            Message(senderID=alumni_list[18].alumniID, receiverID=alumni_list[10].alumniID, content="Sure, sending you my latest version tonight.", status="accepted"),
            Message(senderID=alumni_list[11].alumniID, receiverID=alumni_list[19].alumniID, content="Need help with a dashboard KPI definition.", status="sent"),
            Message(senderID=alumni_list[20].alumniID, receiverID=alumni_list[12].alumniID, content="Can you review this community announcement draft?", status="sent"),
            Message(senderID=alumni_list[13].alumniID, receiverID=alumni_list[0].alumniID, content="Would love feedback on my QA portfolio.", status="requested"),
            Message(senderID=alumni_list[0].alumniID, receiverID=alumni_list[13].alumniID, content="Absolutely, send me the link.", status="accepted"),
            Message(senderID=admins[2].adminID, receiverID=alumni_list[5].alumniID, content="Please confirm panel availability for April 4.", status="sent"),
            Message(senderID=admins[0].adminID, receiverID=alumni_list[11].alumniID, content="Your board moderation rights were updated.", status="sent"),
            Message(senderID=alumni_list[14].alumniID, receiverID=alumni_list[2].alumniID, content="Sharing a public health data workshop invite.", status="sent"),
            Message(senderID=alumni_list[21].alumniID, receiverID=alumni_list[8].alumniID, content="Can we discuss platform reliability metrics?", status="requested"),
            Message(senderID=alumni_list[8].alumniID, receiverID=alumni_list[21].alumniID, content="Yes, let's schedule a quick call.", status="accepted"),
            Message(senderID=alumni_list[17].alumniID, receiverID=alumni_list[7].alumniID, content="Want to collaborate on the creative archive project?", status="sent"),
        ]
    )
    db.session.add_all(messages)

    db.session.commit()
    print("database initialized")


@app.cli.command("init")
def init():
    initialize()


@app.cli.command("seed-summary", help="Show current counts for key tables.")
def seed_summary_command():
    click.echo(f"Admins: {Admin.query.count()}")
    click.echo(f"Alumni: {Alumni.query.count()}")
    click.echo(f"Profiles: {Profile.query.count()}")
    click.echo(f"Boards: {CommunityBoard.query.count()}")
    click.echo(f"Board Posts: {BoardPost.query.count()}")
    click.echo(f"Jobs: {Job.query.count()}")
    click.echo(f"Job Applications: {JobApplication.query.count()}")
    click.echo(f"Events: {Event.query.count()}")
    click.echo(f"Event Registrations: {EventRegistration.query.count()}")
    click.echo(f"Messages: {Message.query.count()}")


@app.cli.command("alumni-apply-job", help="Create a job application from alumni email + job title query.")
@click.argument("alumni_email", default="aaron@mail.com")
@click.argument("job_title_query", default="Software Engineer")
def alumni_apply_job_command(alumni_email, job_title_query):
    alumni = Alumni.query.filter(Alumni.email.ilike(alumni_email)).first()
    if not alumni:
        click.echo(f"Alumni not found: {alumni_email}")
        return

    job = Job.query.filter(Job.title.ilike(f"%{job_title_query}%")).order_by(Job.postedDate.desc()).first()
    if not job:
        click.echo(f"Job not found for query: {job_title_query}")
        return

    existing = JobApplication.query.filter_by(jobID=job.jobID, alumniID=alumni.alumniID).first()
    if existing:
        click.echo(f"Application already exists: {existing.applicationID} ({existing.status})")
        return

    application = JobApplication(jobID=job.jobID, alumniID=alumni.alumniID, status="pending")
    db.session.add(application)
    db.session.commit()
    click.echo(f"Created application {application.applicationID} for {alumni.email} on job '{job.title}'")


@app.cli.command("alumni-register-event", help="Register an alumni user to an event using email + event title query.")
@click.argument("alumni_email", default="aaron@mail.com")
@click.argument("event_title_query", default="Tech")
def alumni_register_event_command(alumni_email, event_title_query):
    alumni = Alumni.query.filter(Alumni.email.ilike(alumni_email)).first()
    if not alumni:
        click.echo(f"Alumni not found: {alumni_email}")
        return

    event = Event.query.filter(Event.title.ilike(f"%{event_title_query}%")).order_by(Event.date.asc()).first()
    if not event:
        click.echo(f"Event not found for query: {event_title_query}")
        return
    if event.status != "active":
        click.echo(f"Event is not active: {event.title} ({event.status})")
        return

    existing = EventRegistration.query.filter_by(eventID=event.eventID, attendeeID=alumni.alumniID).first()
    if existing and existing.status == "registered":
        click.echo(f"Already registered: {existing.registrationID}")
        return

    if EventRegistration.query.filter_by(eventID=event.eventID, status="registered").count() >= event.maxAttendees:
        click.echo(f"Event is full: {event.title}")
        return

    if existing:
        existing.status = "registered"
        existing.registrationDate = date.today()
        registration = existing
    else:
        registration = EventRegistration(
            eventID=event.eventID,
            attendeeID=alumni.alumniID,
            status="registered",
            paymentStatus="pending",
        )
        db.session.add(registration)

    db.session.commit()
    click.echo(f"Registered {alumni.email} for '{event.title}' ({registration.registrationID})")


@app.cli.command("alumni-send-message", help="Send a message between users by email.")
@click.argument("sender_email", default="aaron@mail.com")
@click.argument("receiver_email", default="priya@mail.com")
@click.argument("content", default="Hi from CLI")
def alumni_send_message_command(sender_email, receiver_email, content):
    sender = Alumni.query.filter(Alumni.email.ilike(sender_email)).first()
    receiver = Alumni.query.filter(Alumni.email.ilike(receiver_email)).first()
    if not sender:
        click.echo(f"Sender alumni not found: {sender_email}")
        return
    if not receiver:
        click.echo(f"Receiver alumni not found: {receiver_email}")
        return

    message = Message(
        senderID=sender.alumniID,
        receiverID=receiver.alumniID,
        content=content,
        status="sent",
        attachments=[],
    )
    db.session.add(message)
    db.session.commit()
    click.echo(f"Message sent: {message.messageID}")


@app.cli.command("create-user", help="Create a new user (alumni or admin).")
@click.argument("email")
@click.argument("password")
@click.argument("name")
@click.argument("role")
@click.option("--graduation-year", type=int, help="Graduation year (alumni only)")
@click.option("--faculty", help="Faculty (alumni only)")
@click.option("--degree", help="Degree (alumni only)")
@click.option("--job-title", help="Current job title (alumni only)")
@click.option("--company", help="Current company (alumni only)")
@click.option("--public-profile", type=bool, default=True, help="Is profile public (alumni only)")
@click.option("--admin-level", help="Admin level: super or moderator (admin only)")
@click.option("--department", help="Department (admin only)")
def create_user_command(email, password, name, role, graduation_year, faculty, degree, job_title, company, public_profile, admin_level, department):
    """Create a new user via CLI."""
    from App.Controllers.userController import create_user
    
    try:
        kwargs = {}
        if role.lower() == "alumni":
            if not graduation_year or not faculty or not degree:
                click.echo("Error: Alumni requires --graduation-year, --faculty, and --degree")
                return
            kwargs = {
                "graduationYear": graduation_year,
                "faculty": faculty,
                "degree": degree,
                "currentJobTitle": job_title or "",
                "company": company or "",
                "isPublicProfile": public_profile,
            }
        elif role.lower() == "admin":
            if not admin_level or not department:
                click.echo("Error: Admin requires --admin-level and --department")
                return
            kwargs = {
                "adminLevel": admin_level,
                "department": department,
            }
        else:
            click.echo(f"Error: Invalid role '{role}'. Must be 'alumni' or 'admin'")
            return
        
        user = create_user(email, password, name, role, **kwargs)
        click.echo(f"Created {role} user: {user.email} (ID: {user.userID})")
    except ValueError as e:
        click.echo(f"Error: {str(e)}")
        return
    except Exception as e:
        click.echo(f"Unexpected error: {str(e)}")```
        return