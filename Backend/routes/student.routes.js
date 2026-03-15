const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/student.controller');

router.get('/', auth, getAllStudents);
router.get('/:id', auth, getStudentById);
router.post('/', auth, createStudent);
router.put('/:id', auth, updateStudent);
router.delete('/:id', auth, deleteStudent);

module.exports = router;