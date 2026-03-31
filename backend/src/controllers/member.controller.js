const Member = require('../models/member.model');
const { handle200, handle201, handle404, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get all members (with server-side filtering)
// @route   GET /api/members?search=xxx&status=active&messType=monthly
// @access  Private
const getMembers = async (req, res) => {
    try {
        const { search, status, messType } = req.query;
        const filter = {};

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { mobile: regex },
                { address: regex }
            ];
        }
        if (status && status !== 'all') filter.status = status;
        if (messType && messType !== 'all') filter.messType = messType;

        const members = await Member.find(filter).sort({ createdAt: -1 });
        handle200(res, members);
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Create new member
// @route   POST /api/members
// @access  Private
const createMember = async (req, res) => {
    try {
        if (req.body.monthlyCharge) req.body.monthlyCharge = Number(req.body.monthlyCharge);
        if (req.body.tiffinRate) req.body.tiffinRate = Number(req.body.tiffinRate);

        const member = await Member.create(req.body);
        handle201(res, member);
    } catch (error) {
        handle422(res, error);
    }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return handle404(res, 'Member not found');
        }

        const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        handle200(res, updatedMember);
    } catch (error) {
        handle422(res, error);
    }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return handle404(res, 'Member not found');
        }

        await member.deleteOne();
        handle200(res, { id: req.params.id });
    } catch (error) {
        handle500(res, error);
    }
};

module.exports = {
    getMembers,
    createMember,
    updateMember,
    deleteMember,
};
