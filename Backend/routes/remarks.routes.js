const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { addRemark, getStudentRemarks, deleteRemark } = require('../controllers/remarks.controller');

router.post('/', auth, addRemark);
router.get('/:student_id', auth, getStudentRemarks);
router.delete('/:id', auth, deleteRemark);

module.exports = router;