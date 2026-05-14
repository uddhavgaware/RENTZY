import React, { useState, useEffect } from 'react';
import { Users, Home, BarChart3, Trash2, ShieldCheck, TrendingUp, DollarSign, AlertCircle, BadgeCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-5 animate-slide-up">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={26} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movingRequests, setMovingRequests] = useState([]);
  const [stats, setStats] = useState({ users: 0, listings: 0, bookings: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [selectedUsers, setSelectedUsers] = useState([]);

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      setDataLoading(true);
      try {
        const [usersRes, listingsRes, bookingsRes, statsRes, analyticsRes, movingRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/listings'),
          api.get('/admin/bookings'),
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
          api.get('/moving/admin/all')
        ]);
        setUsers(usersRes.data);
        setListings(listingsRes.data);
        setBookings(bookingsRes.data);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
        setMovingRequests(movingRes.data);
        setError(null);
      } catch (err) {
        console.error('Admin fetch error', err);
        setError(err.userMessage || 'Failed to fetch admin data. Please ensure you have admin privileges.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  const deleteUser = (id) => {
    showModal({
      type: 'prompt',
      title: 'Delete User',
      message: 'Enter reason for permanently deleting this user:',
      onConfirm: (reason) => {
        showModal({
          type: 'confirm',
          title: 'Confirm Deletion',
          message: 'Are you SURE you want to permanently delete this user? This action cannot be undone and will wipe all their data (listings, bookings, reviews, etc.).',
          onConfirm: async () => {
            closeModal();
            try {
              await api.delete(`/admin/users/${id}`, { params: { reason } });
              setUsers(prev => prev.filter(u => u.id !== id));
              // Also remove their listings & bookings from the UI
              setListings(prev => prev.filter(l => l.owner?.id !== id));
              setBookings(prev => prev.filter(b => b.tenant?.id !== id));
              showModal({ type: 'alert', title: 'Success', message: 'User and all their data deleted permanently.', onConfirm: closeModal });
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to delete user.');
            }
          }
        });
      },
      onCancel: closeModal
    });
  };

  const approveKyc = async (id) => {
    try {
      const res = await api.post(`/admin/users/${id}/kyc/approve`);
      setUsers(users.map(u => u.id === id ? res.data : u));
    } catch (err) {
      setError(err.userMessage || 'Failed to approve KYC.');
    }
  };

  const rejectKyc = async (id) => {
    try {
      const res = await api.post(`/admin/users/${id}/kyc/reject`);
      setUsers(users.map(u => u.id === id ? res.data : u));
    } catch (err) {
      setError(err.userMessage || 'Failed to reject KYC.');
    }
  };

  const undoKyc = async (id) => {
    try {
      const res = await api.post(`/admin/users/${id}/kyc/undo`);
      setUsers(users.map(u => u.id === id ? res.data : u));
    } catch (err) {
      setError(err.userMessage || 'Failed to undo KYC action.');
    }
  };

  const warnUser = (id) => {
    showModal({
      type: 'prompt',
      title: 'Warn User',
      message: 'Enter reason for warning this user:',
      onConfirm: async (reason) => {
        if (!reason.trim()) {
          showModal({ type: 'alert', title: 'Error', message: 'A reason is required to issue a warning.', onConfirm: closeModal });
          return;
        }
        closeModal();
        try {
          await api.post(`/admin/users/${id}/warn`, { reason });
          showModal({ type: 'alert', title: 'Success', message: 'Warning email sent to user successfully.', onConfirm: closeModal });
        } catch (err) {
          setError(err.userMessage || 'Failed to warn user.');
        }
      },
      onCancel: closeModal
    });
  };

  const toggleBlockUser = (id, isBlocked) => {
    if (!isBlocked) {
      showModal({
        type: 'prompt',
        title: 'Block User',
        message: 'Enter reason for blocking this user:',
        onConfirm: async (reason) => {
          if (!reason.trim()) {
            showModal({ type: 'alert', title: 'Error', message: 'A reason is required to block a user.', onConfirm: closeModal });
            return;
          }
          closeModal();
          try {
            const res = await api.post(`/admin/users/${id}/block`, { reason });
            setUsers(prev => prev.map(u => u.id === id ? res.data : u));
          } catch (err) {
            setError(err.userMessage || 'Failed to toggle user block status.');
          }
        },
        onCancel: closeModal
      });
    } else {
      showModal({
        type: 'confirm',
        title: 'Unblock User',
        message: 'Are you sure you want to unblock this user?',
        onConfirm: async () => {
          closeModal();
          try {
            const res = await api.post(`/admin/users/${id}/block`, { reason: '' });
            setUsers(prev => prev.map(u => u.id === id ? res.data : u));
          } catch (err) {
            setError(err.userMessage || 'Failed to unblock user.');
          }
        },
        onCancel: closeModal
      });
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const nonAdmins = users.filter(u => u.role !== 'ADMIN').map(u => u.id);
    if (selectedUsers.length === nonAdmins.length && nonAdmins.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(nonAdmins);
    }
  };

  const handleDeleteUsers = (isAll) => {
    if (!isAll && selectedUsers.length === 0) return;
    
    showModal({
      type: 'confirm',
      title: isAll ? 'Delete ALL Non-Admin Users?' : `Delete ${selectedUsers.length} Selected Users?`,
      message: 'WARNING: This will permanently delete the users and all their associated data. This action CANNOT be undone.',
      onConfirm: async () => {
        closeModal();
        try {
          const payload = isAll ? { all: true } : { userIds: selectedUsers };
          await api.post('/admin/users/bulk-delete', payload);
          if (isAll) {
             setUsers(prev => prev.filter(u => u.role === 'ADMIN'));
          } else {
             setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
          }
          setSelectedUsers([]);
          showModal({ type: 'alert', title: 'Success', message: 'Users deleted successfully.', onConfirm: closeModal });
        } catch (err) {
          setError(err.response?.data?.message || err.userMessage || 'Failed to delete users.');
        }
      },
      onCancel: closeModal
    });
  };

  const deleteListing = (id) => {
    showModal({
      type: 'confirm',
      title: 'Delete Listing',
      message: 'Delete this listing?',
      onConfirm: async () => {
        closeModal();
        try {
          await api.delete(`/admin/listings/${id}`);
          setListings(prev => prev.filter(l => l.id !== id));
        } catch (err) {
          setError(err.userMessage || 'Failed to delete listing.');
        }
      },
      onCancel: closeModal
    });
  };

  const updateMovingStatus = async (id, status) => {
    try {
      const res = await api.put(`/moving/admin/${id}/status`, { status });
      setMovingRequests(prev => prev.map(m => m.id === id ? res.data : m));
    } catch (err) {
      setError('Failed to update moving status.');
    }
  };

  if (loading || !isAdmin) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'delete-requests', label: 'Delete Requests', icon: Trash2 },
    { id: 'listings', label: 'Listings', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: DollarSign },
    { id: 'moving', label: 'Movers', icon: Truck },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your RentXY platform</p>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-blue-500" />
                  <StatCard icon={Home} label="Total Listings" value={stats.listings} color="bg-primary-600" />
                  <StatCard icon={DollarSign} label="Total Bookings" value={stats.bookings} color="bg-green-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Growth Chart */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-primary-600" />
                      Platform Growth
                    </h2>
                    {analytics?.growth ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.growth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line yAxisId="left" type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    )}
                  </div>

                  {/* Property Distribution */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Home size={20} className="text-primary-600" />
                      Property Types
                    </h2>
                    {analytics?.propertyTypes ? (
                      <div className="h-64 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.propertyTypes}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analytics.propertyTypes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="ml-4 space-y-2">
                          {analytics.propertyTypes.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                              {entry.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-primary-600" />
                    Recent Bookings
                  </h2>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <AlertCircle size={32} className="mx-auto mb-2" />
                      <p>No bookings yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{b.listing?.title}</p>
                            <p className="text-xs text-gray-500">{b.tenant?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600 text-sm">₹{b.amount?.toLocaleString('en-IN')}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">All Users ({users.length})</h2>
                  <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                      <button onClick={() => handleDeleteUsers(false)} className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-red-200 shadow-sm flex items-center gap-2">
                        <Trash2 size={16} /> Delete Selected ({selectedUsers.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left w-12">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            checked={users.filter(u => u.role !== 'ADMIN').length > 0 && selectedUsers.length === users.filter(u => u.role !== 'ADMIN').length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & KYC</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            {u.role !== 'ADMIN' ? (
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                checked={selectedUsers.includes(u.id)}
                                onChange={() => toggleSelectUser(u.id)}
                              />
                            ) : (
                              <div className="w-4 h-4"></div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                {u.name?.charAt(0)}
                              </div>
                              <span className={`font-medium ${u.isBlocked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                                u.role === 'MOVER' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {u.role}
                              </span>
                              {(u.role === 'OWNER' || u.role === 'MOVER') && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  u.kycStatus === 'APPROVED' ? 'text-green-600' :
                                  u.kycStatus === 'PENDING' ? 'text-yellow-600' :
                                  u.kycStatus === 'REJECTED' ? 'text-red-600' :
                                  'text-gray-400'
                                }`}>
                                  KYC: {u.kycStatus || 'NONE'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {u.role !== 'ADMIN' && (
                              <div className="flex flex-col gap-2">
                                {u.kycStatus === 'PENDING' && (u.role === 'OWNER' || u.role === 'MOVER') && (
                                    <div className="flex flex-col gap-1">
                                      <p className="text-xs text-gray-700 font-medium">{u.kycDocumentType || 'Document'}: {u.kycDocumentNumber || 'No Number'}</p>
                                      <div className="flex items-center gap-2">
                                        <a 
                                          href={u.kycDocumentUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium hover:bg-blue-100 text-center"
                                        >
                                          View Photo
                                        </a>
                                        <button
                                          onClick={() => approveKyc(u.id)}
                                          className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-medium hover:bg-green-100"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => rejectKyc(u.id)}
                                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium hover:bg-red-100"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                {(u.kycStatus === 'APPROVED' || u.kycStatus === 'REJECTED') && (u.role === 'OWNER' || u.role === 'MOVER') && (
                                    <button
                                      onClick={() => undoKyc(u.id)}
                                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium hover:bg-gray-200 mt-1 w-fit"
                                    >
                                      Undo KYC Action
                                    </button>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => warnUser(u.id)}
                                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-2 py-1 rounded-lg transition-colors text-xs font-semibold"
                                  >
                                    Warn
                                  </button>
                                  <button
                                    onClick={() => toggleBlockUser(u.id, u.isBlocked)}
                                    className={`${u.isBlocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'} px-2 py-1 rounded-lg transition-colors text-xs font-semibold`}
                                  >
                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                  <button
                                    onClick={() => deleteUser(u.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-xs font-semibold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Requests Tab */}
            {activeTab === 'delete-requests' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                    <Trash2 size={20} /> Account Deletion Requests
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Users who have requested their accounts to be deleted.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.filter(u => u.deleteRequested).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-gray-400">No pending deletion requests.</td>
                        </tr>
                      ) : users.filter(u => u.deleteRequested).map(u => (
                        <tr key={u.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                                {u.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Trash2 size={14} /> Process Deletion
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">All Listings ({listings.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {listings.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{l.title}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{l.location}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                              {l.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary-600">₹{l.price?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => deleteListing(l.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">All Bookings ({bookings.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-400">No bookings yet.</td>
                        </tr>
                      ) : bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{b.listing?.title}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{b.tenant?.name} <span className="text-gray-400">({b.tenant?.email})</span></td>
                          <td className="px-6 py-4 font-semibold text-primary-600">₹{b.amount?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Moving Requests Tab */}
            {activeTab === 'moving' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Moving & Packing Leads ({movingRequests.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route & Details</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quote</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {movingRequests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-400">No moving leads yet.</td>
                        </tr>
                      ) : movingRequests.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{m.user?.name}</p>
                            <p className="text-xs text-gray-500">{m.user?.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p><span className="font-medium text-gray-500">From:</span> {m.fromLocation}</p>
                              <p><span className="font-medium text-gray-500">To:</span> {m.toLocation}</p>
                              <p className="text-xs text-gray-400 mt-1">{m.propertySize} | {m.movingDate} {m.movingTime && `| ${m.movingTime}`}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary-600">₹{m.estimatedPrice?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                m.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {m.status}
                              </span>
                              <div className="flex gap-2">
                                {m.status === 'PENDING' && (
                                  <button onClick={() => updateMovingStatus(m.id, 'ASSIGNED')} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium hover:bg-blue-100">Assign Truck</button>
                                )}
                                {m.status === 'ASSIGNED' && (
                                  <button onClick={() => updateMovingStatus(m.id, 'COMPLETED')} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded font-medium hover:bg-green-100">Mark Complete</button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default AdminDashboardPage;
