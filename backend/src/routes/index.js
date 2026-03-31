const express = require('express');
const router = express.Router();

// Import Routes
const authRoutes = require('./auth.routes');
const memberRoutes = require('./member.routes');
const expenseRoutes = require('./expense.routes');
const tiffinRoutes = require('./tiffin.routes');
const leaveRoutes = require('./leave.routes');
const billRoutes = require('./bill.routes');
const paymentRoutes = require('./payment.routes');
const dashboardRoutes = require('./dashboard.routes');

// Setup Routes
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/expenses', expenseRoutes);
router.use('/tiffins', tiffinRoutes);
router.use('/leaves', leaveRoutes);
router.use('/bills', billRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
