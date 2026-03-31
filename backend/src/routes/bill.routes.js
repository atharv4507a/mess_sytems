const express = require('express');
const router = express.Router();
const { getBills, createBill, updateBill } = require('../controllers/bill.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBills).post(protect, createBill);
router.route('/:id').put(protect, updateBill);

module.exports = router;
