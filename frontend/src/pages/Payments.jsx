import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  IndianRupee,
  Calendar,
  Download,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import api from '../api';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/payments', {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          method: methodFilter,
        }
      });
      setPayments(res.data);
    } catch (error) {
      toast.error('Failed to load payments');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Basic debounce for date range or method changes
    const timer = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [dateRange.start, dateRange.end, methodFilter]);

  // Local search filter for member name/room No since backend only filters by exact memberId
  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const member = p.memberId || {};
    const search = searchQuery.toLowerCase();
    return (
      (member.name || '').toLowerCase().includes(search) ||
      (member.roomNo || '').toLowerCase().includes(search)
    );
  });

  const totalCollection = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashCollection = filteredPayments
    .filter((p) => p.method?.toLowerCase() === 'cash' || p.paymentMethod?.toLowerCase() === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const onlineCollection = filteredPayments
    .filter((p) => p.method?.toLowerCase() !== 'cash' && p.paymentMethod?.toLowerCase() !== 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Member', 'Room', 'Amount', 'Method', 'Notes'];
    const csvData = filteredPayments.map((p) => {
      const member = p.memberId || {};
      return [
        format(new Date(p.date || p.paymentDate), 'yyyy-MM-dd'),
        member.name || 'Unknown',
        member.roomNo || '-',
        p.amount || 0,
        p.method || p.paymentMethod || '-',
        p.notes || '-',
      ].join(',');
    });
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
            Payments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track all payment transactions
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-emerald-100">Total Collection</span>
          </div>
          <p className="text-3xl font-bold">₹{totalCollection.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-1">{filteredPayments.length} transactions</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-slate-500 dark:text-slate-400">Cash</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            ₹{cashCollection.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-slate-500 dark:text-slate-400">Online</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            ₹{onlineCollection.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by member name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'cash', 'upi'].map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                  methodFilter === method
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Member
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">
                  Method
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                  Bill Month
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden xl:table-cell">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const member = payment.memberId || {};
                  const bill = payment.billId || {};
                  const isCash = (payment.method || payment.paymentMethod)?.toLowerCase() === 'cash';
                  return (
                    <motion.tr
                      key={payment._id || payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name ? member.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {member.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {member.address?.substring(0, 20) || 'No Address'}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(payment.date || payment.paymentDate), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          +₹{(payment.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            isCash
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {isCash ? <Banknote className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {payment.method || payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                        {bill.monthYear ? format(new Date(bill.monthYear + '-01'), 'MMM yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell text-slate-500 dark:text-slate-400 text-sm">
                        {payment.notes || '-'}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
