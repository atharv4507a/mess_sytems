const express = require('express');
const router = express.Router();
const {
    getMembers,
    createMember,
    updateMember,
    deleteMember,
} = require('../controllers/member.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMembers).post(protect, createMember);
router.route('/:id').put(protect, updateMember).delete(protect, deleteMember);

module.exports = router;
