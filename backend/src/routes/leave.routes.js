const express = require('express');
const router = express.Router();
const { getLeaves, addLeave, deleteLeave } = require('../controllers/leave.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLeaves).post(protect, addLeave).delete(protect, deleteLeave);

module.exports = router;
