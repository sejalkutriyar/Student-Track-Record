# 📚 EduTrack — Student Track Record & Virtual PTM Suite

[![Live Demo](https://img.shields.io/badge/Live_Demo-student--track--record.onrender.com-brightgreen?style=for-the-badge)](https://student-track-record.onrender.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)]()
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)]()

A comprehensive and unified school management platform designed to bridge the communication gap between teachers and parents. EduTrack not only tracks academic performance, attendance, and remarks but also features a cutting-edge **built-in WebRTC video calling system** for instant, real-time Parent-Teacher Meetings (PTM) directly from the browser.

---

## 🔗 Live Application
**Check out the live project here:** [EduTrack Live Demo](https://student-track-record.onrender.com/)

---

## 🚀 The Tech Stack

- **Frontend:** React.js, CSS3, Chart.js, Socket.io-client
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Real-time Communication:** WebRTC (Peer-to-peer Video Calls), Socket.io (Signaling & Notifications)
- **Security & Utilities:** JWT (JSON Web Tokens), Bcrypt (Password Hashing), PDFKit (Report Generation), Nodemailer (Automated Emails), Docker

---

## ✨ Core Features

### 👨‍🏫 For Teachers
- **Secure Authentication:** Role-based login (Teacher).
- **Student Management:** Full CRUD operations for managing student profiles.
- **Smart Attendance:** Daily attendance marking with automatic percentage calculation.
- **Automated Grading System:** Enter raw subject marks and let the database automatically calculate GPA, Grades, and overall Class Rank.
- **Virtual PTM Calling:** Initiate real-time video calls with parents using WebRTC technology.
- **Remark System:** Add specific behavioral, academic, or achievement remarks for students.

### 👪 For Parents
- **Parent Dashboard:** A centralized view of their child's academic journey.
- **Auto-Alerts:** Automated email notifications via Nodemailer if the child's attendance drops below 75%.
- **Downloadable Reports:** Instantly generate and download comprehensive PDF Report Cards.
- **Incoming PTM Calls:** Receive incoming video calls from teachers with a smooth UI popup, powered by WebSockets.
- **Visual Performance:** Analyze marks and progress through interactive charts (Chart.js).

---

## 🛠️ Local Setup & Installation

### Option 1 — Docker (Recommended & Easiest)
Make sure you have Docker and Docker Compose installed.
```bash
# Clone the repository
git clone <your-repo-url>
cd Record_System

# Spin up the containers
docker-compose up --build
```
> **Note:** The application will be available at `http://localhost:3000`.

### Option 2 — Manual Setup

**1. Setup the Backend:**
```bash
cd Backend
npm install

# Make sure you have PostgreSQL running locally and create a database named 'edutrack'

# Start the backend server
npm run dev
```

**2. Setup the Frontend:**
```bash
# Open a new terminal
cd frontend
npm install

# Start the React app
npm start
```

---

## 🔑 Environment Variables (.env)
Create a `.env` file in the `Backend` directory with the following credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edutrack
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_google_app_password
```

---

## 📁 Project Architecture

```text
Record_System/
├── Backend/                 # Node.js + Express Backend
│   ├── config/              # DB & Mailer Configurations
│   ├── controllers/         # Core Business Logic (Auth, Attendance, Marks, WebRTC)
│   ├── middleware/          # JWT Verification 
│   ├── models/              # DB Migration Scripts / Schema
│   ├── routes/              # Express API Routes
│   ├── utils/               # Alert Services & PDF Generators
│   └── index.js             # Main Server Entry Point
│
├── frontend/                # React.js Frontend
│   └── src/
│       ├── components/      # Reusable UI (VideoCall, IncomingCall)
│       ├── pages/           # Main Views (Dashboards, Login)
│       └── socket.js        # Socket.io Client Instance
│
├── docker-compose.yml       # Docker orchestration
└── README.md
```

---

*Built with ❤️ by Sejal Kumari*
