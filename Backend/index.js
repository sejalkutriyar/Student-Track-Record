const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/marks', require('./routes/marks.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/remarks', require('./routes/remarks.routes'));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', message: 'Server and Database both running! 🚀', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'DB connection failed' });
  }
});

const userSocketMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log('📋 Current map:', userSocketMap);
  });

  socket.on('call:request', ({ toUserId, fromName, studentName }) => {
    console.log(`📞 Call request — toUserId: ${toUserId}, from: ${fromName}`);
    console.log('📋 Available users:', userSocketMap);
    const targetSocket = userSocketMap[toUserId];
    if (targetSocket) {
      io.to(targetSocket).emit('call:incoming', {
        fromSocketId: socket.id,
        fromName,
        studentName
      });
      console.log(`✅ Call sent from ${socket.id} to ${targetSocket}`);
    } else {
      console.log(`❌ Target user ${toUserId} NOT FOUND in map!`);
    }
  });

  socket.on('webrtc:offer', ({ toSocketId, offer }) => {
    io.to(toSocketId).emit('webrtc:offer', { fromSocketId: socket.id, offer });
  });

  socket.on('webrtc:answer', ({ toSocketId, answer }) => {
    io.to(toSocketId).emit('webrtc:answer', { fromSocketId: socket.id, answer });
  });

  socket.on('webrtc:ice-candidate', ({ toSocketId, candidate }) => {
    io.to(toSocketId).emit('webrtc:ice-candidate', { fromSocketId: socket.id, candidate });
  });

  socket.on('call:accepted', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:accepted', { fromSocketId: socket.id });
  });

  socket.on('call:declined', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:declined');
  });

  socket.on('call:end', ({ toSocketId }) => {
    io.to(toSocketId).emit('call:end');
  });

  socket.on('disconnect', () => {
    Object.keys(userSocketMap).forEach(userId => {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log(`❌ User ${userId} disconnected`);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));