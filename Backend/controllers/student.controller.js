const pool = require('../config/db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Multer
const upload = multer({ dest: 'uploads/' });
exports.upload = upload;

// GET ALL STUDENTS
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

// GET ALL PARENTS
exports.getAllParents = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'parent' ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE STUDENT
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

// CREATE STUDENT
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

// UPDATE STUDENT
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

// DELETE STUDENT
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // First, delete any dependent records in other tables to avoid Foreign Key constraint errors 
    await pool.query('DELETE FROM attendance WHERE student_id = $1', [studentId]);
    await pool.query('DELETE FROM marks WHERE student_id = $1', [studentId]);
    await pool.query('DELETE FROM remarks WHERE student_id = $1', [studentId]);

    // Finally, delete the student
    const result = await pool.query(
      'DELETE FROM students WHERE id=$1 RETURNING *',
      [studentId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student and related records deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// IMPORT FROM CSV
exports.importFromCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const students = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      students.push(row);
    })
    .on('end', async () => {
      let successCount = 0;
      let errorCount = 0;

      try {
        for (const student of students) {
          try {
            await pool.query(
              `INSERT INTO students (name, roll_number, class, section, dob, parent_id)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (roll_number) DO NOTHING`,
              [
                student.name,
                student.roll_number,
                student.class,
                student.section,
                student.dob || null,
                student.parent_id || null
              ]
            );
            successCount++;
          } catch (err) {
            errorCount++;
          }
        }

        // delete file after processing
        fs.unlinkSync(req.file.path);

        res.status(201).json({
          message: 'Import complete!',
          success: successCount,
          errors: errorCount,
          total: students.length
        });

      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    })
    .on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
};