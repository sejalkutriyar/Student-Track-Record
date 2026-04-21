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
    origin: '*', // Allow production frontend to connect
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

const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin','teacher','parent')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll_number VARCHAR(20) UNIQUE NOT NULL,
        class VARCHAR(10),
        section VARCHAR(5),
        dob DATE,
        parent_id INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id),
        date DATE NOT NULL,
        status VARCHAR(10) CHECK (status IN ('present','absent','holiday')),
        marked_by INT REFERENCES users(id),
        CONSTRAINT attendance_student_date_unique UNIQUE (student_id, date)
      );

      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id),
        subject VARCHAR(50),
        exam_type VARCHAR(30),
        marks_obtained INT,
        max_marks INT,
        entered_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT marks_unique_idx UNIQUE (student_id, subject, exam_type)
      );

      CREATE TABLE IF NOT EXISTS remarks (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        teacher_id INT REFERENCES users(id),
        remark_text TEXT NOT NULL,
        remark_type VARCHAR(20) CHECK (remark_type IN ('behavioral', 'academic', 'achievement')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Fix existing table constraint just in case it was created without it
    try {
      await pool.query(`ALTER TABLE marks ADD CONSTRAINT marks_unique_idx UNIQUE (student_id, subject, exam_type);`);
    } catch (e) {
      // Ignore if constraint already exists
    }

    console.log('✅ Database tables verified/created successfully!');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
};

server.listen(PORT, async () => {
  await initializeDB();
  console.log(`Server running on port ${PORT}`);
});