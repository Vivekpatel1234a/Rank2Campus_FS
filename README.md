# Rank2Campus
Rank2Campus is a full-stack admission counselling and seat-allocation platform that supports student onboarding, document verification, college discovery, rank prediction, preference management, and admin-driven allocation workflows.

## Stack
- Frontend: React + Vite + React Router
- Backend: Node.js + Express + Mongoose
- Database: MongoDB (local or Atlas)
- Auth: JWT + bcrypt
- File upload: Multer
- AI counsellor: Gemini API (optional)

## Features
- Student registration and secure login
- Student profile completion tracking
- College and branch discovery
- Rank prediction using historical cutoff data
- Preference saving and locking for an active admission round
- Document upload and admin review workflow
- Notifications for students and admins
- Admin dashboard and seat allocation engine

## Requirements
- Node.js 20+
- MongoDB instance running locally or Atlas access

## Local setup
1. Copy the example env files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Update values in `backend/.env` as needed, especially `MONGODB_URI`, `JWT_SECRET`, and admin credentials.
3. Install dependencies and start the project:
   ```bash
   npm install
   npm run seed
   npm run dev
   ```
   This runs both the backend and frontend together.

## Manual run
Backend:
```bash
cd backend
npm install
npm run seed
npm run dev
```
Frontend:
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

## Demo login
The seed script creates an admin user from `backend/.env` values:
- Email: `SEED_ADMIN_EMAIL`
- Password: `SEED_ADMIN_PASSWORD`

Change these credentials before using the app in a real environment.

## Important notice
- Seeded data is demo-only and should not be used as official admission data.
- The rank predictor is advisory and cannot guarantee admission outcomes.
