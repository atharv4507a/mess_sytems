const express = require('express');
const router = express.Router();
const { loginUser, getMe, setupAdmin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/setup-admin', setupAdmin);

module.exports = router;
