import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Plus, Minus, Save, Calendar, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import {
  format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths,
} from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

export default function TiffinEntry() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [members, setMembers] = useState([]);
  const [tiffinCounts, setTiffinCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState(null);
  const [historyMonth, setHistoryMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [historyTiffins, setHistoryTiffins] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchTiffinsForDate(selectedDate);
    }
  }, [selectedDate, members]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.filter(m => m.messType === 'tiffin' && m.status === 'active'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load members');
    }
  };

  const fetchTiffinsForDate = async (dateStr) => {
    try {
      setLoading(true);
      const res = await api.get('/tiffins', { params: { date: dateStr } });
      const counts = {};
      members.forEach((member) => {
        const log = res.data.find(t => (t.memberId?._id || t.memberId) === member._id);
        counts[member._id] = log?.tiffinCount || 0;
      });
      setTiffinCounts(counts);
      setSaved(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load tiffins');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryForMember = async (memberId, monthStr) => {
    try {
      const res = await api.get('/tiffins', { params: { memberId, month: monthStr } });
      setHistoryTiffins(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history');
    }
  };

  useEffect(() => {
    if (isHistoryModalOpen && selectedMemberForHistory) {
      loadHistoryForMember(selectedMemberForHistory._id, historyMonth);
    }
  }, [isHistoryModalOpen, selectedMemberForHistory, historyMonth]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSaved(false);
  };

  const handleIncrement = (memberId) => {
    setTiffinCounts((prev) => ({
      ...prev,
      [memberId]: (prev[memberId] || 0) + 1,
    }));
    setSaved(false);
  };

  const handleDecrement = (memberId) => {
    setTiffinCounts((prev) => ({
      ...prev,
      [memberId]: Math.max(0, (prev[memberId] || 0) - 1),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const promises = members.map(async (member) => {
        const count = tiffinCounts[member._id] || 0;
        await api.post('/tiffins', {
          memberId: member._id,
          date: selectedDate,
          tiffinCount: count
        });
      });
      await Promise.all(promises);
      
      setSaved(true);
      toast.success('Tiffin log saved successfully');
      setTimeout(() => setSaved(false), 2000);
      fetchTiffinsForDate(selectedDate);
    } catch (error) {
      toast.error('Failed to save tiffins');
    }
  };

  const openHistory = (member) => {
    setSelectedMemberForHistory(member);
    setHistoryMonth(format(new Date(selectedDate), 'yyyy-MM'));
    setIsHistoryModalOpen(true);
  };

  const getCalendarDays = () => {
    const start = startOfMonth(new Date(historyMonth + '-01'));
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  };

  const totalTiffins = Object.values(tiffinCounts).reduce((sum, count) => sum + count, 0);

  const getTiffinLogByDate = (dateStr) => {
    return historyTiffins.find(t => format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
  };

  const historyTotalForMonth = historyTiffins.reduce((sum, t) => sum + (t.tiffinCount || 0), 0);

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
            Tiffin Entry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Enter daily Tiffin count
          </p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => handleDateChange(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-lg font-medium text-slate-800 dark:text-white">
              {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy')}
            </span>
          </div>

          <button
            onClick={() => handleDateChange(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-orange-600 dark:text-orange-400">Today's Total Tiffin</span>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalTiffins}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Tiffin Members</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{members.length}</p>
        </div>
      </div>

      {/* Tiffin Entry List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Tiffin Members
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
              No Tiffin Members
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member._id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {member.address?.substring(0, 20)}... • ₹{member.tiffinRate}/Tiffin
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openHistory(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="View History"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                       History
                    </span>
                  </button>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />

                  <button
                    onClick={() => handleDecrement(member._id)}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>

                  <span className="w-12 text-center text-2xl font-bold text-slate-800 dark:text-white">
                    {tiffinCounts[member._id] || 0}
                  </span>

                  <button
                    onClick={() => handleIncrement(member._id)}
                    className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && selectedMemberForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Tiffin History
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedMemberForHistory.name}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() =>
                    setHistoryMonth(
                      format(subMonths(new Date(historyMonth + '-01'), 1), 'yyyy-MM')
                    )
                  }
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-slate-700 dark:text-white">
                  {format(new Date(historyMonth + '-01'), 'MMMM yyyy')}
                </span>
                <button
                  onClick={() =>
                    setHistoryMonth(
                      format(addMonths(new Date(historyMonth + '-01'), 1), 'yyyy-MM')
                    )
                  }
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div
                    key={i}
                    className="h-8 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty padding cells */}
                {Array.from({
                  length: getDay(startOfMonth(new Date(historyMonth + '-01'))),
                }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}

                {/* Day cells */}
                {getCalendarDays().map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const log = getTiffinLogByDate(dateStr);
                  const hasLog = log && log.tiffinCount > 0;

                  return (
                    <div
                      key={dateStr}
                      className={`h-10 flex flex-col items-center justify-center rounded-lg relative ${
                        hasLog
                          ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {format(day, 'd')}
                      </span>
                      {hasLog && (
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800 px-1 rounded absolute -bottom-1 -right-1 shadow-sm border border-orange-100 dark:border-orange-800">
                          {log.tiffinCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Monthly Total */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Total for {format(new Date(historyMonth + '-01'), 'MMMM')}
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  {historyTotalForMonth}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-500 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
