const Leave = require('../models/leave.model');
const { handle200, handle201, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get all leaves (with server-side filtering)
// @route   GET /api/leaves?memberId=xxx&month=2026-03
// @access  Private
const getLeaves = async (req, res) => {
    try {
        const { memberId, month } = req.query;
        const filter = {};

        if (memberId) filter.memberId = memberId;
        if (month) filter.month = month;

        const leaves = await Leave.find(filter).populate('memberId', 'name mobile');
        handle200(res, leaves);
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Add Leave
// @route   POST /api/leaves
// @access  Private
const addLeave = async (req, res) => {
    try {
        const exists = await Leave.findOne({
            memberId: req.body.memberId,
            date: new Date(req.body.date)
        });

        if (exists) {
            return handle422(res, 'Leave already exists for this date');
        }

        const leave = await Leave.create(req.body);
        handle201(res, leave);
    } catch (error) {
        handle422(res, error);
    }
};

// @desc    Delete Leave
// @route   DELETE /api/leaves
// @access  Private
const deleteLeave = async (req, res) => {
    try {
        const { memberId, date } = req.body;
        await Leave.findOneAndDelete({ memberId, date: new Date(date) });
        handle200(res, { message: 'Leave deleted' });
    } catch (error) {
        handle500(res, error);
    }
};

module.exports = {
    getLeaves,
    addLeave,
    deleteLeave
};
