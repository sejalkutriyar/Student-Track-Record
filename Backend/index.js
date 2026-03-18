const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/marks', require('./routes/marks.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'Server and Database both running! 🚀',
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'DB connection failed' });
  }
});

// Socket.io — User ID to Socket ID mapping
const userSocketMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User apna ID register karta hai
  socket.on('register', (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Teacher call initiate karta hai
  socket.on('call:request', ({ toUserId, fromName, studentName }) => {
    const targetSocket = userSocketMap[toUserId];
    if (targetSocket) {
      io.to(targetSocket).emit('call:incoming', {
        fromSocketId: socket.id,
        fromName,
        studentName
      });
      console.log(`Call request from ${socket.id} to ${targetSocket}`);
    }
  });

  // WebRTC Signaling — Offer
  socket.on('webrtc:offer', ({ toSocketId, offer }) => {
    io.to(toSocketId).emit('webrtc:offer', {
      fromSocketId: socket.id,
      offer
    });
  });

  // WebRTC Signaling — Answer
  socket.on('webrtc:answer', ({ toSocketId, answer }) => {
    io.to(toSocketId).emit('webrtc:answer', {
      fromSocketId: socket.id,
      answer
    });
  });

  // WebRTC Signaling — ICE Candidate
  socket.on('webrtc:ice-candidate', ({ toSocketId, candidate }) => {
    io.to(toSocketId).emit('webrtc:ice-candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });

  // Call accept
  socket.on('call:accepted', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:accepted', {
      fromSocketId: socket.id
    });
  });

  // Call decline
  socket.on('call:declined', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:declined');
  });

  // Call end
  socket.on('call:end', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:end');
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove from map
    Object.keys(userSocketMap).forEach(userId => {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));