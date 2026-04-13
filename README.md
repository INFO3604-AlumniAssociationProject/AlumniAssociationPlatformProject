# UWI Alumni Association Platform (St. Augustine Campus)

Full-stack web app for the UWI Alumni Association (St. Augustine). Backend is Flask + SQLAlchemy + JWT + Flask-Limiter; frontend is React 19 + TypeScript + Vite + Tailwind + Framer Motion. Ships with realistic sample data and CLI commands to set up, seed, and run the platform locally.

## Tech Stack
- Backend: Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Migrate, Flask-Limiter, Flask-CORS
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Database: SQLite (dev) — configured via SQLALCHEMY_DATABASE_URI

## Setup
1) Clone and enter the project:
```
git clone <repo-url>
cd AlumniAssociationPlatformProject
```
2) Create & activate a virtualenv (Python 3.10):
```
python -m venv .venv
source .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
```
3) Install backend deps:
```
cd Backend
pip install -r requirements.txt
```
4) Environment variables (defaults are safe for local dev):
- SECRET_KEY, JWT_SECRET_KEY (random fallback if unset)
- PRODUCTION=false (so JWT cookies aren’t secure-only in dev)
- SQLALCHEMY_DATABASE_URI (defaults to sqlite:///database.db)

## Backend commands (run from Backend/)
- `flask init` — create tables and seed sample data (prints “Database initialized”)
- `flask run` — start dev server on http://localhost:5000
- `flask reset` — drop, recreate, and re-seed (prints “Database reset and sample data added”)
- `flask seed` — add sample data to an existing DB (prints “Sample data added”)

## Frontend
```
cd Frontend
npm install
npm run dev   # Vite on http://localhost:3000
```
The frontend auto-detects the backend URL from `VITE_API_URL` (defaults to http://localhost:5000). Ensure it points to your backend.

## Tests
From Backend/:
```
python -m unittest Tests.UnitTests
python -m unittest Tests.IntegrationTests
```
(Or `pytest Tests/UnitTests.py Tests/IntegrationTests.py` if installed.)  
Postman: import `Backend/e2e/postmanCollection.json` and run the collection; all endpoints align with the frontend calls.

## Sample Credentials
- Admin: `admin@uwi.edu` / `Admin@123`
- Alumni: `alice@test.com` / `password123` (and ~150 generated alumni accounts)

## Troubleshooting
- Port conflict: change ports in Vite or Flask command (`--port`).
- CORS: set FRONTEND_ORIGINS env var if your frontend runs on a non-default host.
- Missing .env: backend falls back to safe defaults; set keys for production.
- If seed says “Alumni already present”, run `flask reset` to reseed.

## Frontend ↔ Backend
All UI data (jobs, events, boards, posts, messages, testimonials, saved jobs) is fetched from the API via `DataContext.tsx`; no hardcoded mock data remains. Saving jobs, applying, testimonials, event registration, announcements, and reports all hit live endpoints.

## Notes
- No new models were added; JSON fields store flexible data where needed.
- Sample data is created only when the DB has no alumni to avoid duplicates.
