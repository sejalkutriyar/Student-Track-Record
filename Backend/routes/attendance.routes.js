const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  markAttendance,
  getStudentAttendance,
  getAttendancePercentage
} = require('../controllers/attendance.controller');

router.post('/', auth, markAttendance);
router.get('/:student_id', auth, getStudentAttendance);
router.get('/:student_id/percentage', auth, getAttendancePercentage);

module.exports = router;