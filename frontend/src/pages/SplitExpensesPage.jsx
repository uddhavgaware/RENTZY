import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import {
  Plus, X, Users, Receipt, ArrowRightLeft, TrendingUp, Trash2,
  Edit3, Check, ChevronDown, ChevronRight, Search, Filter,
  DollarSign, PieChart, Calendar, User, Home, CreditCard,
  Zap, Wifi, Droplets, ShoppingCart, Utensils, Car, Film,
  Heart, Star, AlertCircle, CheckCircle, Clock, ArrowRight,
  Wallet, IndianRupee, Split, UserPlus, Settings, BarChart3,
  CircleDollarSign, HandCoins, ArrowUpRight, ArrowDownLeft,
  Sparkles, Shield, Eye, Loader2
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────
const CURRENCY = '₹';

const CATEGORIES = [
  { id: 'rent', label: 'Rent', icon: Home, color: 'from-blue-500 to-blue-600' },
  { id: 'electricity', label: 'Electricity', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'from-cyan-500 to-blue-500' },
  { id: 'wifi', label: 'WiFi / Internet', icon: Wifi, color: 'from-purple-500 to-indigo-500' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'from-green-500 to-emerald-500' },
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'from-red-500 to-pink-500' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'from-slate-500 to-slate-600' },
  { id: 'entertainment', label: 'Entertainment', icon: Film, color: 'from-pink-500 to-rose-500' },
  { id: 'maintenance', label: 'Maintenance', icon: Settings, color: 'from-amber-500 to-amber-600' },
  { id: 'other', label: 'Other', icon: CircleDollarSign, color: 'from-gray-500 to-gray-600' },
];

const SPLIT_TYPES = [
  { id: 'equal', label: 'Equal', desc: 'Split equally among selected' },
  { id: 'exact', label: 'Exact Amounts', desc: "Specify each person's share" }
];

const AVATARS_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600', 'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-purple-600', 'from-lime-500 to-green-600',
];

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatCurrency = (amt) => {
  const num = parseFloat(amt) || 0;
  if (num >= 100000) return `${CURRENCY}${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${CURRENCY}${(num / 1000).toFixed(1)}K`;
  return `${CURRENCY}${num.toFixed(num % 1 === 0 ? 0 : 2)}`;
};

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const SplitExpensesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ─── State ─────────────────────────────────────────
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeView, setActiveView] = useState('expenses');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettle, setShowSettle] = useState(null);
  const [showMemberStats, setShowMemberStats] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data from API
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balanceData, setBalanceData] = useState({ memberBalances: [], transactions: [] });
  const [memberStats, setMemberStats] = useState(null);

  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ identifier: '' }); // email or userCode
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', category: 'other', paidByUserId: '',
    splitType: 'equal', splits: [], involvedMembers: [], date: new Date().toISOString().split('T')[0], note: ''
  });

  // ─── Derived ───────────────────────────────────────
  const currentGroup = groups.find(g => g.id === activeGroup);
  const members = currentGroup?.members?.map(m => m.user) || [];
  const memberObjects = currentGroup?.members || [];

  const filteredExpenses = useMemo(() => {
    let exps = [...expenses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      exps = exps.filter(e => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    if (filterCategory !== 'all') {
      exps = exps.filter(e => e.category === filterCategory);
    }
    return exps;
  }, [expenses, searchQuery, filterCategory]);

  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => ({
      category: CATEGORIES.find(c => c.id === cat) || CATEGORIES[CATEGORIES.length - 1],
      amount: amt,
      percentage: totalSpent > 0 ? (amt / totalSpent * 100) : 0
    }));
  }, [expenses, totalSpent]);

  const activityFeed = useMemo(() => {
    const items = [];
    expenses.forEach(e => { items.push({ type: 'expense', data: e, date: e.createdAt, id: e.id }); });
    settlements.forEach(s => { items.push({ type: 'settlement', data: s, date: s.date, id: s.id }); });
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, settlements]);

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    fetchGroups();
  }, [isAuthenticated]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    if (activeGroup) {
      fetchExpenses();
      fetchSettlements();
      fetchBalances();
    }
  }, [activeGroup]);

  // ─── API Calls ─────────────────────────────────────
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/split/groups');
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        setActiveGroup(res.data[0].id);
      }
    } catch (err) { console.error('Failed to fetch groups', err); }
    finally { setLoading(false); }
  };

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/split/groups/${activeGroup}/expenses`);
      setExpenses(res.data);
    } catch {}
  };

  const fetchSettlements = async () => {
    try {
      const res = await api.get(`/split/groups/${activeGroup}/settlements`);
      setSettlements(res.data);
    } catch {}
  };

  const fetchBalances = async () => {
    try {
      const res = await api.get(`/split/groups/${activeGroup}/balances`);
      setBalanceData(res.data);
    } catch {}
  };

  const refreshGroupData = async () => {
    await Promise.all([fetchExpenses(), fetchSettlements(), fetchBalances()]);
  };

  // ─── Handlers ──────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });

  const getMemberName = (userId) => {
    const m = members.find(u => u.id === userId);
    return m?.name || 'Unknown';
  };

  const getMemberColorByUserId = (userId) => {
    const idx = members.findIndex(u => u.id === userId);
    return AVATARS_COLORS[(idx >= 0 ? idx : 0) % AVATARS_COLORS.length];
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post('/split/groups', {
        name: groupForm.name.trim(),
        description: groupForm.description.trim()
      });
      setGroups(prev => [...prev, res.data]);
      setActiveGroup(res.data.id);
      setGroupForm({ name: '', description: '' });
      setShowAddGroup(false);
      showToast('Group created! Add your roommates now.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally { setActionLoading(false); }
  };

  const handleDeleteGroup = async (gid) => {
    setActionLoading(true);
    try {
      await api.delete(`/split/groups/${gid}`);
      setGroups(prev => prev.filter(g => g.id !== gid));
      if (activeGroup === gid) {
        const remaining = groups.filter(g => g.id !== gid);
        setActiveGroup(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast('Group deleted');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete group', 'error');
    } finally { setActionLoading(false); }
  };

  const handleUpdateGroup = async () => {
    if (!groupForm.name.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/split/groups/${activeGroup}`, {
        name: groupForm.name.trim(),
        description: groupForm.description.trim()
      });
      setGroups(prev => prev.map(g => g.id === activeGroup ? res.data : g));
      setShowEditGroup(false);
      showToast('Group updated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update group', 'error');
    } finally { setActionLoading(false); }
  };

  const handleAddMember = async () => {
    if (!memberForm.identifier.trim()) return;
    setActionLoading(true);
    try {
      const identifier = memberForm.identifier.trim();
      const body = identifier.includes('@')
        ? { email: identifier }
        : { userCode: identifier };
      await api.post(`/split/groups/${activeGroup}/members`, body);
      // Re-fetch groups to get updated member list
      await fetchGroups();
      setMemberForm({ identifier: '' });
      setShowAddMember(false);
      showToast('Member added!');
    } catch (err) {
      showToast(err.response?.data?.message || err.userMessage || 'Failed to add member', 'error');
    } finally { setActionLoading(false); }
  };

  const handleRemoveMember = async (memberId) => {
    setActionLoading(true);
    try {
      await api.delete(`/split/groups/${activeGroup}/members/${memberId}`);
      await fetchGroups();
      showToast('Member removed');
    } catch (err) {
      showToast(err.response?.data?.message || err.userMessage || 'Cannot remove member', 'error');
    } finally { setActionLoading(false); }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount || !expenseForm.paidByUserId) return;
    const amount = parseFloat(expenseForm.amount);
    if (amount <= 0) return;

    let splits = [];
    if (expenseForm.splitType === 'equal') {
      const involved = expenseForm.involvedMembers.length > 0 ? expenseForm.involvedMembers : members.map(m => m.id);
      const share = amount / involved.length;
      splits = involved.map(userId => ({ userId, amount: share }));
    } else if (expenseForm.splitType === 'exact') {
      splits = expenseForm.splits.filter(s => parseFloat(s.amount) > 0).map(s => ({
        userId: s.userId, amount: parseFloat(s.amount)
      }));
      const total = splits.reduce((s, x) => s + x.amount, 0);
      if (Math.abs(total - amount) > 0.01) {
        showToast(`Split amounts (${CURRENCY}${total.toFixed(2)}) don't add up to ${CURRENCY}${amount.toFixed(2)}`, 'error');
        return;
      }
    }

    setActionLoading(true);
    try {
      if (editingExpense) {
        await api.put(`/split/expenses/${editingExpense}`, {
          description: expenseForm.description.trim(),
          amount, category: expenseForm.category,
          paidByUserId: expenseForm.paidByUserId,
          splitType: expenseForm.splitType, splits,
          note: expenseForm.note.trim(), date: expenseForm.date
        });
        showToast('Expense updated!');
      } else {
        await api.post(`/split/groups/${activeGroup}/expenses`, {
          description: expenseForm.description.trim(),
          amount, category: expenseForm.category,
          paidByUserId: expenseForm.paidByUserId,
          splitType: expenseForm.splitType, splits,
          note: expenseForm.note.trim(), date: expenseForm.date
        });
        showToast('Expense added!');
      }
      resetExpenseForm();
      await refreshGroupData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally { setActionLoading(false); }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      description: '', amount: '', category: 'other', paidByUserId: '',
      splitType: 'equal', splits: [], involvedMembers: members.map(m => m.id), date: new Date().toISOString().split('T')[0], note: ''
    });
    setShowAddExpense(false);
    setEditingExpense(null);
  };

  const handleEditExpense = (exp) => {
    setExpenseForm({
      description: exp.description,
      amount: exp.amount.toString(),
      category: exp.category,
      paidByUserId: exp.paidBy?.id,
      splitType: exp.splitType,
      splits: (exp.shares || []).map(s => ({
        userId: s.user?.id, amount: s.amount?.toString()
      })),
      involvedMembers: exp.splitType === 'equal' ? (exp.shares || []).map(s => s.user?.id) : members.map(m => m.id),
      date: exp.date ? exp.date.split('T')[0] : '',
      note: exp.note || ''
    });
    setEditingExpense(exp.id);
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/split/expenses/${id}`);
      showToast('Expense deleted');
      await refreshGroupData();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const handleSettle = async (transaction) => {
    setActionLoading(true);
    try {
      await api.post(`/split/groups/${activeGroup}/settlements`, {
        fromUserId: transaction.fromUserId,
        toUserId: transaction.toUserId,
        amount: transaction.amount
      });
      setShowSettle(null);
      showToast('Settlement recorded!');
      await refreshGroupData();
    } catch (err) {
      showToast('Failed to record settlement', 'error');
    } finally { setActionLoading(false); }
  };

  const handleViewMemberStats = async (userId) => {
    try {
      const res = await api.get(`/split/groups/${activeGroup}/stats/${userId}`);
      setMemberStats({ ...res.data, user: members.find(m => m.id === userId) });
      setShowMemberStats(true);
    } catch (err) {
      showToast('Failed to load stats', 'error');
    }
  };

  const initSplits = (type, amount) => {
    const amt = parseFloat(amount) || 0;
    if (type === 'equal') return [];
    if (type === 'exact') {
      return members.map(m => ({ userId: m.id, amount: (amt / members.length).toFixed(2) }));
    }
    return [];
  };

  // ─── Auth guard ─────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-4">Please sign in to use the Split Expenses feature.</p>
          <button onClick={() => navigate('/auth')} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl">Sign In</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════
  return (
    <>
      <Helmet>
        <title>Split Expenses – RentXY</title>
        <meta name="description" content="Split rent, bills, and everyday expenses with your roommates. Track balances, settle debts, and keep your flat expenses organized." />
      </Helmet>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-2xl text-white font-semibold text-sm flex items-center gap-2 animate-slide-up ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="bg-mesh-gradient min-h-screen pb-24 md:pb-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-300/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-300/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-[100px] pointer-events-none" />

        {/* ══════ Hero Header ══════ */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDBMMzAgNjBNMCAzMEw2MCAzMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjYSkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Split size={22} className="text-white" />
                  </div>
                  <span className="text-emerald-200 text-sm font-semibold tracking-wide uppercase">Roommate Splits</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Split Expenses</h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base">Track shared costs, settle balances & stay fair with your flatmates</p>
              </div>
              <button onClick={() => setShowAddGroup(true)} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-semibold px-5 py-3 rounded-xl border border-white/20 transition-all active:scale-95 shadow-lg shadow-black/10 self-start sm:self-center">
                <Plus size={18} />New Group
              </button>
            </div>
          </div>
        </div>

        {/* ══════ Main Content ══════ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
            </div>
          )}

          {/* No groups */}
          {!loading && groups.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100/80 dark:border-white/5 p-12 text-center mt-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-5">
                <Users size={36} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your First Group</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Add your flat, room, or trip group to start splitting expenses with your roommates.</p>
              <button onClick={() => setShowAddGroup(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/25">
                <Plus size={20} />Create Group
              </button>
            </div>
          )}

          {!loading && groups.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-5 mt-2">

              {/* ═══ Sidebar — Groups ═══ */}
              <div className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 border border-gray-100/80 dark:border-white/5 p-4 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Groups</h3>
                    <button onClick={() => setShowAddGroup(true)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Plus size={18} /></button>
                  </div>
                  <nav className="space-y-1.5">
                    {groups.map(g => (
                      <div key={g.id} className="group relative">
                        <button onClick={() => { setActiveGroup(g.id); setActiveView('expenses'); }}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 ${activeGroup === g.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${activeGroup === g.id ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${activeGroup === g.id ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>{g.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{g.members?.length || 0} member{(g.members?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
                        </button>
                        {g.createdBy?.id === user?.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-white/5 p-0.5">
                            <button onClick={(e) => { e.stopPropagation(); setGroupForm({ name: g.name, description: g.description || '' }); setActiveGroup(g.id); setShowEditGroup(true); }} className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit Group">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveGroup(g.id); setShowInviteModal(true); }} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Invite Link">
                              <UserPlus size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Group">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>

              {/* ═══ Main Panel ═══ */}
              {currentGroup && (
                <div className="flex-1 min-w-0 space-y-5">

                  {/* ── Stats Row ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'This Month', value: formatCurrency(thisMonthTotal), icon: IndianRupee, iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'All Time', value: formatCurrency(totalSpent), icon: BarChart3, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                      { label: 'Members', value: members.length, icon: Users, iconBg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
                      { label: 'Pending', value: balanceData.transactions?.length || 0, icon: ArrowRightLeft, iconBg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-lg ${stat.iconBg}`}><stat.icon size={16} className={stat.iconColor} /></div>
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{stat.label}</span>
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Members Strip ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</h3>
                      <div className="flex gap-3">
                        <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                          <Users size={14} />Share Link
                        </button>
                        <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
                          <UserPlus size={14} />Add
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memberObjects.map((mo, i) => (
                        <div key={mo.id} className="group relative flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-white/5">
                          {mo.user.profilePhoto ? (
                            <img src={mo.user.profilePhoto} alt={mo.user.name} className="w-7 h-7 rounded-full object-cover border border-white" />
                          ) : (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATARS_COLORS[i % AVATARS_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {mo.user.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mo.user.name}</span>
                          {mo.user.id === user?.id && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">YOU</span>}
                          <button onClick={() => handleViewMemberStats(mo.user.id)} className="p-0.5 rounded text-gray-300 hover:text-blue-500 transition-all" title="View stats">
                            <Eye size={13} />
                          </button>
                          {mo.user.id !== user?.id && currentGroup.createdBy?.id === user?.id && (
                            <button onClick={() => handleRemoveMember(mo.id)} className="p-0.5 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Tab Navigation ── */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                    {[
                      { id: 'expenses', label: 'Expenses', icon: Receipt },
                      { id: 'balances', label: 'Balances', icon: ArrowRightLeft },
                      { id: 'activity', label: 'Activity', icon: Clock },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setActiveView(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeView === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                        <tab.icon size={16} />{tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ══════ EXPENSES TAB ══════ */}
                  {activeView === 'expenses' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all text-gray-900 dark:text-white" />
                        </div>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer">
                          <option value="all">All Categories</option>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <button onClick={() => { if (members.length < 2) { showToast('Add at least 2 members first', 'error'); return; } resetExpenseForm(); setShowAddExpense(true); }}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-500/20 whitespace-nowrap">
                          <Plus size={18} />Add Expense
                        </button>
                      </div>

                      {/* Category breakdown */}
                      {categoryBreakdown.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Spending Breakdown</h4>
                          <div className="flex rounded-full h-3 overflow-hidden bg-gray-100 dark:bg-slate-800 mb-3">
                            {categoryBreakdown.map(item => (
                              <div key={item.category.id} className={`bg-gradient-to-r ${item.category.color} transition-all duration-500`} style={{ width: `${item.percentage}%` }}
                                title={`${item.category.label}: ${formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)`} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {categoryBreakdown.slice(0, 5).map(item => (
                              <div key={item.category.id} className="flex items-center gap-1.5 text-xs">
                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${item.category.color}`} />
                                <span className="font-medium text-gray-600 dark:text-gray-400">{item.category.label}</span>
                                <span className="text-gray-400 dark:text-gray-500">{item.percentage.toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expense list */}
                      {filteredExpenses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-gray-100/80 dark:border-white/5 shadow-lg">
                          <Receipt size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">{searchQuery || filterCategory !== 'all' ? 'No matching expenses found' : 'No expenses yet. Add your first one!'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {filteredExpenses.map(exp => {
                            const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[CATEGORIES.length - 1];
                            const CatIcon = cat.icon;
                            return (
                              <div key={exp.id} className="group bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md shadow-gray-200/30 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5 hover:shadow-lg transition-all">
                                <div className="flex items-start gap-3">
                                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                                    <CatIcon size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{exp.description}</h4>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                          Paid by <span className="font-semibold text-gray-600 dark:text-gray-300">{exp.paidBy?.name}</span> · {formatDate(exp.date)}
                                        </p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-black text-gray-900 dark:text-white">{formatCurrency(exp.amount)}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{exp.splitType} split</p>
                                      </div>
                                    </div>
                                    {exp.note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 italic">💬 {exp.note}</p>}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {(exp.shares || []).map(s => (
                                        <span key={s.id} className="text-[11px] bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md font-medium border border-gray-100 dark:border-white/5">
                                          {s.user?.name}: {formatCurrency(s.amount)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={() => handleEditExpense(exp)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════ BALANCES TAB ══════ */}
                    {activeView === 'balances' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Individual Balances</h3>
                        <div className="space-y-3">
                          {(balanceData.memberBalances || []).map((mb, i) => (
                            <div key={mb.userId} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl p-1 -m-1 transition-colors" onClick={() => handleViewMemberStats(mb.userId)}>
                              {mb.profilePhoto ? (
                                <img src={mb.profilePhoto} alt={mb.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATARS_COLORS[i % AVATARS_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                  {mb.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{mb.name} {mb.userId === user?.id && <span className="text-emerald-500 text-xs">(you)</span>}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                {Math.abs(mb.balance) < 0.01 ? (
                                  <span className="text-sm font-bold text-gray-400">Settled ✓</span>
                                ) : mb.balance > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <ArrowUpRight size={14} className="text-emerald-500" />
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">gets back {formatCurrency(mb.balance)}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <ArrowDownLeft size={14} className="text-red-500" />
                                    <span className="text-sm font-bold text-red-500 dark:text-red-400">owes {formatCurrency(-mb.balance)}</span>
                                  </div>
                                )}
                                <Eye size={14} className="text-gray-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Settle Up */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles size={16} className="text-amber-500" />
                          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settle Up — Minimum Transactions</h3>
                        </div>
                        {(balanceData.transactions || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                              <CheckCircle size={28} className="text-emerald-500" />
                            </div>
                            <p className="font-bold text-gray-700 dark:text-gray-300">All Settled Up! 🎉</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No pending balances.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(balanceData.transactions || []).map((t, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-slate-800 dark:to-slate-800/50 border border-gray-100 dark:border-white/5">
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getMemberColorByUserId(t.fromUserId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                  {getMemberName(t.fromUserId).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{getMemberName(t.fromUserId)}</span>
                                    <ArrowRight size={14} className="text-gray-400" />
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{getMemberName(t.toUserId)}</span>
                                  </div>
                                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-base mt-0.5">{formatCurrency(t.amount)}</p>
                                </div>
                                <button onClick={() => setShowSettle(t)}
                                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-500/20 whitespace-nowrap">
                                  <HandCoins size={14} />Settle
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Settlement history */}
                      {settlements.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Settlement History</h3>
                          <div className="space-y-2">
                            {settlements.map(s => (
                              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/20">
                                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">{s.fromUser?.name}</span> paid <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.amount)}</span> to <span className="font-semibold">{s.toUser?.name}</span>
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{formatDate(s.date)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════ ACTIVITY TAB ══════ */}
                  {activeView === 'activity' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-100/80 dark:border-white/5">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                        {activityFeed.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No activity yet</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-slate-800" />
                            <div className="space-y-4">
                              {activityFeed.map(item => (
                                <div key={item.id} className="relative flex gap-4 pl-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${item.type === 'settlement' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                    {item.type === 'settlement' ? <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Receipt size={14} className="text-blue-600 dark:text-blue-400" />}
                                  </div>
                                  <div className="flex-1 pb-2 min-w-0">
                                    {item.type === 'expense' ? (
                                      <>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                          <span className="font-semibold">{item.data.paidBy?.name}</span> added <span className="font-bold text-gray-900 dark:text-white">"{item.data.description}"</span>
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatCurrency(item.data.amount)} · {item.data.splitType} split · {formatDate(item.date)}</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                          <span className="font-semibold">{item.data.fromUser?.name}</span> settled <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.data.amount)}</span> with <span className="font-semibold">{item.data.toUser?.name}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(item.date)}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*  MODALS                                        */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Create Group Modal ── */}
      {showAddGroup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowAddGroup(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md"><Users size={20} /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Group</h3>
              </div>
              <button onClick={() => setShowAddGroup(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Group Name *</label>
                <input type="text" placeholder="e.g. Flat 204, Trip to Goa" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <input type="text" placeholder="Optional — e.g. Monthly shared flat expenses" value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white" />
              </div>
              <button onClick={handleCreateGroup} disabled={!groupForm.name.trim() || actionLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {showAddMember && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowAddMember(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md"><UserPlus size={20} /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Roommate</h3>
              </div>
              <button onClick={() => setShowAddMember(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email or RentXY ID *</label>
                <input type="text" placeholder="Enter email address or 10-digit RentXY ID" value={memberForm.identifier} onChange={e => setMemberForm({ identifier: e.target.value })}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white" autoFocus />
                <p className="text-xs text-gray-400 mt-1.5">Your roommate must have a RentXY account. They can find their ID in Dashboard → Profile.</p>
              </div>
              <button onClick={handleAddMember} disabled={!memberForm.identifier.trim() || actionLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Add Roommate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Expense Modal ── */}
      {showAddExpense && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto" onClick={resetExpenseForm}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md"><Receipt size={20} /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              </div>
              <button onClick={resetExpenseForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
                <input type="text" placeholder="What was this expense for?" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm text-gray-900 dark:text-white" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Amount ({CURRENCY}) *</label>
                  <input type="number" placeholder="0.00" min="0" step="0.01" value={expenseForm.amount}
                    onChange={e => { const amt = e.target.value; setExpenseForm(p => ({ ...p, amount: amt, splits: initSplits(p.splitType, amt) })); }}
                    className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CATEGORIES.map(cat => { const CIcon = cat.icon; return (
                    <button key={cat.id} onClick={() => setExpenseForm(p => ({ ...p, category: cat.id }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${expenseForm.category === cat.id ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                      <CIcon size={16} /><span className="truncate w-full text-center text-[10px]">{cat.label}</span>
                    </button>
                  ); })}
                </div>
              </div>
              {/* Paid By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Paid By *</label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map((m, i) => (
                    <button key={m.id} onClick={() => setExpenseForm(p => ({ ...p, paidByUserId: m.id }))}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all ${expenseForm.paidByUserId === m.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                      {m.profilePhoto ? <img src={m.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover" /> : (
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATARS_COLORS[i % AVATARS_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>{m.name?.charAt(0).toUpperCase()}</div>
                      )}
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Split Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Split Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {SPLIT_TYPES.map(st => (
                    <button key={st.id} onClick={() => setExpenseForm(p => ({ ...p, splitType: st.id, splits: initSplits(st.id, p.amount) }))}
                      className={`p-3 rounded-xl text-center transition-all ${expenseForm.splitType === st.id ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-400 shadow-sm' : 'border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                      <p className={`text-sm font-bold ${expenseForm.splitType === st.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{st.label}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Custom Splits */}
              {expenseForm.splitType === 'equal' && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Select Members</span>
                    <span className="text-xs text-gray-400">{expenseForm.involvedMembers.length} / {members.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map(m => {
                      const isSelected = expenseForm.involvedMembers.includes(m.id);
                      return (
                        <button key={m.id} onClick={() => {
                          setExpenseForm(p => {
                            const newInvolved = isSelected ? p.involvedMembers.filter(id => id !== m.id) : [...p.involvedMembers, m.id];
                            return { ...p, involvedMembers: newInvolved, splits: initSplits('equal', p.amount) };
                          });
                        }} className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all text-left ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span className="truncate">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {expenseForm.splitType === 'exact' && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Exact Amounts</span>
                    <span className="text-xs text-gray-400">{CURRENCY}{expenseForm.splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0).toFixed(2)} / {CURRENCY}{parseFloat(expenseForm.amount || 0).toFixed(2)}</span>
                  </div>
                  {members.map(m => { const split = expenseForm.splits.find(s => s.userId === m.id); return (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 truncate">{m.name}</span>
                      <input type="number" placeholder="0.00" min="0" step="0.01" value={split?.amount || ''}
                        onChange={e => { const val = e.target.value; setExpenseForm(p => ({ ...p, splits: p.splits.map(s => s.userId === m.id ? { ...s, amount: val } : s) })); }}
                        className="flex-1 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none text-gray-900 dark:text-white" />
                    </div>
                  ); })}
                </div>
              )}
              {expenseForm.splitType === 'percentage' && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Percentages</span>
                    <span className="text-xs text-gray-400">{expenseForm.splits.reduce((s, x) => s + (parseFloat(x.percentage) || 0), 0).toFixed(1)}% / 100%</span>
                  </div>
                  {members.map(m => { const split = expenseForm.splits.find(s => s.userId === m.id); return (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 truncate">{m.name}</span>
                      <input type="number" placeholder="0" min="0" max="100" step="0.1" value={split?.percentage || ''}
                        onChange={e => { const val = e.target.value; setExpenseForm(p => ({ ...p, splits: p.splits.map(s => s.userId === m.id ? { ...s, percentage: val } : s) })); }}
                        className="flex-1 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none text-gray-900 dark:text-white" />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  ); })}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Note (optional)</label>
                <textarea rows={2} placeholder="Any extra details..." value={expenseForm.note} onChange={e => setExpenseForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm resize-none text-gray-900 dark:text-white" />
              </div>
              <button onClick={handleAddExpense} disabled={!expenseForm.description.trim() || !expenseForm.amount || !expenseForm.paidByUserId || actionLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={16} className="animate-spin" />} {editingExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settle Confirmation Modal ── */}
      {showSettle && (() => {
        const receiver = members.find(u => u.id === showSettle.toUserId);
        const payer = members.find(u => u.id === showSettle.fromUserId);
        return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowSettle(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up text-center overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
              <HandCoins size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Settle Up</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-1"><span className="font-semibold text-gray-800 dark:text-gray-200">{payer?.name || 'Unknown'}</span> pays</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{formatCurrency(showSettle.amount)}</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">to <span className="font-semibold text-gray-800 dark:text-gray-200">{receiver?.name || 'Unknown'}</span></p>

            {/* UPI Section */}
            {payer?.id === user?.id && (receiver?.upiId || receiver?.upiQrUrl) && (
              <div className="mb-6 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-white/10 text-left">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Payment Details</h4>
                {receiver.upiQrUrl && (
                  <div className="flex flex-col items-center mb-4">
                    <img src={receiver.upiQrUrl} alt="UPI QR Code" className="w-40 h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white" />
                    <p className="text-xs text-gray-500 mt-2">Scan to pay directly via any UPI app</p>
                  </div>
                )}
                {receiver.upiId && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>UPI ID:</strong> {receiver.upiId}</p>
                    <a href={`upi://pay?pa=${receiver.upiId}&pn=${encodeURIComponent(receiver.name)}&am=${showSettle.amount}&cu=INR`}
                       className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95">
                      Pay via UPI App
                    </a>
                  </div>
                )}
              </div>
            )}

            {!receiver?.upiId && !receiver?.upiQrUrl && payer?.id === user?.id && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl text-xs font-medium text-left">
                {receiver?.name} has not added their UPI details to their profile. You will need to ask them for their payment info.
              </div>
            )}

            <div className="w-full h-px bg-gray-100 dark:bg-white/10 mb-6" />

            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Mark as Settled?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Only confirm this if you have already sent or received the money.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSettle(null)} className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition-all active:scale-95">Cancel</button>
              <button onClick={() => handleSettle(showSettle)} disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Member Stats Modal ── */}
      {showMemberStats && memberStats && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => { setShowMemberStats(null); setMemberStats(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {memberStats.user?.profilePhoto ? (
                  <img src={memberStats.user.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {memberStats.user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{memberStats.user?.name}</h3>
                  <p className="text-xs text-gray-400">Member Stats</p>
                </div>
              </div>
              <button onClick={() => { setShowMemberStats(null); setMemberStats(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Total Paid</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(memberStats.totalPaid)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">Total Owed</p>
                <p className="text-xl font-black text-red-700 dark:text-red-300">{formatCurrency(memberStats.totalOwed)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${memberStats.netBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Net Balance</p>
                <p className={`text-xl font-black ${memberStats.netBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {memberStats.netBalance >= 0 ? '+' : ''}{formatCurrency(memberStats.netBalance)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Expenses Paid</p>
                <p className="text-xl font-black text-purple-700 dark:text-purple-300">{memberStats.expensesPaidCount}</p>
              </div>
            </div>

            {/* Category Breakdown */}
            {memberStats.categoryBreakdown && Object.keys(memberStats.categoryBreakdown).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Spending by Category</h4>
                <div className="space-y-2">
                  {Object.entries(memberStats.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([catId, amt]) => {
                    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
                    const CIcon = cat.icon;
                    const pct = memberStats.totalOwed > 0 ? (amt / memberStats.totalOwed * 100) : 0;
                    return (
                      <div key={catId} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-white flex-shrink-0`}>
                          <CIcon size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(amt)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {memberStats.totalSettledPaid > 0 || memberStats.totalSettledReceived > 0 ? (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Settled (Paid)</p>
                  <p className="font-bold text-sm text-gray-700 dark:text-gray-300">{formatCurrency(memberStats.totalSettledPaid)}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Settled (Received)</p>
                  <p className="font-bold text-sm text-gray-700 dark:text-gray-300">{formatCurrency(memberStats.totalSettledReceived)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Edit Group Modal ── */}
      {showEditGroup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowEditGroup(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md"><Edit3 size={20} /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Group</h3>
              </div>
              <button onClick={() => setShowEditGroup(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Group Name *</label>
                <input type="text" placeholder="e.g. Flat 204" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm text-gray-900 dark:text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <input type="text" placeholder="Optional details..." value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm text-gray-900 dark:text-white" />
              </div>
              <button onClick={handleUpdateGroup} disabled={!groupForm.name.trim() || actionLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Update Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Link Modal ── */}
      {showInviteModal && currentGroup?.inviteCode && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invite Roommates</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Share this link to let others join "{currentGroup.name}".</p>
            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-white/10 break-all mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium select-all">{window.location.origin}/join/{currentGroup.inviteCode}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${currentGroup.inviteCode}`); showToast('Link copied!'); setShowInviteModal(false); }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* ── Pay UPI Modal ── */}
      {showUpiModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowUpiModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setShowUpiModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pay {showUpiModal.name} via UPI</h3>
            
            <div className="my-6">
              {showUpiModal.upiQrUrl ? (
                <img src={showUpiModal.upiQrUrl} alt="UPI QR" className="w-48 h-48 mx-auto rounded-xl shadow-sm border border-gray-200 object-cover" />
              ) : (
                <div className="w-48 h-48 mx-auto rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-sm">No QR Code available</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-white/10 mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{showUpiModal.upiId}</span>
              <button onClick={() => { navigator.clipboard.writeText(showUpiModal.upiId); showToast('UPI ID copied!'); }} className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">Copy</button>
            </div>
            
            <button onClick={() => {
              // Try to open UPI intent on mobile
              window.location.href = `upi://pay?pa=${showUpiModal.upiId}&pn=${showUpiModal.name}`;
            }} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">
              Open UPI App
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SplitExpensesPage;
