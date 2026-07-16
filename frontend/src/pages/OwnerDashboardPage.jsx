import React, { useState, useEffect } from 'react';
import { Home, BookOpen, CheckCircle2, TrendingUp, Plus, MapPin, IndianRupee, Settings, Edit, Eye, EyeOff, Calendar, User, ArrowRight, ShieldCheck, Mail, Phone, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

/* ─── Stat Card ────────────────────────────────────────────── */
const OwnerStatCard = ({ icon: Icon, label, value, accent, sub, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-6 hover:shadow-xl transition-all"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${accent}`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">{value}</p>
    {sub && <p className="text-xs text-gray-500 font-medium mt-2">{sub}</p>}
  </motion.div>
);

const OwnerDashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [myListings, setMyListings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) navigate('/auth');
      else if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') navigate('/');
    }
  }, [isAuthenticated, loading, user, navigate]);

  useEffect(() => {
    if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        api.get('/listings/my'),
        api.get('/bookings/owner')
      ]);
      setMyListings(listingsRes.data);
      setOwnerBookings(bookingsRes.data);
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/listings/${id}`, { status: newStatus });
      setMyListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      import('react-hot-toast').then(({ toast }) => toast.success('Property status updated!'));
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to update property status.', onConfirm: closeModal });
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await api.put(`/bookings/${id}/status`, { status });
      setOwnerBookings(prev => prev.map(b => b.id === id ? res.data : b));
      import('react-hot-toast').then(({ toast }) => toast.success(`Booking ${status.toLowerCase()}!`));
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to update booking.', onConfirm: closeModal });
    }
  };

  if (loading || (user?.role !== 'OWNER' && user?.role !== 'ADMIN')) return null;

  // Stats
  const activeProperties = myListings.filter(l => l.status === 'ACTIVE').length;
  const rentedProperties = myListings.filter(l => l.status === 'RENTED').length;
  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const pendingBookings = ownerBookings.filter(b => b.status === 'PENDING').length;
  const totalRevenue = ownerBookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/5 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Home size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Owner Portal</h1>
                <p className="text-gray-500 text-xs sm:text-sm">Manage properties, tenants, and earnings.</p>
              </div>
            </div>
            <Link to="/post-property" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
              <Plus size={18} /> List New Property
            </Link>
          </div>
          
          {/* Section Tabs */}
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pt-2">
            {[
              { id: 'overview', name: 'Dashboard Overview', icon: TrendingUp },
              { id: 'properties', name: 'My Properties', icon: Home, count: myListings.length },
              { id: 'bookings', name: 'Bookings & Leads', icon: BookOpen, count: pendingBookings > 0 ? pendingBookings : null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
                {tab.count !== undefined && tab.count !== null && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {dataLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-primary-600"></div>
            <p className="text-sm text-gray-400 font-medium">Loading Owner Dashboard...</p>
          </div>
        ) : (
          <div className="animate-fadeIn">
            {/* ── Overview Section ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <OwnerStatCard icon={Home} label="Total Listed" value={myListings.length} accent="bg-blue-50 text-blue-600" />
                  <OwnerStatCard icon={CheckCircle2} label="Occupied/Rented" value={rentedProperties} accent="bg-green-50 text-green-600" sub={`${Math.round((rentedProperties/myListings.length)*100 || 0)}% Occupancy`} />
                  <OwnerStatCard icon={TrendingUp} label="Property Views" value={totalViews} accent="bg-purple-50 text-purple-600" />
                  <OwnerStatCard icon={IndianRupee} label="Confirmed Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} accent="bg-amber-50 text-amber-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Bookings Mini */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white">Recent Inquiries</h3>
                      <button onClick={() => setActiveTab('bookings')} className="text-primary-600 text-sm font-bold hover:underline">View All</button>
                    </div>
                    {ownerBookings.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                            {b.tenant?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{b.tenant?.name}</p>
                            <p className="text-xs text-gray-500">{b.listing?.title}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                    {ownerBookings.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No inquiries yet.</p>}
                  </div>

                  {/* Properties Mini */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white">Top Performing Properties</h3>
                      <button onClick={() => setActiveTab('properties')} className="text-primary-600 text-sm font-bold hover:underline">Manage All</button>
                    </div>
                    {myListings.sort((a,b) => (b.views||0) - (a.views||0)).slice(0, 4).map(l => (
                      <div key={l.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={l.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=100'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{l.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Eye size={12}/> {l.views || 0} views</p>
                          </div>
                        </div>
                        <span className="font-bold text-primary-600 text-sm">₹{l.price?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {myListings.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No properties listed yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── My Properties Section ── */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                {myListings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><Home className="text-gray-400" size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No properties listed</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Start adding your properties to the platform to receive bookings and inquiries from tenants.</p>
                    <Link to="/post-property" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 inline-flex items-center gap-2">
                      <Plus size={18}/> List Your First Property
                    </Link>
                  </div>
                ) : (
                  myListings.map(listing => (
                    <div key={listing.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-full md:w-48 h-32 flex-shrink-0">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=300'} alt="" className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1"><Link to={`/listings/${listing.id}/view`} className="hover:text-primary-600 transition-colors">{listing.title}</Link></h3>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mb-2"><MapPin size={14}/> {listing.location}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${listing.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : listing.status === 'RENTED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {listing.status || 'ACTIVE'}
                            </span>
                          </div>
                          <div className="flex gap-4 mb-4">
                            <span className="text-xs text-gray-500 font-medium bg-gray-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg">Type: {listing.type}</span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg">Views: {listing.views || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
                          <span className="text-xl font-black text-primary-600">₹{listing.price?.toLocaleString('en-IN')}<span className="text-sm text-gray-400 font-medium">/mo</span></span>
                          <div className="flex gap-2">
                            {listing.status === 'ACTIVE' && (
                              <button onClick={() => handleUpdateStatus(listing.id, 'RENTED')} className="text-xs bg-gray-900 text-white hover:bg-black px-3 py-1.5 rounded-lg font-bold transition-all">Mark as Rented</button>
                            )}
                            {listing.status === 'RENTED' && (
                              <button onClick={() => handleUpdateStatus(listing.id, 'ACTIVE')} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-bold transition-all">Mark as Active</button>
                            )}
                            <button onClick={() => handleUpdateStatus(listing.id, listing.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN')} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1">
                              {listing.status === 'HIDDEN' ? <><Eye size={14}/> Unhide</> : <><EyeOff size={14}/> Hide</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Bookings & Leads Section ── */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {ownerBookings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-gray-400" size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No inquiries yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">When tenants request to book or inquire about your properties, they will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownerBookings.map(b => (
                      <div key={b.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        {/* Status bar */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${b.status === 'CONFIRMED' ? 'bg-green-500' : b.status === 'PENDING' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        
                        <div className="flex justify-between items-start mb-4 pt-2">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${b.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : b.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            {b.status}
                          </span>
                          <span className="text-xs text-gray-400 font-bold">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Property</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={b.listing?.title}>{b.listing?.title}</p>
                          <p className="text-xs text-primary-600 font-bold mt-1">₹{b.amount?.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tenant Details</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-white rounded-lg flex items-center justify-center font-bold text-sm">
                              {b.tenant?.name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.tenant?.name}</p>
                              <p className="text-xs text-gray-500 truncate">{b.tenant?.email}</p>
                            </div>
                          </div>
                          {b.tenant?.phone && (
                            <div className="mt-3 flex gap-2">
                              <a href={`tel:${b.tenant.phone}`} className="flex-1 flex items-center justify-center gap-1 bg-white text-gray-700 border border-gray-200 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                <Phone size={12}/> Call
                              </a>
                            </div>
                          )}
                        </div>

                        {b.status === 'PENDING' && (
                          <div className="flex gap-2 mt-auto">
                            <button onClick={() => updateBookingStatus(b.id, 'CONFIRMED')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">Accept</button>
                            <button onClick={() => updateBookingStatus(b.id, 'REJECTED')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2 rounded-xl transition-colors">Decline</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default OwnerDashboardPage;
