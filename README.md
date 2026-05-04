
# **Alumni Association Platform 🎓**

**A Flask‑REST API & React frontend application built for The University of the West Indies, St. Augustine Campus – INFO 3604 Project**  
***Group:** Mental Health Matters*

[![Deployed](https://img.shields.io/badge/deployed-render-blue)](https://alumni-association-platform-b4jv.onrender.com)  


---

## **📖 Project Overview**

The **Alumni Association Platform** is a full‑stack web application that connects UWI St. Augustine graduates, administrators, and the wider campus community. It provides features for job posting and application, event management, community boards, messaging, and administrative moderation – all through a modern REST API and a responsive React frontend.

The system follows the **Model‑View‑Controller (MVC)** architectural pattern on the backend, using Flask, SQLAlchemy, and JWT authentication. The frontend is built with React, Tailwind CSS, and the Motion animation library to deliver a mobile‑first, polished user experience.


---

## **✨ Key Features**

- **User Management & Authentication** – Alumni and Admin registration, login, JWT‑based access, profile management, and password reset workflows.  
- **Alumni Directory** – Searchable public directory of registered alumni with privacy controls.  
- **Community Boards** – Create boards, join/leave, post discussions, like and comment on posts.  
- **Job Board** – Post jobs (pending admin approval), apply with resume/cover letter, save jobs, testimonials/reviews, and application status tracking.  
- **Event Management** – Create events, register/unregister, check‑in (admin), cancellation by admin or creator, calendar views.  
- **Messaging System** – Connection requests (accept/reject), direct messaging, inbox/sent views, block users, report functionality.  
- **Admin Dashboard** – Approve/reject jobs and applications, moderate content, generate reports, send global announcements, suspend/ban users.  
- **Notifications** – In‑app notifications via messages, push preferences, email alerts (simulated).  
- **Responsive UI** – Mobile‑first design with bottom navigation, animated transitions, dark‑ready card components.


---

## **🧩 System Architecture**

The application is divided into two main layers:

### **1. Backend (Flask REST API)**

The backend is organised into three layers following **MVC**:

- **Models** (`App/Models/`) – SQLAlchemy ORM classes that define the database schema.  
  Key entities include `User` (base), `Alumni`, `Admin` (polymorphic), `CommunityBoard`, `BoardPost`, `Job`, `JobApplication`, `Event`, `EventRegistration`, `Message`, and `Profile`.  
  Each model includes helper methods like `to_dict()` for serialisation.

- **Controllers** (`App/Controllers/`) – Encapsulate all business logic and database operations.  
  They perform validation, enforce permissions, and interact with the ORM.  
  Examples: `registerUser`, `createJob`, `applyForJob`, `cancelEvent`, `sendMessage`, `moderateContent`.

- **Views** (`App/Views/`) – Flask Blueprints that expose the controller functions as REST endpoints.  
  All API routes are prefixed with `/api` and use JWT authentication via `@jwt_required()`.  
  Example blueprints: `user_bp`, `job_bp`, `event_bp`, `message_bp`, `admin_bp`.

### **2. Frontend (React SPA)**

The frontend is a single‑page application that consumes the REST API. It is structured as:

- **Context Providers** – `AuthContext` manages authentication state and token refresh.  
  `DataContext` acts as the central data layer, fetching all entities and providing mutation functions (`addJob`, `submitJobApplication`, `toggleRegisterEvent`, etc.).

- **Page Components** – Each route corresponds to a page: `Dashboard`, `Events`, `Jobs`, `Messages`, `CommunityBoard`, `Admin`, `Profile`, etc.  
  They use `motion` for animations and Tailwind for styling.

- **Common Components** – `Layout` (shell, header, bottom nav), `Toast`, `PDFViewer`, `Logo`.

The frontend communicates with the backend exclusively through the `/api` endpoints, using JWT tokens stored in `localStorage`.


---

## **🔐 Authentication**

The platform uses **Flask‑JWT‑Extended** for stateless authentication.

- **Login** – `POST /api/users/login` returns an access token.  
- **Token Refresh** – `POST /api/users/refresh` issues a new token using the current valid token.  
- **Protected Routes** – All sensitive endpoints require `Authorization: Bearer <token>` header.

**Default Test Accounts**  
- **Alumni** → Email: `alice@gmail.com` / Password: `alicepass`  
- **Admin** → Email: `admin@uwi.edu` / Password: `Admin@123`


---

## **🌐 REST API Endpoints (Summary)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register new alumni or admin |
| `POST` | `/api/users/login` | Login and obtain JWT token |
| `GET` | `/api/users/me` | Get current user profile |
| `PATCH` | `/api/users/profile` | Update name / email |
| `POST` | `/api/users/reset-password` | Change password (auth or token) |
| `POST` | `/api/admin/users/<id>/approve` | Approve pending alumni |
| `GET` | `/api/admin/reports` | Admin dashboard report |
| `POST` | `/api/admin/announcements` | Send global announcement |
| `POST` | `/api/boards` | Create a community board |
| `GET` | `/api/boards` | List all boards |
| `POST` | `/api/boards/<id>/join` | Join a board |
| `POST` | `/api/boards/<id>/posts` | Create a post in a board |
| `GET` | `/api/boardposts/all` | Get all posts across boards |
| `POST` | `/api/boardposts/<id>/like` | Toggle like on a post |
| `POST` | `/api/boardposts/<id>/comments` | Add comment to a post |
| `GET` | `/api/jobs/list?limit=N` | List jobs (with applied/saved flags) |
| `POST` | `/api/jobs` | Post a new job |
| `POST` | `/api/jobs/<id>/save` | Toggle save job |
| `POST` | `/api/alumni/jobs/<id>/apply` | Apply for a job |
| `POST` | `/api/applications` | Submit job application |
| `PATCH` | `/api/applications/<id>/status` | Admin: approve/reject application |
| `GET` | `/api/events/list?limit=N` | List events (with registered flag) |
| `POST` | `/api/events` | Create an event |
| `POST` | `/api/events/<id>/register` | Register for event |
| `POST` | `/api/messages/request` | Send connection request |
| `POST` | `/api/messages/<id>/accept` | Accept connection request |
| `POST` | `/api/messages` | Send direct message |
| `GET` | `/api/messages/inbox` | Get received messages |
| `POST` | `/api/messages/block` | Block a user |
| `GET` | `/api/profiles/me/data` | Get own profile |
| `PATCH` | `/api/profiles/me/bio` | Update bio |
| `PATCH` | `/api/profiles/me/photo` | Update profile photo |

(A complete API collection is available in the `Backend/e2e` folder.)


---

## **🛠️ Installation & Setup**

### **1. Clone the Repository**
```bash
git clone https://github.com/INFO3604-AlumniAssociationProject/AlumniAssociationPlatformProject.git
cd AlumniAssociationPlatformProject
```

### **2. Backend Setup**
```bash
cd Backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### **3. Initialize the Database**
```bash
flask init
```
This creates all tables, adds the default admin account, and seeds the database with **200+ realistic sample records** (alumni, boards, jobs, events, posts, etc.).

### **4. Start the Flask Server**
```bash
flask run
```
The API will be available at `http://localhost:5000/api`.

### **5. Frontend Setup (Optional)**
```bash
cd ../Frontend
npm install
npm run dev
```
The React dev server will start on `http://localhost:3000` and proxy API calls to the backend.


---

## **🖥️ CLI Commands**

The Flask application provides several custom CLI commands for database management and testing. Run them from the `Backend` directory.

| Command | Description |
|---------|-------------|
| `flask init` | Creates all tables, default admin, and seeds sample data |
| `flask reset` | Drops all tables, recreates, and seeds fresh sample data |
| `flask seed` | Adds sample data to an existing database (idempotent) |
| `flask run` | Start the development server (custom command) |
| `flask listAlumni` | List all alumni |
| `flask listJobs` | List all jobs |
| `flask listEvents` | List all events |
| `flask listBoards` | List all community boards |
| `flask listPosts` | List all board posts |
| `flask listMessages` | List all messages |

### **Alumni Interactive Commands**
| Command | Example |
|---------|---------|
| `flask alumni list` | List all alumni with job details |
| `flask alumni create` | Create a new alumni account |
| `flask alumni search --name John` | Search alumni by name |
| `flask alumni connect <from_id> <to_id>` | Send a connection request |
| `flask alumni register-event <alumni_id> <event_id>` | Register an alumni for an event |
| `flask alumni apply-job <alumni_id> <job_id>` | Apply for a job |

### **Admin Interactive Commands**
| Command | Example |
|---------|---------|
| `flask admin approve-user <user_id>` | Approve a pending alumni |
| `flask admin moderate job <id> approve` | Approve a job listing |
| `flask admin report` | Generate a site summary report |
| `flask admin manage-event <event_id> cancel` | Cancel an event as admin |
| `flask admin announce <admin_id> "content"` | Send an announcement to all alumni |

> **Note:** All commands must be executed inside the `Backend` directory with the virtual environment activated.


---

## **🧪 Testing**

The project includes **unit tests**, **integration tests**, and a **Postman collection** for API validation.

### **Unit & Integration Tests (Backend)**
Run with pytest:
```bash
cd Backend
pytest "Tests\UnitTests.py" -v  # Run unit tests
pytest "Tests\IntegrationTests.py" -v  # Run integration tests
```

- **Unit tests** cover models, controllers, and business logic in isolation.  
- **Integration tests** simulate complete workflows (registration → login → job application → admin approval → messaging, etc.) using an in‑memory SQLite database.

### **API Tests (Postman / Newman)**

A comprehensive Postman collection (`Backend/e2e/AlumniAssociationAPI.postman_collection.json`) with **60 requests** and **61 assertions** is provided.

**Step‑by‑Step Instructions to Run the Postman Collection in the Terminal using Newman:**

1. **Prepare the database and start the server**  
   ```bash
   flask init      # Ensure the database is seeded with test data
   flask reset     # (Optional) Reset the database before testing
   flask run       # Start the Flask server on localhost:5000
   ```

2. **Run the collection with Newman**  
   ```bash
   newman run Backend/e2e/AlumniAssociationAPI.postman_collection.json \
     -e Backend/e2e/config.json
   ```
   (Make sure the Flask server is running on `localhost:5000` before executing Newman.)

**Using the Postman App:**

1. Open Postman and import the environment file (`Backend/e2e/config.json`) to configure variables.  
2. Import the collection file (`Backend/e2e/AlumniAssociationAPI.postman_collection.json`).  
3. Run the collection in Postman to execute all API tests.

The collection tests the full API lifecycle:  
- Registration & login (admin & alumni)  
- Admin approval, profile updates, password reset  
- Community board creation, posting, liking, commenting  
- Job posting, application, testimonials, saving  
- Event creation, registration, check‑in  
- Messaging (connection requests, direct messages, blocking)  
- Notification preferences


---

## **📂 Project Structure**

```
AlumniAssociationPlatformProject/
├── .gitignore
├── package-lock.json
├── README.md
├── render.yaml
├── Backend/
│   ├── metadata.json
│   ├── requirements.txt
│   ├── wsgi.py
│   ├── App/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── pytest.ini
│   │   ├── utils.py
│   │   ├── Controllers/
│   │   │   ├── __init__.py
│   │   │   ├── adminControllers.py
│   │   │   ├── alumniControllers.py
│   │   │   ├── auth.py
│   │   │   ├── boardPostController.py
│   │   │   ├── communityBoardController.py
│   │   │   ├── eventController.py
│   │   │   ├── eventRegistrationControllers.py
│   │   │   ├── initialize.py
│   │   │   ├── jobApplicationController.py
│   │   │   ├── jobController.py
│   │   │   ├── messageController.py
│   │   │   ├── profileController.py
│   │   │   └── userController.py
│   │   ├── Models/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── alumni.py
│   │   │   ├── boardPost.py
│   │   │   ├── communityBoard.py
│   │   │   ├── event.py
│   │   │   ├── eventRegistration.py
│   │   │   ├── job.py
│   │   │   ├── jobApplication.py
│   │   │   ├── message.py
│   │   │   ├── profile.py
│   │   │   └── user.py
│   │   ├── uploads/
│   │   └── Views/
│   │       ├── __init__.py
│   │       ├── adminViews.py
│   │       ├── alumniViews.py
│   │       ├── boardPostViews.py
│   │       ├── communityBoardViews.py
│   │       ├── eventRegistrationViews.py
│   │       ├── eventViews.py
│   │       ├── jobApplicationViews.py
│   │       ├── jobViews.py
│   │       ├── messageViews.py
│   │       ├── profileViews.py
│   │       └── userViews.py
│   ├── e2e/
│   │   ├── AlumniAssociationAPI.postman_collection.json
│   │   └── config.json
│   ├── instance/
│   └── Tests/
│       ├── IntegrationTests.py
│       └── UnitTests.py
└── Frontend/
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── apiConfig.ts
        ├── App.tsx
        ├── AuthContext.tsx
        ├── DataContext.tsx
        ├── index.css
        ├── Layout.tsx
        ├── main.tsx
        ├── vite-env.d.ts
        ├── assets/
        │   └── UWILogo.jpg
        ├── components/
        │   ├── Logo.tsx
        │   ├── PDFViewer.tsx
        │   └── Toast.tsx
        └── pages/
            ├── Admin.tsx
            ├── AdminActionPage.tsx
            ├── AdminLogin.tsx
            ├── CommunityBoard.tsx
            ├── Dashboard.tsx
            ├── Directory.tsx
            ├── Events.tsx
            ├── Feed.tsx
            ├── JobDetails.tsx
            ├── Jobs.tsx
            ├── Login.tsx
            ├── Messages.tsx
            ├── Profile.tsx
            ├── Register.tsx
            ├── SettingsPage.tsx
            └── Welcome.tsx

```


---

## **🚀 Deployment**

The application is deployed on **Render** as a single service:

- **Backend** served via Gunicorn + Flask.  
- **Frontend** built statically and served by Flask from the `Frontend/dist` folder.  
- **Database** – SQLite (production) or PostgreSQL (via `DATABASE_URL` env variable).

**Live URL:**  
[https://alumni-association-platform-b4jv.onrender.com](https://alumni-association-platform-b4jv.onrender.com)


---

## **👥 Group Information**

**Group Name:** Mental Health Matters  

**Members:**  
- Nie‑l Constance  
- Umar Mohammed  
- Skyla Raj  

**Supervisor:** Mr. Devon Murray  

**Course:** INFO 3604 – Project  


---

## **🙏 Acknowledgements**

- This project was developed as part of the INFO 3604 Project Course at The University of the West Indies, St. Augustine Campus.  
- Certain patterns and examples were adapted from in‑class material and open‑source Flask documentation.
