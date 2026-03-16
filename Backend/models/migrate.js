const pool = require('../config/db');

const createTables = async () => {
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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ All tables created!');
    process.exit();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

createTables();