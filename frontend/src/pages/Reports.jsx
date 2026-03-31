import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';
import toast from 'react-hot-toast';

export default function Reports() {
  const { darkMode } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportType, setReportType] = useState('monthly');
  const [selectedMember, setSelectedMember] = useState('');
  
  const [members, setMembers] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      toast.error('Failed to load members');
    }
  };

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const [b, p, e] = await Promise.all([
        api.get('/bills', { params: { monthYear: selectedMonth } }),
        api.get('/payments', { params: { startDate: `${selectedMonth}-01`, endDate: format(endOfMonth(new Date(`${selectedMonth}-01`)), 'yyyy-MM-dd') } }),
        api.get('/expenses', { params: { month: selectedMonth } })
      ]);
      setBills(b.data);
      setPayments(p.data);
      setExpenses(e.data);
    } catch (err) {
      toast.error('Failed to load monthly reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async () => {
    if (!selectedMember) return;
    try {
      setLoading(true);
      const [b, p] = await Promise.all([
        api.get('/bills', { params: { memberId: selectedMember } }),
        api.get('/payments', { params: { memberId: selectedMember } })
      ]);
      setBills(b.data);
      setPayments(p.data);
    } catch (err) {
      toast.error('Failed to load member reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'monthly') {
      fetchMonthlyData();
    } else if (reportType === 'member') {
      fetchMemberData();
    }
  }, [selectedMonth, reportType, selectedMember]);


  // Monthly calculations
  const totalCollection = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPending = bills.reduce((sum, b) => sum + (b.pendingAmount || 0), 0);
  const profitLoss = totalCollection - totalExpense;

  // Daily collection data for chart
  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayPayments = payments.filter((p) => {
      const pDate = p.date || p.paymentDate;
      return pDate && pDate.startsWith(dateStr);
    });
    const dayExpenses = expenses.filter((e) => {
      const eDate = e.date;
      return eDate && eDate.startsWith(dateStr);
    });
    return {
      date: format(day, 'dd'),
      collection: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      expense: dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    };
  });

  const memberData = selectedMember ? members.find((m) => (m._id || m.id) === selectedMember) : null;

  const generateMonthlyPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MessPay - Monthly Report', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(selectedMonth + '-01'), 'MMMM yyyy'), pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 45);

    const summaryData = [
      ['Total Billed', `Rs. ${totalBilled.toLocaleString()}`],
      ['Total Collection', `Rs. ${totalCollection.toLocaleString()}`],
      ['Pending Amount', `Rs. ${totalPending.toLocaleString()}`],
      ['Total Expense', `Rs. ${totalExpense.toLocaleString()}`],
      ['Profit/Loss', `Rs. ${profitLoss.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Bills Table
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bills', 14, finalY);

    const billsData = bills.map((bill) => {
      const member = bill.memberId || members.find(m => m._id === bill.memberId);
      return [
        member?.name || 'Unknown',
        member?.address?.substring(0, 15) || '-',
        `Rs. ${(bill.totalAmount || 0).toLocaleString()}`,
        `Rs. ${(bill.paidAmount || 0).toLocaleString()}`,
        `Rs. ${(bill.pendingAmount || 0).toLocaleString()}`,
        bill.status || 'Pending',
      ];
    });

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Member', 'Room', 'Total', 'Paid', 'Pending', 'Status']],
      body: billsData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Expenses Table
    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Expenses', 14, finalY);

    const expensesData = expenses.map((exp) => [
      format(new Date(exp.date), 'dd MMM'),
      exp.category,
      exp.description,
      `Rs. ${(exp.amount || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: expensesData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    doc.save(`MessPay_Report_${selectedMonth}.pdf`);
  };

  const generateMemberPDF = () => {
    if (!memberData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MessPay - Member Report', pageWidth / 2, 20, { align: 'center' });

    // Member Info
    doc.setFontSize(14);
    doc.text('Member Details', 14, 40);

    const memberInfo = [
      ['Name', memberData.name],
      ['Mobile', memberData.mobile],
      ['Room No', memberData.address],
      ['Joining Date', format(new Date(memberData.joiningDate), 'dd MMM yyyy')],
      ['Status', memberData.status],
    ];

    autoTable(doc, {
      startY: 45,
      body: memberInfo,
      theme: 'plain',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });

    // Bills History
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bills History', 14, finalY);

    const billsData = bills.map((bill) => [
      format(new Date((bill.monthYear || bill.month) + '-01'), 'MMM yyyy'),
      `Rs. ${(bill.totalAmount || 0).toLocaleString()}`,
      `Rs. ${(bill.paidAmount || 0).toLocaleString()}`,
      `Rs. ${(bill.pendingAmount || 0).toLocaleString()}`,
      bill.status || 'Pending',
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Month', 'Total', 'Paid', 'Pending', 'Status']],
      body: billsData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Payment History
    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment History', 14, finalY);

    const paymentsData = payments.map((p) => [
      format(new Date(p.date || p.paymentDate), 'dd MMM yyyy'),
      `Rs. ${(p.amount || 0).toLocaleString()}`,
      p.method || p.paymentMethod,
      p.notes || '-',
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Amount', 'Method', 'Notes']],
      body: paymentsData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Summary
    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY);

    const summaryData = [
      ['Total Billed', `Rs. ${totalBilled.toLocaleString()}`],
      ['Total Paid', `Rs. ${totalCollection.toLocaleString()}`],
      ['Total Due', `Rs. ${totalPending.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: finalY + 5,
      body: summaryData,
      theme: 'striped',
      columnStyles: { 0: { fontStyle: 'bold' } },
    });

    doc.save(`MessPay_${memberData.name.replace(/\s+/g, '_')}_Report.pdf`);
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
            Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generate and download reports
          </p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setReportType('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            reportType === 'monthly'
              ? 'bg-emerald-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Monthly Report
        </button>
        <button
          onClick={() => setReportType('member')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            reportType === 'member'
              ? 'bg-emerald-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Member Report
        </button>
      </div>

      {loading && <div className="text-center py-4 text-slate-500">Loading data...</div>}

      {!loading && reportType === 'monthly' ? (
        <>
          {/* Month Selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              onClick={generateMonthlyPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Total Billed</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                ₹{totalBilled.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <IndianRupee className="w-4 h-4" />
                <span className="text-sm">Collection</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                ₹{totalCollection.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <IndianRupee className="w-4 h-4" />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-xl font-bold text-amber-600">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Expense</span>
              </div>
              <p className="text-xl font-bold text-rose-600">
                ₹{totalExpense.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-xl p-4 ${
              profitLoss >= 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {profitLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm">{profitLoss >= 0 ? 'Profit' : 'Loss'}</span>
              </div>
              <p className={`text-xl font-bold ${
                profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                ₹{Math.abs(profitLoss).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Daily Collection vs Expense
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: 'none',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="collection"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bills Summary Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Bills Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Member
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Room
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Total
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Paid
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Pending
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {bills.map((bill) => {
                    const member = bill.memberId || members.find((m) => m._id === bill.memberId);
                    return (
                      <tr key={bill._id || bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                          {member?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {member?.address?.substring(0, 15)}
                        </td>
                        <td className="px-6 py-4 text-slate-800 dark:text-white">
                          ₹{(bill.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-emerald-600">
                          ₹{(bill.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-amber-600">
                          ₹{(bill.pendingAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bill.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : bill.status === 'Partial'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {bill.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : !loading && reportType === 'member' ? (
        <>
          {/* Member Selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.name} - Room {m.roomNo}
                </option>
              ))}
            </select>
            {selectedMember && (
              <button
                onClick={generateMemberPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>

          {selectedMember && memberData && (
            <>
              {/* Member Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    {memberData.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      {memberData.name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                      {memberData.address?.substring(0, 25)}... • {memberData.mobile}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      Joined: {format(new Date(memberData.joiningDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span
                    className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                      memberData.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {memberData.status}
                  </span>
                </div>
              </div>

              {/* Member Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Billed</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    ₹{totalBilled.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₹{totalCollection.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Due</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ₹{totalPending.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Member Bills */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Bills History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Month
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Total
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Paid
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Pending
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bills.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                            No bills found
                          </td>
                        </tr>
                      ) : (
                        bills.map((bill) => (
                          <tr key={bill.id || bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                              {format(new Date((bill.monthYear || bill.month) + '-01'), 'MMMM yyyy')}
                            </td>
                            <td className="px-6 py-4 text-slate-800 dark:text-white">
                              ₹{(bill.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-emerald-600">
                              ₹{(bill.paidAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-amber-600">
                              ₹{(bill.pendingAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  bill.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : bill.status === 'Partial'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {bill.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Payment History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Date
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Amount
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Method
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                            No payments found
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment._id || payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="px-6 py-4 text-slate-800 dark:text-white">
                              {format(new Date(payment.date || payment.paymentDate), 'dd MMM yyyy')}
                            </td>
                            <td className="px-6 py-4 font-semibold text-emerald-600">
                              +₹{(payment.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
                              {payment.method || payment.paymentMethod}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {payment.notes || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </motion.div>
  );
}
