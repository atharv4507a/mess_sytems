import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Wallet,
  CalendarDays,
  UtensilsCrossed,
} from 'lucide-react';
import { format } from 'date-fns';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { darkMode } = useAuthStore();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    members: { total: 0, active: 0, monthly: 0, tiffin: 0 },
    financial: { totalBillAmount: 0, totalCollection: 0, totalPending: 0, totalExpenses: 0, netProfit: 0 },
    pieChart: { paid: 0, pending: 0 },
    recentPayments: [],
    pendingBills: [],
    chartData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/dashboard', { params: { month: currentMonth } });
        setDashboardData(res.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentMonth]);

  const { members, financial, pieChart, recentPayments, pendingBills, chartData } = dashboardData;

  const stats = [
    {
      label: 'Total Members',
      value: members.total,
      subValue: `${members.active} Active`,
      icon: Users,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Total Collection',
      value: `₹${financial.totalCollection.toLocaleString()}`,
      subValue: 'This Month',
      icon: IndianRupee,
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Pending Amount',
      value: `₹${financial.totalPending.toLocaleString()}`,
      subValue: `${pieChart.pending} Bills`,
      icon: Clock,
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Monthly Expense',
      value: `₹${financial.totalExpenses.toLocaleString()}`,
      subValue: financial.netProfit >= 0 ? 'In Profit' : 'In Loss',
      icon: Wallet,
      bgColor: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
    },
  ];

  const pieData = [
    { name: 'Paid', value: pieChart.paid, color: '#10b981' },
    { name: 'Pending', value: pieChart.pending, color: '#ef4444' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome! Overview of your mess.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {format(new Date(), 'MMMM yyyy')}
          </span>
        </div>
      </div>

      {/* Member Type Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-blue-100">Monthly Mess</span>
          </div>
          <p className="text-3xl font-bold">
            {isLoading ? '...' : members.monthly}
          </p>
          <p className="text-sm text-blue-100 mt-1">Members</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-orange-100">Tiffin</span>
          </div>
          <p className="text-3xl font-bold">
            {isLoading ? '...' : members.tiffin}
          </p>
          <p className="text-sm text-orange-100 mt-1">Members</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            onClick={index === 2 ? () => navigate('/bills') : undefined}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 transition-all ${index === 2 ? 'cursor-pointer hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500' : 'hover:shadow-lg'}`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              {index === 1 && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> 12%
                </span>
              )}
              {index === 2 && financial.totalPending > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {isLoading ? '...' : stat.value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {stat.label}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {stat.subValue}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Profit/Loss Banner */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl p-6 ${
          financial.netProfit >= 0
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {financial.netProfit >= 0 ? (
                <TrendingUp className="w-8 h-8 text-white" />
              ) : (
                <TrendingDown className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-white/80 text-sm">This month's {financial.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
              <p className="text-3xl font-bold text-white">
                ₹{Math.abs(financial.netProfit).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-white/90">
            <div>
              <p className="text-sm text-white/70">Collection</p>
              <p className="text-lg font-semibold">₹{financial.totalCollection.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-white/70">Expense</p>
              <p className="text-lg font-semibold">₹{financial.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Collection vs Expense
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="collection"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollection)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Bill Status
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Recent Payments
            </h3>
            <Link
               to="/payments"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                No recent payments
              </p>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {payment.member?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(payment.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +₹{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {payment.method}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Pending Bills */}
        <motion.div
           variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Pending Bills
            </h3>
            <Link
              to="/bills"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pendingBills.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                No pending bills
              </p>
            ) : (
              pendingBills.map((bill) => (
                <Link
                  key={bill._id}
                  to={`/bills?pay=${bill._id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      bill.messType === 'monthly'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {bill.messType === 'monthly' ? (
                        <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {bill.member?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {bill.member?.address?.substring(0, 20)}... • {bill.messType === 'monthly' ? 'Monthly' : 'Tiffin'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      ₹{bill.pendingAmount.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        bill.status === 'partial'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
