import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarOff, Save, Calendar, Info } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

export default function LeaveEntry() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [members, setMembers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveDays, setLeaveDays] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchLeaves();
    }
  }, [selectedMonth, members]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.filter(m => m.messType === 'monthly' && m.status === 'active'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load members');
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves', { params: { month: selectedMonth } });
      setLeaves(res.data);
      
      const days = {};
      members.forEach((member) => {
        const record = res.data.find(l => (l.memberId?._id || l.memberId) === member._id);
        days[member._id] = record?.leaveDays || 0;
      });
      setLeaveDays(days);
      setSaved(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setSaved(false);
  };

  const handleLeaveDaysChange = (memberId, days) => {
    setLeaveDays((prev) => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(31, days)),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      // Loop over members and save their leaves
      const promises = members.map(async (member) => {
        const days = leaveDays[member._id] || 0;
        
        // Find existing record
        const existing = leaves.find(l => (l.memberId?._id || l.memberId) === member._id);
        
        if (days > 0) {
          // Calculate date. A proper date implementation requires setting date safely
          const date = `${selectedMonth}-01`;
          await api.post('/leaves', {
            memberId: member._id,
            date: date,
            month: selectedMonth,
            leaveDays: days
          }).catch(async (e) => {
            if(e.response && e.response.status === 422) {
               // Assuming validation error or already exists, try to update if possible or delete then post?
               // Wait, our backend doesn't have an update endpoint, it has POST and DELETE.
               // We should delete first before inserting a new one.
               if (existing) {
                  await api.delete('/leaves', { data: { memberId: member._id, date: date } });
                  await api.post('/leaves', {
                    memberId: member._id,
                    date: date,
                    month: selectedMonth,
                    leaveDays: days
                  });
               }
            }
          });
        } else if (existing) {
          // Delete leave if days set to 0
          const date = `${selectedMonth}-01`;
          await api.delete('/leaves', { data: { memberId: member._id, date: date } });
        }
      });
      await Promise.all(promises);
      
      setSaved(true);
      toast.success('Leave records saved successfully');
      setTimeout(() => setSaved(false), 2000);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to save leaves');
    }
  };

  const nextMonth = format(addMonths(new Date(selectedMonth + '-01'), 1), 'MMMM yyyy');
  const totalLeaveDays = Object.values(leaveDays).reduce((sum, days) => sum + days, 0);

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
            Leave Entry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Log Monthly Mess Members leaves
          </p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <span className="text-lg font-medium text-slate-800 dark:text-white">
            {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              Leave Adjustment
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              This month's leave will be adjusted in <strong>{nextMonth}</strong>.
              Leave amount will be deducted from next month's bill.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <CalendarOff className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-600 dark:text-purple-400">Total Leave Days</span>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalLeaveDays}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Monthly Members</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{members.length}</p>
        </div>
      </div>

      {/* Leave Entry List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Monthly Mess Members
          </h3>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-500">Loading...</div>
          ) : members.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No Monthly Mess Members
            </div>
          ) : (
            members.map((member) => {
              const perDayRate = (member.monthlyCharge || 0) / 30;
              const leaveAmount = (leaveDays[member._id] || 0) * perDayRate;
              
              return (
                <div
                  key={member._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {member.address?.substring(0, 20)}... • ₹{member.monthlyCharge?.toLocaleString()}/month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Leave Deduction</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        -₹{leaveAmount.toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={leaveDays[member._id] || 0}
                        onChange={(e) => handleLeaveDaysChange(member._id, parseInt(e.target.value) || 0)}
                        min="0"
                        max="31"
                        className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-center text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-slate-500 dark:text-slate-400">Days</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
