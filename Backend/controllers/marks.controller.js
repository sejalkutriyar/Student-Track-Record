const pool = require('../config/db');

// Grade calculate karne ka function
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// Add marks
exports.addMarks = async (req, res) => {
  let { student_id, subject, exam_type, marks_obtained, max_marks } = req.body;
  // Case-insensitive normalization
  subject = subject.trim().toLowerCase();
  exam_type = (exam_type || 'midterm').toLowerCase();

  try {
    const result = await pool.query(
      `INSERT INTO marks (student_id, subject, exam_type, marks_obtained, max_marks, entered_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, subject, exam_type) 
       DO UPDATE SET 
         marks_obtained = $4,
         max_marks = $5,
         entered_by = $6,
         created_at = NOW()
       RETURNING *`,
      [student_id, subject, exam_type, marks_obtained, max_marks, req.user.id]
    );
    res.status(201).json({ message: 'Marks updated successfully!', marks: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get marks by student
exports.getStudentMarks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM marks WHERE student_id = $1 ORDER BY created_at DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Calculate GPA + Grade + Rank
exports.getStudentGPA = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        subject,
        marks_obtained,
        max_marks,
        ROUND(marks_obtained * 100.0 / max_marks, 2) as percentage
       FROM marks 
       WHERE student_id = $1 AND exam_type = $2`,
      [req.params.student_id, req.query.exam_type || 'midterm']
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No marks found' });

    const subjects = result.rows;
    const totalObtained = subjects.reduce((sum, s) => sum + s.marks_obtained, 0);
    const totalMax = subjects.reduce((sum, s) => sum + s.max_marks, 0);
    const overallPercentage = (totalObtained / totalMax) * 100;
    const gpa = ((overallPercentage / 100) * 10).toFixed(2);
    const grade = calculateGrade(overallPercentage);

    res.json({
      student_id: req.params.student_id,
      subjects,
      total_obtained: totalObtained,
      total_max: totalMax,
      overall_percentage: overallPercentage.toFixed(2),
      gpa,
      grade
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Class rank calculate
exports.getClassRank = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        student_id,
        SUM(marks_obtained) as total_marks,
        RANK() OVER (ORDER BY SUM(marks_obtained) DESC) as rank
       FROM marks
       WHERE exam_type = $1
       GROUP BY student_id`,
      [req.query.exam_type || 'midterm']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};