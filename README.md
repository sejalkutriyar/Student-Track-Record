# 📚 EduTrack — Student Track Record & PTM Video Suite

A unified school management platform where academic performance tracking is directly connected to a built-in WebRTC video calling system for instant Parent-Teacher communication.

## 🚀 Tech Stack
- **Frontend:** React.js, TailwindCSS, Chart.js, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL
- **Real-time:** WebRTC, Socket.io
- **Other:** JWT, Bcrypt, PDFKit, Nodemailer, Docker

## ✨ Features
- ✅ JWT Authentication with Role-Based Access (Teacher/Parent)
- ✅ Student CRUD Management
- ✅ Daily Attendance Marking with Percentage Calculation
- ✅ Auto Email Alert when Attendance drops below 75%
- ✅ Subject-wise Marks Entry with automatic GPA & Grade Calculation
- ✅ Teacher Remarks System (Academic / Behavioral / Achievement)
- ✅ PDF Report Card Generation + Email to Parent
- ✅ Performance Charts (Bar + Doughnut via Chart.js)
- ✅ WebRTC Video Call (Teacher → Parent) via Socket.io Signaling
- ✅ Docker + Docker Compose one-command setup

## 🛠️ Setup & Run

### Option 1 — Docker (Recommended)
```bash
docker-compose up --build
```
Open: http://localhost:3000

### Option 2 — Manual Setup
```bash
# Backend
cd Backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## 🔑 Environment Variables
Create `Backend/.env` file:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edutrack
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_secret_key
NODE_ENV=development
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

## 📁 Project Structure
```
Record_System/
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
├── frontend/
│   └── src/
│       ├── pages/
│       └── components/
├── docker-compose.yml
└── README.md
```

## 👩‍💻 Developer
**Sejal Kumari** | PST-24-000188 | 2026 Batch | Medhavi Skills University