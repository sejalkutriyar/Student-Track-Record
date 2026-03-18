const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { generateReport } = require('../controllers/report.controller');

router.get('/:student_id', auth, generateReport);

module.exports = router;