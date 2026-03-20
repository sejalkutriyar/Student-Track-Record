const pool = require('../config/db');

// Add remark
exports.addRemark = async (req, res) => {
  const { student_id, remark_text, remark_type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO remarks (student_id, teacher_id, remark_text, remark_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [student_id, req.user.id, remark_text, remark_type || 'academic']
    );
    res.status(201).json({ message: 'Remark added!', remark: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get remarks by student
exports.getStudentRemarks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as teacher_name 
       FROM remarks r
       JOIN users u ON r.teacher_id = u.id
       WHERE r.student_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete remark
exports.deleteRemark = async (req, res) => {
  try {
    await pool.query('DELETE FROM remarks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Remark deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};