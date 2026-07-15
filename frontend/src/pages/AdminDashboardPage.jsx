import React, { useState, useEffect } from 'react';
import { Users, Home, BarChart3, Trash2, ShieldCheck, TrendingUp, DollarSign, AlertCircle, BadgeCheck, Truck, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:shadow-primary-500/10 transition-all p-6 flex items-center gap-5"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} shadow-inner`}>
      <Icon size={26} className="text-white drop-shadow-md" />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">{value}</p>
    </div>
  </motion.div>
);

const customMapPinIcon = (color) => divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full opacity-35 animate-ping" style="background-color: ${color}"></div>
        <div class="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2" style="border-color: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-map-marker-container',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const AdminDashboardPage = () => {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movingRequests, setMovingRequests] = useState([]);
  const [roommateRequests, setRoommateRequests] = useState([]);
  const [stats, setStats] = useState({ users: 0, listings: 0, bookings: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [expandedStates, setExpandedStates] = useState({});
  const [expandedCities, setExpandedCities] = useState({});
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedMovingRequestForMap, setSelectedMovingRequestForMap] = useState(null);
  const [isSatellite, setIsSatellite] = useState(false);

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => {
    setModalConfig({ isOpen: false });
    setSelectedMovingRequestForMap(null);
  };

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
        const [usersRes, listingsRes, bookingsRes, statsRes, analyticsRes, movingRes, roommateRequestsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/listings'),
          api.get('/admin/bookings'),
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
          api.get('/moving/admin/all'),
          api.get('/roommates/requests/all').catch(() => ({ data: [] }))
        ]);
        setUsers(usersRes.data);
        setListings(listingsRes.data);
        setBookings(bookingsRes.data);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
        setMovingRequests(movingRes.data);
        setRoommateRequests(roommateRequestsRes.data);
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

  const makeAdmin = (id) => {
    showModal({
      type: 'confirm',
      title: 'Make Admin',
      message: 'Are you sure you want to upgrade this user to Admin? They will have full access to the platform.',
      onConfirm: async () => {
        closeModal();
        try {
          const res = await api.post(`/admin/users/${id}/make-admin`);
          setUsers(prev => prev.map(u => u.id === id ? res.data : u));
          showModal({ type: 'alert', title: 'Success', message: 'User upgraded to admin successfully.', onConfirm: closeModal });
        } catch (err) {
          setError(err.response?.data?.message || err.userMessage || 'Failed to make user admin.');
        }
      },
      onCancel: closeModal
    });
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
    { id: 'roommates', label: 'Roommates', icon: Users },
    { id: 'regions', label: 'Regions', icon: MapPin },
  ];

  // ── India Regions Data ──────────────────────────────────────────────────────
  const INDIA_REGIONS = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Kolhapur', 'Satara', 'Aurangabad', 'Solapur', 'Thane', 'Navi Mumbai', 'Amravati', 'Sangli', 'Ratnagiri', 'Sindhudurg', 'Ahmednagar', 'Jalgaon', 'Latur', 'Osmanabad', 'Chandrapur'],
    'Karnataka': ['Bangalore', 'Bengaluru', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere', 'Bellary', 'Shimoga', 'Tumkur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Nalgonda'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Erode', 'Vellore'],
    'Delhi NCR': ['New Delhi', 'Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Greater Noida'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Raipur', 'Ujjain'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Malappuram'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
    'Others': [],
  };

  const buildRegionMap = () => {
    const map = {};
    Object.keys(INDIA_REGIONS).forEach(state => { map[state] = {}; });
    listings.forEach(l => {
      const loc = (l.location || l.city || '').toLowerCase();
      let matched = false;
      for (const [state, cities] of Object.entries(INDIA_REGIONS)) {
        for (const city of cities) {
          if (loc.includes(city.toLowerCase())) {
            if (!map[state][city]) map[state][city] = [];
            map[state][city].push(l);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (!matched) {
        if (!map['Others']['Unknown']) map['Others']['Unknown'] = [];
        map['Others']['Unknown'].push(l);
      }
    });
    return map;
  };

  const getFilteredListings = () => {
    return listings.filter(l => {
      if (selectedState === 'All') return true;
      const loc = (l.location || l.city || '').toLowerCase();
      if (selectedCity === 'All') {
        const stateCities = INDIA_REGIONS[selectedState] || [];
        return stateCities.some(city => loc.includes(city.toLowerCase())) || 
               (selectedState === 'Others' && !Object.values(INDIA_REGIONS).flat().some(city => loc.includes(city.toLowerCase())));
      }
      return loc.includes(selectedCity.toLowerCase());
    });
  };

  const getFilteredUsers = (filteredListingsList) => {
    if (selectedState === 'All') return users;
    const activeOwnerEmails = new Set(filteredListingsList.map(l => l.owner?.email).filter(Boolean));
    return users.filter(u => {
      if (u.role === 'ADMIN') return true;
      return activeOwnerEmails.has(u.email);
    });
  };

  const getFilteredBookings = (filteredListingsList) => {
    if (selectedState === 'All') return bookings;
    const activeListingIds = new Set(filteredListingsList.map(l => l.id));
    return bookings.filter(b => b.listing && activeListingIds.has(b.listing.id));
  };

  const getFilteredMovingRequests = () => {
    if (selectedState === 'All') return movingRequests;
    return movingRequests.filter(m => {
      const fromLoc = (m.fromLocation || '').toLowerCase();
      const toLoc = (m.toLocation || '').toLowerCase();
      if (selectedCity === 'All') {
        const stateCities = INDIA_REGIONS[selectedState] || [];
        return stateCities.some(city => fromLoc.includes(city.toLowerCase()) || toLoc.includes(city.toLowerCase()));
      }
      return fromLoc.includes(selectedCity.toLowerCase()) || toLoc.includes(selectedCity.toLowerCase());
    });
  };

  const getDynamicAnalytics = (filteredListingsList, filteredUsersList, filteredBookingsList) => {
    if (!analytics) return null;
    if (selectedState === 'All') return analytics;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(m => ({ month: m, users: 0, revenue: 0 }));
    
    filteredUsersList.forEach(u => {
      if (!u.createdAt) return;
      const date = new Date(u.createdAt);
      const mIdx = date.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].users += 1;
      }
    });

    filteredBookingsList.forEach(b => {
      if (!b.createdAt) return;
      const date = new Date(b.createdAt);
      const mIdx = date.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].revenue += (b.amount || 0);
      }
    });

    let cumulativeUsers = 0;
    const finalGrowth = monthlyData.map(d => {
      cumulativeUsers += d.users;
      return {
        month: d.month,
        users: cumulativeUsers || Math.floor(Math.random() * 3) + 1,
        revenue: d.revenue
      };
    });

    const typeCounts = {};
    filteredListingsList.forEach(l => {
      const type = l.type || 'FLAT';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const finalTypes = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return {
      growth: finalGrowth,
      propertyTypes: finalTypes.length > 0 ? finalTypes : [{ name: 'None', value: 0 }]
    };
  };

  const filteredListings = getFilteredListings();
  const filteredUsers = getFilteredUsers(filteredListings);
  const filteredBookings = getFilteredBookings(filteredListings);
  const filteredMoving = getFilteredMovingRequests();
  const filteredAnalytics = getDynamicAnalytics(filteredListings, filteredUsers, filteredBookings) || analytics;


  return (
    <div className="bg-mesh-gradient dark:bg-slate-900 min-h-screen pb-16 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/15 rounded-full translate-x-1/3 -translate-y-1/3 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-[80px] pointer-events-none" />

      {/* Premium gradient header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 30%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-0.5">Manage your RentXY platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-lg shadow-gray-200/50 dark:shadow-black/30 border border-gray-100/80 dark:border-white/10" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Dashboard Regional Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Dashboard Regional Filter</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Filter all overview metrics, charts, lists, and leads by state/city.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial">
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">State / Union Territory</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity('All');
                }}
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                <option value="All">All India</option>
                {Object.keys(INDIA_REGIONS).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            {selectedState !== 'All' && selectedState !== 'Others' && (
              <div className="flex-1 md:flex-initial">
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">City / District</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="All">All Cities</option>
                  {(INDIA_REGIONS[selectedState] || []).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}
            
            {(selectedState !== 'All' || selectedCity !== 'All') && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedState('All');
                    setSelectedCity('All');
                  }}
                  className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
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
                  <StatCard icon={Users} label="Total Users" value={filteredUsers.length} color="from-blue-400 to-blue-600" delay={0.1} />
                  <StatCard icon={Home} label="Total Listings" value={filteredListings.length} color="from-primary-500 to-indigo-600" delay={0.2} />
                  <StatCard icon={DollarSign} label="Total Bookings" value={filteredBookings.length} color="from-emerald-400 to-emerald-600" delay={0.3} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Growth Chart */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"
                  >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-primary-600" />
                      Platform Growth
                    </h2>
                    {filteredAnalytics?.growth ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredAnalytics.growth}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            <Area yAxisId="left" type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    )}
                  </motion.div>

                  {/* Property Distribution */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"
                  >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Home size={20} className="text-primary-600" />
                      Property Types
                    </h2>
                    {filteredAnalytics?.propertyTypes ? (
                      <div className="h-64 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filteredAnalytics.propertyTypes}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {filteredAnalytics.propertyTypes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="ml-4 space-y-2">
                          {filteredAnalytics.propertyTypes.map((entry, index) => (
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
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"
                >
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-primary-600" />
                    Recent Bookings
                  </h2>
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <AlertCircle size={32} className="mx-auto mb-2" />
                      <p>No bookings yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{b.listing?.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{b.tenant?.email}</p>
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
                </motion.div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Users ({filteredUsers.length})</h2>
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
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left w-12">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            checked={filteredUsers.filter(u => u.role !== 'ADMIN').length > 0 && selectedUsers.length === filteredUsers.filter(u => u.role !== 'ADMIN').length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & KYC</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {(() => {
                        const pendingMovers = filteredUsers.filter(u => u.kycStatus === 'PENDING' && u.role === 'MOVER');
                        const pendingOwners = filteredUsers.filter(u => u.kycStatus === 'PENDING' && u.role === 'OWNER');
                        const otherUsers = filteredUsers.filter(u => !(u.kycStatus === 'PENDING' && (u.role === 'MOVER' || u.role === 'OWNER')));
                        
                        const renderUserRow = (u) => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
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
                                <span className={`font-medium ${u.isBlocked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{u.email}</span>
                                {u.phone && <span className="text-gray-500 text-xs mt-1">📞 {u.phone}</span>}
                                {u.gender && <span className="text-gray-400 text-xs mt-0.5">👤 {u.gender} {u.dob ? `| ${u.dob}` : ''}</span>}
                                {u.occupation && <span className="text-gray-400 text-xs mt-0.5">💼 {u.occupation}</span>}
                              </div>
                            </td>
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
                                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{u.kycDocumentType || 'Document'}: {u.kycDocumentNumber || 'No Number'}</p>
                                        <div className="flex flex-wrap gap-1 mb-1">
                                          {u.kycDocumentUrl?.split(',').map((url, i) => (
                                            <a 
                                              key={i}
                                              href={url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold hover:bg-blue-100 text-center"
                                            >
                                              View {i === 0 ? 'Front' : i === 1 ? 'Back' : i === 2 ? 'Face' : 'Licence'}
                                            </a>
                                          ))}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
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
                                        className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-medium hover:bg-gray-200 dark:hover:bg-slate-600 mt-1 w-fit"
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
                                    {user?.email === 'uddhavgaware80@gmail.com' && (
                                      <button
                                        onClick={() => makeAdmin(u.id)}
                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors text-xs font-semibold"
                                      >
                                        Make Admin
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );

                        return (
                          <>
                            {pendingMovers.length > 0 && <tr><td colSpan="5" className="px-6 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-bold text-xs uppercase tracking-wider border-y border-orange-100 dark:border-orange-900/50">Pending Mover KYC Approvals ({pendingMovers.length})</td></tr>}
                            {pendingMovers.map(renderUserRow)}
                            
                            {pendingOwners.length > 0 && <tr><td colSpan="5" className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-bold text-xs uppercase tracking-wider border-y border-blue-100 dark:border-blue-900/50">Pending Owner KYC Approvals ({pendingOwners.length})</td></tr>}
                            {pendingOwners.map(renderUserRow)}

                            {otherUsers.length > 0 && <tr><td colSpan="5" className="px-6 py-2 bg-gray-50 dark:bg-slate-700/50 text-gray-800 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border-y border-gray-100 dark:border-white/10">All Other Users ({otherUsers.length})</td></tr>}
                            {otherUsers.map(renderUserRow)}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Requests Tab */}
            {activeTab === 'delete-requests' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                    <Trash2 size={20} /> Account Deletion Requests
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Users who have requested their accounts to be deleted.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.filter(u => u.deleteRequested).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-gray-400">No pending deletion requests.</td>
                        </tr>
                      ) : filteredUsers.filter(u => u.deleteRequested).map(u => (
                        <tr key={u.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                                {u.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Listings ({filteredListings.length})</h2>
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
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {filteredListings.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{l.title}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{l.location}</td>
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Bookings ({filteredBookings.length})</h2>
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
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-400">No bookings yet.</td>
                        </tr>
                      ) : filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{b.listing?.title}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{b.tenant?.name} <span className="text-gray-400">({b.tenant?.email})</span></td>
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Moving & Packing Leads ({filteredMoving.length})</h2>
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
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {filteredMoving.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-400">No moving leads yet.</td>
                        </tr>
                      ) : filteredMoving.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{m.user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{m.user?.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p><span className="font-medium text-gray-500">From:</span> {m.fromLocation}</p>
                              <p><span className="font-medium text-gray-500">To:</span> {m.toLocation}</p>
                              <p className="text-xs text-gray-400 mt-1">{m.propertySize} | {m.movingDate} {m.movingTime && `| ${m.movingTime}`}</p>
                              {m.fromLatitude && m.toLatitude && (
                                <button 
                                  onClick={() => setSelectedMovingRequestForMap(m)}
                                  className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                >
                                  <MapPin size={14} /> View on Map
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary-600">{m.estimatedPrice ? `₹${m.estimatedPrice.toLocaleString('en-IN')}` : 'TBD'}</td>
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

            {/* Roommate Requests Tab */}
            {activeTab === 'roommates' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-primary-600" /> All Roommate Requests ({roommateRequests.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Post Details</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {roommateRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-gray-400">No roommate requests found.</td>
                        </tr>
                      ) : roommateRequests.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{r.sender?.name}</p>
                            <p className="text-xs text-gray-500">{r.sender?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{r.receiver?.name}</p>
                            <p className="text-xs text-gray-500">{r.receiver?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">ID: {r.postId}</p>
                            <p className="text-xs text-gray-500">{r.postLocation} ({r.postPropertyType})</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                              r.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              r.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Regions Tab */}
            {activeTab === 'regions' && (() => {
              const regionMap = buildRegionMap();
              const activeStates = Object.entries(regionMap).filter(([_, cities]) => 
                Object.values(cities).some(listingsList => listingsList.length > 0)
              );

              return (
                <div className="space-y-6">
                  {/* Regions Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500">
                        <MapPin size={26} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Covered States</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeStates.length}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald-500">
                        <Home size={26} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Cities/Districts</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {activeStates.reduce((acc, [_, cities]) => acc + Object.keys(cities).length, 0)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-500">
                        <Users size={26} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Regional Listings</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {activeStates.reduce((acc, [_, cities]) => 
                            acc + Object.values(cities).reduce((sum, list) => sum + list.length, 0), 0
                          ) + (regionMap['Others']?.['Unknown']?.length || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* India Geographic Hierarchy */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        🇮🇳 Indian Regional Distribution
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Hierarchical breakdown of listed properties by state, district and city.
                      </p>
                    </div>

                    {activeStates.length === 0 && (!regionMap['Others']?.['Unknown'] || regionMap['Others']?.['Unknown']?.length === 0) ? (
                      <div className="text-center py-12 text-gray-400">
                        <AlertCircle size={32} className="mx-auto mb-2" />
                        <p>No listings mapped to Indian regions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeStates.map(([state, cities]) => {
                          const stateTotal = Object.values(cities).reduce((sum, l) => sum + l.length, 0);
                          const isExpanded = !!expandedStates[state];

                          return (
                            <div key={state} className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                              <button
                                onClick={() => setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }))}
                                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 dark:bg-slate-700/30 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                                  <span className="font-bold text-gray-800 dark:text-gray-200 text-base">{state}</span>
                                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                                    {stateTotal} properties
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedState(state);
                                      setSelectedCity('All');
                                      setActiveTab('overview');
                                    }}
                                    className="ml-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-[10px] font-extrabold px-3 py-1 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                    title="Filter entire dashboard to this state"
                                  >
                                    🎯 Filter Dashboard
                                  </button>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">Click to toggle</span>
                              </button>

                              {isExpanded && (
                                <div className="p-4 bg-white divide-y divide-gray-100">
                                  {Object.entries(cities).map(([city, listingsList]) => {
                                    const isCityExpanded = !!expandedCities[`${state}-${city}`];

                                    return (
                                      <div key={city} className="py-3 first:pt-0 last:pb-0">
                                        <button
                                          onClick={() => setExpandedCities(prev => ({ ...prev, [`${state}-${city}`]: !prev[`${state}-${city}`] }))}
                                          className="w-full flex items-center justify-between py-2 text-left hover:text-indigo-600 transition-colors"
                                        >
                                          <div className="flex items-center gap-2 pl-4">
                                            {isCityExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            <span className="font-semibold text-gray-700 text-sm">{city}</span>
                                            <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                              {listingsList.length}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedState(state);
                                                setSelectedCity(city);
                                                setActiveTab('overview');
                                              }}
                                              className="ml-3 bg-primary-600 hover:bg-primary-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-0.5"
                                              title="Filter entire dashboard to this city"
                                            >
                                              🎯 Filter
                                            </button>
                                          </div>
                                        </button>

                                        {isCityExpanded && (
                                          <div className="mt-3 pl-10 pr-4 space-y-2">
                                            {listingsList.map(l => (
                                              <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-all border border-gray-100/50">
                                                <div className="flex-1 min-w-0 pr-4">
                                                  <h4 className="font-semibold text-gray-900 text-sm truncate">{l.title}</h4>
                                                  <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {l.location}</p>
                                                  {l.owner && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Owner: {l.owner.name} ({l.owner.email})</p>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                  <span className="font-bold text-indigo-600 text-sm">₹{l.price?.toLocaleString('en-IN')}</span>
                                                  <button
                                                    onClick={() => deleteListing(l.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Delete listing"
                                                  >
                                                    <Trash2 size={15} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {regionMap['Others']?.['Unknown']?.length > 0 && (() => {
                          const listingsList = regionMap['Others']['Unknown'];
                          const isExpanded = !!expandedStates['Others'];

                          return (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                              <button
                                onClick={() => setExpandedStates(prev => ({ ...prev, 'Others': !prev['Others'] }))}
                                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                                  <span className="font-bold text-gray-800 text-base">Unmapped / Other Locations</span>
                                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {listingsList.length} properties
                                  </span>
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="p-4 bg-white space-y-2 pl-10 pr-6">
                                  {listingsList.map(l => (
                                    <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-all border border-gray-100/50">
                                      <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{l.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {l.location}</p>
                                        {l.owner && (
                                          <p className="text-[11px] text-gray-400 mt-0.5">Owner: {l.owner.name} ({l.owner.email})</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="font-bold text-indigo-600 text-sm">₹{l.price?.toLocaleString('en-IN')}</span>
                                        <button
                                          onClick={() => deleteListing(l.id)}
                                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
      
      {/* Map View Modal */}
      {selectedMovingRequestForMap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-slide-up border border-gray-100 dark:border-white/10 flex flex-col h-[80vh]">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="text-primary-600" />
                Moving Route Map
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSatellite(!isSatellite)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isSatellite 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {isSatellite ? '📡 Satellite View' : '🗺️ Map View'}
                </button>
                <button onClick={closeModal} className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                  <span className="text-2xl leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer 
                bounds={[
                  [selectedMovingRequestForMap.fromLatitude, selectedMovingRequestForMap.fromLongitude],
                  [selectedMovingRequestForMap.toLatitude, selectedMovingRequestForMap.toLongitude]
                ]} 
                boundsOptions={{ padding: [50, 50] }}
                className="h-full w-full"
              >
                <TileLayer
                  attribution={isSatellite ? '&copy; Esri' : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'}
                  url={isSatellite 
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                <Marker position={[selectedMovingRequestForMap.fromLatitude, selectedMovingRequestForMap.fromLongitude]} icon={customMapPinIcon('#ef4444')}>
                  <Popup>
                    <div className="font-bold text-red-600 text-sm">Pickup</div>
                    <div className="text-xs text-gray-600 mt-1">{selectedMovingRequestForMap.fromLocation}</div>
                  </Popup>
                </Marker>
                <Marker position={[selectedMovingRequestForMap.toLatitude, selectedMovingRequestForMap.toLongitude]} icon={customMapPinIcon('#10b981')}>
                  <Popup>
                    <div className="font-bold text-green-600 text-sm">Drop-off</div>
                    <div className="text-xs text-gray-600 mt-1">{selectedMovingRequestForMap.toLocation}</div>
                  </Popup>
                </Marker>
                <Polyline 
                  positions={[
                    [selectedMovingRequestForMap.fromLatitude, selectedMovingRequestForMap.fromLongitude],
                    [selectedMovingRequestForMap.toLatitude, selectedMovingRequestForMap.toLongitude]
                  ]} 
                  pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10' }} 
                />
              </MapContainer>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-white/10 flex gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Pickup</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Drop</div>
              <div className="flex items-center gap-2"><div className="w-6 border-b-2 border-dashed border-blue-500"></div> Route</div>
            </div>
          </div>
        </div>
      )}

      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default AdminDashboardPage;
