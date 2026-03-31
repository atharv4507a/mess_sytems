const Member = require('../models/member.model');
const Bill = require('../models/bill.model');
const Payment = require('../models/payment.model');
const Expense = require('../models/expense.model');
const { handle200, handle500 } = require('../helper/responseHandler');

// @desc    Get dashboard summary data
// @route   GET /api/dashboard?month=2026-03
// @access  Private
const getDashboard = async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);

        // Members summary
        const allMembers = await Member.find();
        const activeMembers = allMembers.filter(m => m.status === 'active');
        const monthlyMembers = activeMembers.filter(m => m.messType === 'monthly');
        const tiffinMembers = activeMembers.filter(m => m.messType === 'tiffin');

        // Bills for this month
        const bills = await Bill.find({ monthYear: month })
            .populate('memberId', 'name mobile address messType');

        const totalBillAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalPending = bills.reduce((sum, b) => sum + (b.pendingAmount || 0), 0);

        // Payments for this month
        const startDate = new Date(month + '-01');
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const payments = await Payment.find({
            date: { $gte: startDate, $lt: endDate }
        }).populate('memberId', 'name mobile address');

        const totalCollection = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Expenses for this month
        const expenses = await Expense.find({
            date: { $gte: startDate, $lt: endDate }
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Pie chart data
        const paidBills = bills.filter(b => (b.status || '').toLowerCase() === 'paid').length;
        const pendingBills = bills.filter(b => (b.status || '').toLowerCase() !== 'paid').length;

        // Recent payments (last 5)
        const recentPayments = await Payment.find()
            .populate('memberId', 'name mobile address')
            .sort({ date: -1 })
            .limit(5);

        // Pending bills list (top 5)
        const pendingBillsList = await Bill.find({
            monthYear: month,
            status: { $ne: 'Paid' }
        })
            .populate('memberId', 'name mobile address messType')
            .sort({ pendingAmount: -1 })
            .limit(5);

        // Chart data - last 6 months
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7); // yyyy-MM
            const monthLabel = date.toLocaleString('default', { month: 'short' });

            const mStartDate = new Date(monthKey + '-01');
            const mEndDate = new Date(mStartDate);
            mEndDate.setMonth(mEndDate.getMonth() + 1);

            const mPayments = await Payment.find({
                date: { $gte: mStartDate, $lt: mEndDate }
            });
            const mCollection = mPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            const mExpenses = await Expense.find({
                date: { $gte: mStartDate, $lt: mEndDate }
            });
            const mExpenseTotal = mExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            chartData.push({
                name: monthLabel,
                collection: mCollection,
                expense: mExpenseTotal
            });
        }

        handle200(res, {
            members: {
                total: allMembers.length,
                active: activeMembers.length,
                monthly: monthlyMembers.length,
                tiffin: tiffinMembers.length
            },
            financial: {
                totalBillAmount,
                totalCollection,
                totalPending,
                totalExpenses,
                netProfit: totalCollection - totalExpenses
            },
            pieChart: {
                paid: paidBills,
                pending: pendingBills
            },
            recentPayments: recentPayments.map(p => ({
                _id: p._id,
                amount: p.amount,
                method: p.method,
                date: p.date,
                member: p.memberId ? {
                    _id: p.memberId._id,
                    name: p.memberId.name,
                    address: p.memberId.address
                } : null
            })),
            pendingBills: pendingBillsList.map(b => ({
                _id: b._id,
                totalAmount: b.totalAmount,
                pendingAmount: b.pendingAmount,
                status: b.status,
                messType: b.memberId?.messType || 'monthly',
                member: b.memberId ? {
                    _id: b.memberId._id,
                    name: b.memberId.name,
                    address: b.memberId.address
                } : null
            })),
            chartData
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        handle500(res, error);
    }
};

module.exports = { getDashboard };
