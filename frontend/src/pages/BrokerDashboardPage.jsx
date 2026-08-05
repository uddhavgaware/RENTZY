import React, { useState, useEffect } from 'react';
import { Home, Users, CheckCircle2, AlertCircle, Plus, Send, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import ListingCard from '../components/ListingCard';

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex items-center gap-5 transition-all hover:scale-[1.02]">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} shadow-lg shadow-orange-500/10`}>
      <Icon size={26} className="text-white drop-shadow-md" />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mt-0.5">{value}</p>
      {subtitle && <p className="text-[11px] text-gray-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const BrokerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsRes, leadsRes] = await Promise.all([
        api.get('/listings/my'),
        api.get('/bookings/owner') // Brokers own the listings they post
      ]);
      setListings(listingsRes.data);
      setLeads(leadsRes.data);
    } catch (err) {
      console.error('Broker dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteListing = async (listingId) => {
    showModal({
      type: 'confirm',
      title: 'Delete Listing',
      message: 'Are you sure you want to delete this listing?',
      onConfirm: async () => {
        closeModal();
        try {
          await api.delete(`/listings/${listingId}`);
          fetchData();
          showModal({ type: 'alert', title: 'Deleted', message: 'Listing deleted successfully.', onConfirm: closeModal });
        } catch (err) {
          showModal({ type: 'alert', title: 'Error', message: 'Failed to delete listing.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  const handleConfirmLead = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      fetchData();
      showModal({ type: 'alert', title: 'Success', message: 'Lead confirmed!', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to confirm lead.', onConfirm: closeModal });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  const activeLeads = leads.filter(l => l.status === 'PENDING').length;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-orange-950/20 min-h-screen pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Broker <span className="text-orange-600">Dashboard</span></h1>
            <p className="text-gray-500 font-medium mt-1">Manage your property listings and client leads.</p>
          </div>
          <button
            onClick={() => navigate('/post-property')}
            className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> List New Property
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Home} label="Active Listings" value={listings.length} color="from-orange-500 to-amber-400" subtitle="Properties you are managing" />
          <StatCard icon={Users} label="Pending Leads" value={activeLeads} color="from-blue-500 to-cyan-400" subtitle="Tenants waiting for confirmation" />
          <StatCard icon={CheckCircle2} label="Closed Deals" value={leads.filter(l => l.status === 'CONFIRMED').length} color="from-emerald-500 to-teal-400" subtitle="Successfully rented properties" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white/60 dark:bg-slate-800/60 p-2 rounded-2xl backdrop-blur-md border border-gray-100 dark:border-white/5 shadow-sm inline-flex">
          {[
            { id: 'listings', label: 'My Listings', icon: Home },
            { id: 'leads', label: 'Client Leads', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm border border-gray-100 dark:border-white/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === 'listings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Properties You Manage</h2>
              {listings.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home size={32} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Listings Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">You haven't posted any properties yet. Add a property to start receiving leads.</p>
                  <button onClick={() => navigate('/post-property')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl">
                    Post First Property
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map(listing => (
                    <div key={listing.id} className="relative group">
                      <ListingCard listing={listing} />
                      <div className="absolute top-3 left-3 right-3 flex justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/post-property?edit=${listing.id}`)} className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white text-blue-600 transition-colors backdrop-blur-sm">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white text-red-600 transition-colors backdrop-blur-sm">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Tenant Inquiries</h2>
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No leads or inquiries yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map(lead => (
                    <div key={lead.id} className="border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            lead.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                            lead.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {lead.status === 'PENDING' ? 'New Lead' : lead.status}
                          </span>
                          <span className="text-xs text-gray-400 font-semibold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{lead.tenant?.name || 'Unknown Tenant'}</h4>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                          <span>📧 {lead.tenant?.email}</span>
                          {lead.tenant?.phone && <span>• 📱 {lead.tenant.phone}</span>}
                        </p>
                        <p className="text-sm font-semibold text-primary-600">
                          Inquiry for: <span className="text-gray-700 dark:text-gray-300 underline cursor-pointer" onClick={() => navigate(`/listings/${lead.listing?.id}`)}>{lead.listing?.title}</span>
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                          <Send size={14} /> Message
                        </button>
                        {lead.status === 'PENDING' && (
                          <button onClick={() => handleConfirmLead(lead.id)} className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} /> Accept Lead
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default BrokerDashboardPage;
