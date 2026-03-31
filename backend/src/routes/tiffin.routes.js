const express = require('express');
const router = express.Router();
const { getTiffins, createOrUpdateTiffin } = require('../controllers/tiffin.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTiffins).post(protect, createOrUpdateTiffin);

module.exports = router;
