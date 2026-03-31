const Payment = require('../models/payment.model');
const Bill = require('../models/bill.model');
const { handle200, handle201, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get all payments (with server-side filtering)
// @route   GET /api/payments?startDate=2026-03-01&endDate=2026-03-31&method=cash&memberId=xxx
// @access  Private
const getPayments = async (req, res) => {
    try {
        const { startDate, endDate, method, memberId } = req.query;
        const filter = {};

        if (memberId) filter.memberId = memberId;
        if (method && method !== 'all') filter.method = new RegExp(`^${method}$`, 'i');
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const payments = await Payment.find(filter)
            .populate('memberId', 'name mobile address roomNo')
            .populate('billId', 'monthYear totalAmount')
            .sort({ date: -1 });

        handle200(res, payments);
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Add a payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        req.body.amount = amount;
        const payment = await Payment.create(req.body);

        // Sync with Bill
        if (req.body.billId) {
            const bill = await Bill.findById(req.body.billId);
            if (bill) {
                const newPaidAmount = (bill.paidAmount || 0) + amount;
                const newPendingAmount = Math.max(0, bill.totalAmount - newPaidAmount);
                const newStatus = newPendingAmount <= 0 ? 'Paid' : 'Pending';

                await Bill.findByIdAndUpdate(req.body.billId, {
                    paidAmount: newPaidAmount,
                    pendingAmount: newPendingAmount,
                    status: newStatus
                });
            }
        }

        // Populate and return
        const populatedPayment = await Payment.findById(payment._id)
            .populate('memberId', 'name mobile address roomNo')
            .populate('billId', 'monthYear totalAmount');

        handle201(res, populatedPayment);
    } catch (error) {
        handle422(res, error);
    }
};

module.exports = {
    getPayments,
    createPayment
};
