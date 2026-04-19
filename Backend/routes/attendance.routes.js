const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  markAttendance,
  getStudentAttendance,
  getAttendancePercentage,
  getAttendanceByDate
} = require('../controllers/attendance.controller');

router.post('/', auth, markAttendance);
router.get('/date/:date', auth, getAttendanceByDate);
router.get('/:student_id', auth, getStudentAttendance);
router.get('/:student_id/percentage', auth, getAttendancePercentage);

module.exports = router;