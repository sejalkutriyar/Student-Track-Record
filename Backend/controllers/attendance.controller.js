const pool = require('../config/db');

// Mark attendance
exports.markAttendance = async (req, res) => {
  const { student_id, date, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO attendance (student_id, date, status, marked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, date) DO UPDATE SET status = $3
       RETURNING *`,
      [student_id, date, status, req.user.id]
    );
    res.status(201).json({ message: 'Attendance marked!', attendance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance by student
exports.getStudentAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Calculate attendance percentage
exports.getAttendancePercentage = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        ROUND(
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) as percentage
       FROM attendance WHERE student_id = $1`,
      [req.params.student_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};