const pool = require('../config/db');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single student
exports.getStudentById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  const { name, roll_number, class: cls, section, dob, parent_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO students (name, roll_number, class, section, dob, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, roll_number, cls, section, dob, parent_id]
    );
    res.status(201).json({ message: 'Student created!', student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  const { name, roll_number, class: cls, section, dob } = req.body;
  try {
    const result = await pool.query(
      `UPDATE students SET name=$1, roll_number=$2, class=$3, section=$4, dob=$5
       WHERE id=$6 RETURNING *`,
      [name, roll_number, cls, section, dob, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated!', student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM students WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};