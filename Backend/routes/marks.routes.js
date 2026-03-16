const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  addMarks,
  getStudentMarks,
  getStudentGPA,
  getClassRank
} = require('../controllers/marks.controller');

router.post('/', auth, addMarks);
router.get('/:student_id', auth, getStudentMarks);
router.get('/:student_id/gpa', auth, getStudentGPA);
router.get('/class/rank', auth, getClassRank);

module.exports = router;