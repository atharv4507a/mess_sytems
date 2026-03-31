import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  X,
  Download,
  MessageCircle,
  UtensilsCrossed,
  CalendarDays,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmation from '../../.agents/rules/components/DeleteConfirmation';
import api from '../api';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messTypeFilter, setMessTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    parentMobile: '',
    address: '',
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active',
    messType: 'monthly',
    foodType: 'veg',
    monthlyCharge: 3000,
    tiffinRate: 60,
  });

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/members', {
        params: { search: debouncedSearch, messType: messTypeFilter }
      });
      setMembers(res.data);
    } catch (error) {
      toast.error('Failed to fetch members');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch, messTypeFilter]);

  const handleOpenModal = (member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        mobile: member.mobile,
        parentMobile: member.parentMobile || '',
        address: member.address,
        joiningDate: member.joiningDate,
        status: member.status,
        messType: member.messType,
        foodType: member.foodType || 'veg',
        monthlyCharge: member.monthlyCharge,
        tiffinRate: member.tiffinRate,
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        mobile: '',
        parentMobile: '',
        address: '',
        joiningDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'active',
        messType: 'monthly',
        foodType: 'veg',
        monthlyCharge: 3000,
        tiffinRate: 60,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id || editingMember.id}`, formData);
        toast.success('Member updated successfully');
      } else {
        await api.post('/members', formData);
        toast.success('Member added successfully');
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member removed successfully');
      setDeleteConfirm(null);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting member');
    }
  };

  const handleWhatsAppReminder = (member) => {
    const message = encodeURIComponent(
      `Hello ${member.name}, this is a gentle reminder regarding your mess payment. Please make the payment soon. Thank you!`
    );
    window.open(`https://wa.me/91${member.mobile}?text=${message}`, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Mobile', 'Parent Mobile', 'Address', 'Joining Date', 'Status', 'Mess Type', 'Monthly Charge', 'Tiffin Rate'];
    const csvData = members.map((m) =>
      [m.name, m.mobile, m.parentMobile || '', m.address, m.joiningDate, m.status, m.messType, m.monthlyCharge, m.tiffinRate].join(',')
    );
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    a.click();
  };

  const monthlyCount = members.filter((m) => m.messType === 'monthly' && m.status === 'active').length;
  const tiffinCount = members.filter((m) => m.messType === 'tiffin' && m.status === 'active').length;
  const vegCount = members.filter((m) => (m.foodType || 'veg') === 'veg' && m.status === 'active').length;
  const nonVegCount = members.filter((m) => m.foodType === 'nonveg' && m.status === 'active').length;

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
            Members
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage Mess Members
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-slate-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Active</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {members.filter((m) => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
            {members.filter((m) => m.status === 'inactive').length}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-600 dark:text-blue-400">Monthly Mess</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyCount}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-sm text-orange-600 dark:text-orange-400">Tiffin</p>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tiffinCount}</p>
        </div>
      </div>

      {/* Veg/NonVeg Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 flex items-center gap-4">
          <span className="text-2xl">🥦</span>
          <div>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Veg Members</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{vegCount}</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 flex items-center gap-4">
          <span className="text-2xl">🍗</span>
          <div>
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">Non-Veg Members</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{nonVegCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, mobile, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'monthly', 'tiffin'].map((type) => (
            <button
              key={type}
              onClick={() => setMessTypeFilter(type)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                messTypeFilter === type
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'all' ? 'All' : type === 'monthly' ? 'Monthly' : 'Tiffin'}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            No Members Found
          </div>
        ) : (
          members.map((member) => (
            <motion.div
              key={member._id || member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      member.messType === 'monthly'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {member.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.messType === 'monthly'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {member.messType === 'monthly' ? (
                          <><CalendarDays className="w-3 h-3" /> Monthly</>
                        ) : (
                          <><UtensilsCrossed className="w-3 h-3" /> Tiffin</>
                        )}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{member.mobile}</span>
                  </div>
                  {member.parentMobile && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                      <Phone className="w-4 h-4" />
                      <span>Parent: {member.parentMobile}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{member.address}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-white">
                      ₹{member.messType === 'monthly' ? member.monthlyCharge.toLocaleString() + '/month' : member.tiffinRate + '/Tiffin'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      (member.foodType || 'veg') === 'veg'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {(member.foodType || 'veg') === 'veg' ? '🥦 Veg' : '🍗 Non-Veg'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleWhatsAppReminder(member)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleOpenModal(member)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-l border-slate-200 dark:border-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(member._id || member.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-slate-200 dark:border-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingMember ? 'Edit Member' : 'Add Member'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="px-6 py-4 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Member Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="10 digit mobile number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Parent Mobile Number <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.parentMobile}
                    onChange={(e) => setFormData({ ...formData, parentMobile: e.target.value })}
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Parent Mobile Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Detailed Address"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mess Type *
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, messType: 'monthly' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        formData.messType === 'monthly'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Monthly Mess
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, messType: 'tiffin' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        formData.messType === 'tiffin'
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      Tiffin
                    </button>
                  </div>
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Food Preference *
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foodType: 'veg' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        (formData.foodType || 'veg') === 'veg'
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>🥦</span>
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foodType: 'nonveg' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        formData.foodType === 'nonveg'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>🍗</span>
                      Non-Veg
                    </button>
                  </div>
                </div>

                {formData.messType === 'monthly' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Monthly Rate (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyCharge}
                      onChange={(e) => setFormData({ ...formData, monthlyCharge: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      min="0"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Per Tiffin Rate (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.tiffinRate}
                      onChange={(e) => setFormData({ ...formData, tiffinRate: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      min="0"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all"
                    >
                      {editingMember ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Remove Member?"
        message="Are you sure you want to remove this member? This action cannot be undone."
      />
    </motion.div>
  );
}
