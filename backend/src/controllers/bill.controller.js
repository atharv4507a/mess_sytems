const Bill = require('../models/bill.model');
const { handle200, handle201, handle404, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get all bills (with server-side filtering)
// @route   GET /api/bills?monthYear=2026-03&memberId=xxx&status=Pending
// @access  Private
const getBills = async (req, res) => {
    try {
        const { monthYear, memberId, status } = req.query;
        const filter = {};

        if (monthYear) filter.monthYear = monthYear;
        if (memberId) filter.memberId = memberId;
        if (status && status !== 'all') filter.status = new RegExp(`^${status}$`, 'i');

        const bills = await Bill.find(filter)
            .populate('memberId', 'name mobile messType tiffinRate monthlyCharge address roomNo')
            .sort({ createdAt: -1 });

        handle200(res, bills);
    } catch (error) {
        handle500(res, error);
    }
};

const createBill = async (req, res) => {
    try {
        const { memberId, monthYear, totalAmount, paidAmount, ...rest } = req.body;

        if (!memberId || !monthYear) {
            return handle422(res, 'Member ID and Month/Year are required');
        }

        // Sanitize body
        const sanitizeBody = { ...rest, memberId, monthYear };
        delete sanitizeBody._id;
        delete sanitizeBody.id;
        delete sanitizeBody.__v;

        const existingBill = await Bill.findOne({ memberId, monthYear });

        const total = totalAmount !== undefined ? Number(totalAmount) : (existingBill?.totalAmount || 0);
        const paid = paidAmount !== undefined ? Number(paidAmount) : (existingBill?.paidAmount || 0);
        const finalPending = Math.max(0, total - paid);
        const finalStatus = finalPending <= 0 ? 'Paid' : 'Pending';

        sanitizeBody.totalAmount = total;
        sanitizeBody.paidAmount = paid;
        sanitizeBody.pendingAmount = finalPending;
        sanitizeBody.status = finalStatus;

        let bill = await Bill.findOneAndUpdate(
            { memberId, monthYear },
            { $set: sanitizeBody },
            { returnDocument: 'after', upsert: true, runValidators: true }
        );

        bill = await bill.populate('memberId', 'name mobile messType tiffinRate monthlyCharge address roomNo');
        handle201(res, bill);
    } catch (error) {
        console.error('Create Bill Error:', error);
        handle422(res, error);
    }
};

const updateBill = async (req, res) => {
    try {
        const currentBill = await Bill.findById(req.params.id);
        if (!currentBill) {
            return handle404(res, 'Bill not found');
        }

        const sanitizeBody = { ...req.body };
        delete sanitizeBody._id;
        delete sanitizeBody.id;
        delete sanitizeBody.__v;

        if (sanitizeBody.totalAmount !== undefined || sanitizeBody.paidAmount !== undefined) {
            const total = sanitizeBody.totalAmount !== undefined ? Number(sanitizeBody.totalAmount) : currentBill.totalAmount;
            const paid = sanitizeBody.paidAmount !== undefined ? Number(sanitizeBody.paidAmount) : currentBill.paidAmount;
            sanitizeBody.pendingAmount = Math.max(0, total - paid);
            sanitizeBody.status = sanitizeBody.pendingAmount <= 0 ? 'Paid' : 'Pending';
        }

        const bill = await Bill.findByIdAndUpdate(req.params.id, { $set: sanitizeBody }, {
            returnDocument: 'after',
            runValidators: true,
        }).populate('memberId', 'name mobile messType tiffinRate monthlyCharge address roomNo');

        handle200(res, bill);
    } catch (error) {
        console.error('Update Bill Error:', error);
        handle422(res, error);
    }
};

module.exports = {
    getBills,
    createBill,
    updateBill
};
