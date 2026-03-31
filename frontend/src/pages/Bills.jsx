import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Eye, CreditCard, IndianRupee,
  CalendarDays, UtensilsCrossed, Trash2, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import DeleteConfirmation from '../../.agents/rules/components/DeleteConfirmation';
import api from '../api';

export default function Bills() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bills, setBills] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // New states for preview modal
  const [memberLeaves, setMemberLeaves] = useState([]);
  const [memberTiffins, setMemberTiffins] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const [formData, setFormData] = useState({
    memberId: '',
    month: format(new Date(), 'yyyy-MM'),
    extraCharges: [],
    initialPayment: 0,
    paymentMethod: 'cash',
  });

  const [newExtraCharge, setNewExtraCharge] = useState({ name: '', amount: '' });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) { console.error('Error fetching members:', err); }
  };

  const fetchBillsAndPayments = async () => {
    try {
      setLoading(true);
      const [billsRes, paymentsRes] = await Promise.all([
        api.get('/bills', { params: { monthYear: monthFilter } }),
        api.get('/payments', { params: { } })
      ]);
      setBills(billsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchBillsAndPayments();
  }, [monthFilter]);

  const selectedMember = formData.memberId ? members.find((m) => m._id === formData.memberId || m.id === formData.memberId) : null;

  // Fetch extra data for bill generation preview
  useEffect(() => {
    if (formData.memberId && selectedMember) {
      if (selectedMember.messType === 'monthly') {
        api.get('/leaves', { params: { memberId: formData.memberId, month: formData.month } })
          .then(res => setMemberLeaves(res.data))
          .catch(err => console.error(err));
      } else {
        api.get('/tiffins', { params: { memberId: formData.memberId, month: formData.month } })
          .then(res => setMemberTiffins(res.data))
          .catch(err => console.error(err));
      }
    } else {
      setMemberLeaves([]);
      setMemberTiffins([]);
    }
  }, [formData.memberId, formData.month, selectedMember]);

  const filteredBills = bills.filter((b) => {
    if (!debouncedSearchQuery) return true;
    const search = debouncedSearchQuery.toLowerCase();
    const m = (b.memberId?.name || '').toLowerCase();
    const addr = (b.memberId?.address || '').toLowerCase();
    return m.includes(search) || addr.includes(search);
  });

  const getPaymentsByBill = (billId) => {
    return payments.filter(p => p.billId === billId || p.billId?._id === billId);
  };

  const handleAddExtraCharge = () => {
    if (newExtraCharge.name && newExtraCharge.amount) {
      setFormData({
        ...formData,
        extraCharges: [
          ...formData.extraCharges,
          { id: uuidv4(), name: newExtraCharge.name, amount: parseFloat(newExtraCharge.amount) },
        ],
      });
      setNewExtraCharge({ name: '', amount: '' });
    }
  };

  const handleRemoveExtraCharge = (id) => {
    setFormData({
      ...formData,
      extraCharges: formData.extraCharges.filter((c) => c.id !== id),
    });
  };

  const calculateBillPreview = () => {
    if (!selectedMember) return null;

    if (selectedMember.messType === 'monthly') {
      const perDayRate = (selectedMember.monthlyCharge / 30);
      const leaveAdjustment = Math.round(memberLeaves.length * perDayRate);
      const extraTotal = formData.extraCharges.reduce((sum, c) => sum + c.amount, 0);
      const total = selectedMember.monthlyCharge - leaveAdjustment + extraTotal;
      return {
        baseAmount: selectedMember.monthlyCharge,
        leaveAdjustment: -leaveAdjustment,
        extraTotal,
        total: Math.round(Math.max(0, total)),
      };
    } else {
      const totalTiffins = memberTiffins.reduce((sum, t) => sum + (t.tiffinCount || 0), 0);
      const tiffinAmount = totalTiffins * selectedMember.tiffinRate;
      const extraTotal = formData.extraCharges.reduce((sum, c) => sum + c.amount, 0);
      const total = tiffinAmount + extraTotal;
      return {
        totalTiffins,
        tiffinRate: selectedMember.tiffinRate,
        tiffinAmount,
        extraTotal,
        total: Math.round(Math.max(0, total)),
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    const preview = calculateBillPreview();
    if (!preview) return;

    try {
      const totalAmount = preview.total;
      
      const res = await api.post('/bills', {
        memberId: formData.memberId,
        monthYear: formData.month,
        totalAmount,
        paidAmount: 0,
        extraCharges: formData.extraCharges,
        leaveAdjustment: preview.leaveAdjustment || 0,
        monthlyCharge: selectedMember.monthlyCharge,
        tiffinRate: selectedMember.tiffinRate,
        totalTiffins: preview.totalTiffins || 0,
        tiffinAmount: preview.tiffinAmount || 0,
        messType: selectedMember.messType,
      });

      const newBill = res.data;

      if (formData.initialPayment > 0) {
        await api.post('/payments', {
          memberId: formData.memberId,
          billId: newBill._id,
          amount: formData.initialPayment,
          method: formData.paymentMethod === 'online' ? 'UPI' : 'Cash',
          date: new Date(),
          installmentNumber: 1,
          notes: 'Initial Payment',
        });
      }

      setIsModalOpen(false);
      toast.success('Bill generated successfully');
      setFormData({
        memberId: '',
        month: format(new Date(), 'yyyy-MM'),
        extraCharges: [],
        initialPayment: 0,
        paymentMethod: 'cash',
      });
      fetchBillsAndPayments();
    } catch (error) {
      console.error('Submit Bill Error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleOpenPayment = (billId) => {
    setSelectedBill(billId);
    const bill = bills.find((b) => b._id === billId || b.id === billId);
    setPaymentData({
      amount: bill?.pendingAmount?.toString() || '',
      paymentMethod: 'cash',
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    const bill = bills.find((b) => b._id === selectedBill || b.id === selectedBill);
    if (!bill) return;

    const amount = parseFloat(paymentData.amount);
    const installmentCount = getPaymentsByBill(selectedBill).length + 1;
    
    try {
      await api.post('/payments', {
        memberId: bill.memberId?._id || bill.memberId,
        billId: selectedBill,
        amount,
        method: paymentData.paymentMethod === 'online' ? 'UPI' : 'Cash',
        date: new Date(),
        installmentNumber: installmentCount,
        notes: paymentData.notes || `Installment ${installmentCount}`,
      });
      toast.success('Payment added successfully');
      setIsPaymentModalOpen(false);
      fetchBillsAndPayments();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  };

  useEffect(() => {
    const payId = searchParams.get('pay');
    if (payId && bills.length > 0) {
      handleOpenPayment(payId);
      searchParams.delete('pay');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, bills, setSearchParams]);

  const handleViewBill = (billId) => {
    setSelectedBill(billId);
    setIsViewModalOpen(true);
  };

  const selectedBillData = selectedBill ? bills.find((b) => b._id === selectedBill || b.id === selectedBill) : null;
  const billPayments = selectedBill ? getPaymentsByBill(selectedBill) : [];
  const preview = calculateBillPreview();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">Monthly Bills</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage bills</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBillsAndPayments} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25">
            <Plus className="w-4 h-4" />
            Create Bills
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search Members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
        </div>
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
          {loading && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full" />}
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Bills</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{filteredBills.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">₹{filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Collection</p>
          <p className="text-2xl font-bold text-emerald-600">
            ₹{payments.filter(p => !monthFilter || (p.date && p.date.startsWith(monthFilter))).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            ₹{filteredBills.reduce((sum, b) => sum + (b.pendingAmount || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">No bills this month</div>
        ) : (
          filteredBills.map((bill) => {
            const member = bill.memberId || {};
            const payments = getPaymentsByBill(bill._id || bill.id);
            return (
              <motion.div key={bill._id || bill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                        bill.messType === 'monthly' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'
                      }`}>
                        {member?.name ? member.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{member?.name || 'Unknown Member'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{member?.address ? `${member.address.substring(0, 25)}...` : 'No address'} • {bill.messType === 'monthly' ? 'Monthly' : 'Tiffin'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : bill.status === 'Pending' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {bill.status || 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {bill.messType === 'monthly' ? (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Monthly Rate</span>
                        <span>₹{bill.monthlyCharge?.toLocaleString() || member.monthlyCharge}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>{bill.totalTiffins || 0} Tiffin × ₹{bill.tiffinRate || member.tiffinRate}</span>
                        <span>₹{bill.tiffinAmount?.toLocaleString() || 0}</span>
                      </div>
                    )}
                    {(bill.leaveAdjustment || 0) < 0 && (
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span>Leave Deduction</span>
                        <span>₹{(bill.leaveAdjustment || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(bill.extraCharges || []).length > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Extra</span>
                        <span>+₹{bill.extraCharges.reduce((s, c) => s + c.amount, 0)?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                        <span>Total Bill</span>
                        <span>₹{bill.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Paid ({payments.length} installments)</span>
                      <span>₹{(bill.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    {bill.pendingAmount > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                        <span>Pending</span>
                        <span>₹{bill.pendingAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex border-t border-slate-200 dark:border-slate-700">
                  <button onClick={() => handleViewBill(bill._id || bill.id)} className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  {bill.status !== 'Paid' && (
                    <button onClick={() => handleOpenPayment(bill._id || bill.id)} className="flex-1 flex items-center justify-center gap-2 py-3 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-l border-slate-200 dark:border-slate-700">
                      <CreditCard className="w-4 h-4" /> Payment
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Generate Bill Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create Bills</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="createBillForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Month *</label>
                    <input type="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value, memberId: '', initialPayment: 0 })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Members *</label>
                    <select value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required>
                      <option value="">Select Member</option>
                      {members.filter((m) => m.status === 'active' && !bills.some((b) => (b.memberId?._id === m._id || b.memberId === m._id) && b.monthYear === formData.month)).map((m) => (
                        <option key={m._id || m.id} value={m._id || m.id}>{m.name} ({m.messType === 'monthly' ? 'Monthly' : 'Tiffin'})</option>
                      ))}
                    </select>
                  </div>
                  {selectedMember && (
                    <div className={`p-4 rounded-xl ${selectedMember.messType === 'monthly' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'}`}>
                      <p className={`text-sm ${selectedMember.messType === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {selectedMember.messType === 'monthly' ? `Monthly Rate: ₹${selectedMember.monthlyCharge?.toLocaleString()}` : `₹${selectedMember.tiffinRate}/Tiffin`}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Extra (Milk, Others)</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Name" value={newExtraCharge.name} onChange={(e) => setNewExtraCharge({ ...newExtraCharge, name: e.target.value })} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="number" placeholder="Amount" value={newExtraCharge.amount} onChange={(e) => setNewExtraCharge({ ...newExtraCharge, amount: e.target.value })} className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <button type="button" onClick={handleAddExtraCharge} className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                    {formData.extraCharges.length > 0 && (
                      <div className="space-y-2">
                        {formData.extraCharges.map((charge) => (
                          <div key={charge.id} className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{charge.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-white">₹{charge.amount}</span>
                              <button type="button" onClick={() => handleRemoveExtraCharge(charge.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"><Trash2 className="w-3 h-3 text-red-500" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {preview && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-medium text-emerald-700 dark:text-emerald-300 mb-3">Bills Preview</h4>
                      <div className="space-y-2 text-sm">
                        {preview.baseAmount !== undefined ? (
                          <>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Monthly Rate</span><span>₹{preview.baseAmount.toLocaleString()}</span></div>
                            {preview.leaveAdjustment < 0 && (<div className="flex justify-between text-purple-600 dark:text-purple-400"><span>Leave Deduction</span><span>₹{preview.leaveAdjustment.toLocaleString()}</span></div>)}
                          </>
                        ) : (
                          <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{preview.totalTiffins} Tiffin × ₹{preview.tiffinRate}</span><span>₹{preview.tiffinAmount.toLocaleString()}</span></div>
                        )}
                        {preview.extraTotal > 0 && (<div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Extra</span><span>+₹{preview.extraTotal.toLocaleString()}</span></div>)}
                        <div className="border-t border-emerald-200 dark:border-emerald-700 pt-2"><div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300"><span>Total</span><span>₹{preview.total.toLocaleString()}</span></div></div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Initial Payment (Optional)</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
                        <input type="number" value={formData.initialPayment} onChange={(e) => setFormData({ ...formData, initialPayment: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl" min="0" max={preview ? preview.total : undefined} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
                        <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                          <option value="cash">Cash</option><option value="online">Online/UPI</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0 flex gap-3 bg-slate-50 dark:bg-slate-800/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" form="createBillForm" disabled={!selectedMember} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg cursor-pointer">Create Bills</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Bill Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedBillData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setIsViewModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bills Details</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div><h3 className="font-semibold">{selectedBillData.memberId?.name}</h3></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Total</span><span>₹{selectedBillData.totalAmount?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Pending</span><span>₹{selectedBillData.pendingAmount?.toLocaleString()}</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedBillData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setIsPaymentModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Payment Add</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                    <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl" max={selectedBillData.pendingAmount} min="1" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online/UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="E.g., Installment payment"
                  />
                </div>

                <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl">Add</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
