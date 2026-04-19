const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const {
  getAllStudents,
  getAllParents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  upload,
  importFromCSV
} = require('../controllers/student.controller');

// CSV IMPORT
router.post('/import-csv', auth, upload.single('file'), importFromCSV);

// OTHER ROUTES
router.get('/parents', auth, getAllParents);
router.get('/', auth, getAllStudents);
router.get('/:id', auth, getStudentById);
router.post('/', auth, createStudent);
router.put('/:id', auth, updateStudent);
router.delete('/:id', auth, deleteStudent);

module.exports = router;