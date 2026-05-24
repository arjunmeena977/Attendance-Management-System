# AttendPro — Full-Stack Attendance Management System

AttendPro is a comprehensive, full-stack Attendance Management System built with the MERN stack (MongoDB, Express, React, Node.js). It provides role-based access for Employees, Managers, and Admins to handle daily punch-ins, selfies, GPS location tracking, overtime requests, and team reporting.

---

## 🚀 Features Implemented

### Employee Features
- 📷 **Live Punch In/Out** — Capture daily attendance via live webcam selfie and GPS location.
- 📋 **My Attendance** — View personal attendance history with date filters and shift status.
- ⏰ **Request Overtime** — Submit overtime requests with hours and reasons.
- 📊 **Personal Report** — View and print a summary of your daily hours.

### Manager Features
- 👥 **Team Attendance** — Monitor daily attendance for team members.
- ✅ **Validate Selfies** — Review employee selfies and mark attendance as valid or invalid.
- ⏰ **Approve Overtime** — Review, approve, or reject team overtime requests.
- 📊 **Team Report** — Generate daily attendance reports for the team.

### Admin Features
- 🛡 **User Management** — Create, edit, and manage all users across the organization.
- 👥 **System-wide Attendance** — View attendance records for all users.
- ⏰ **All Overtime Requests** — Manage pending overtime requests globally.
- 📊 **System Reports** — Access complete organization-wide daily reports.

### UI / UX
- **Design System** — Modern dark mode with glassmorphism aesthetics.
- **Responsive Layout** — Sidebar navigation with mobile toggle.
- **Live Clock** — Real-time clock integration on the dashboard.
- **Toast Notifications** — Instant feedback for actions.

---

## ⚙️ Tech Stack

**Frontend:**
- React 18 (Vite)
- Redux Toolkit & RTK Query
- React Router v6
- Vanilla CSS (Custom Design System)
- React Hot Toast

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcrypt for Auth
- Winston & Morgan for logging

---

## 📁 Project Structure

```
D-Table Analytics/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # MongoDB and Logger config
│   │   ├── controllers/      # Route controllers (Auth, Attendance, etc.)
│   │   ├── middleware/       # JWT Auth and Error handling
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routes
│   │   ├── app.js            # Express server entry point
│   │   └── seed.js           # Demo database seeder
│   └── package.json
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── app/              # Redux store
│   │   ├── components/       # Shared UI (DashboardLayout, Camera)
│   │   ├── features/         # RTK Query API slices
│   │   ├── pages/            # App pages
│   │   ├── routes/           # Protected Route guards
│   │   ├── App.jsx           # Main App component
│   │   └── index.css         # Global styles
│   └── package.json
│
└── package.json              # Root package.json (concurrently)
```

---

## 🛠️ Installation & Setup

1. **Install Dependencies**
   From the root folder, run the following command to install dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```

2. **Environment Variables**
   Ensure your `.env` files are properly configured:
   
   **`backend/.env`**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/attendance_db
   JWT_SECRET=attendance_super_secret_jwt_key_2024
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```
   
   **`frontend/.env`**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Seed the Database (Demo Users)**
   Run the seed script to automatically create demo accounts:
   ```bash
   npm run seed
   ```

4. **Start the Application**
   Run both frontend and backend simultaneously using concurrently:
   ```bash
   npm run dev
   ```

---

## 🔑 Demo Accounts

If you ran the seed script, you can log in using the following accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | demo123 |
| **Manager** | manager@demo.com | demo123 |
| **Employee** | employee@demo.com | demo123 |

---

## 🔌 API Endpoints Summary

- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Attendance:** `POST /api/attendance/punch-in`, `POST /api/attendance/punch-out`, `GET /api/attendance/today`, `PATCH /api/attendance/:id/validate`
- **Overtime:** `POST /api/overtime/request`, `GET /api/overtime/pending`, `PATCH /api/overtime/:id/review`
- **Users:** `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`

---
*Developed by D-Table Analytics*
