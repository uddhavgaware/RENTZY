import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, AlertTriangle, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';

const MaintenanceTab = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', title: '', message: '' });
  
  // For tenant creating ticket
  const [myBookings, setMyBookings] = useState([]);
  const [formData, setFormData] = useState({ listingId: '', issueType: 'PLUMBING', title: '', description: '', priority: 'LOW' });

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'TENANT') {
      api.get('/bookings/my').then(res => {
        // Only allow tickets for properties where tenant has a CONFIRMED booking
        const confirmed = res.data.filter(b => b.status === 'CONFIRMED');
        setMyBookings(confirmed);
        if (confirmed.length > 0) {
          setFormData(prev => ({ ...prev, listingId: confirmed[0].listing.id }));
        }
      }).catch(() => {});
    }
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'OWNER' ? '/maintenance/owner' : '/maintenance/my';
      const res = await api.get(endpoint);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.listingId) {
      showModal({ type: 'alert', title: 'Error', message: 'You must have a confirmed booking to raise a maintenance request.' });
      return;
    }
    try {
      await api.post('/maintenance', formData);
      setIsCreating(false);
      setFormData({ listingId: myBookings[0]?.listing?.id || '', issueType: 'PLUMBING', title: '', description: '', priority: 'LOW' });
      fetchTickets();
      showModal({ type: 'success', title: 'Ticket Created', message: 'Your maintenance request has been submitted successfully.' });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to create ticket.' });
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.patch(`/maintenance/${ticketId}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to update status.' });
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'RESOLVED') return <CheckCircle2 className="text-green-500" size={18} />;
    if (status === 'IN_PROGRESS') return <Clock className="text-blue-500" size={18} />;
    return <AlertCircle className="text-amber-500" size={18} />;
  };

  const getStatusColor = (status) => {
    if (status === 'RESOLVED') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="animate-fadeIn">
      {modalConfig.isOpen && <Modal {...modalConfig} onConfirm={modalConfig.onConfirm || closeModal} onCancel={closeModal} />}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Requests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage plumbing, electrical, and other issues</p>
        </div>
        {user?.role !== 'OWNER' && (
          <button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            {isCreating ? <><X size={16}/> Cancel</> : <><Plus size={16}/> New Ticket</>}
          </button>
        )}
      </div>

      {isCreating && user?.role !== 'OWNER' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-white/10 pb-3">Raise a New Issue</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
              <select value={formData.listingId} onChange={e => setFormData(f => ({ ...f, listingId: e.target.value }))} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 bg-transparent dark:text-white outline-none" required>
                {myBookings.length === 0 && <option value="">No confirmed bookings found</option>}
                {myBookings.map(b => (
                  <option key={b.listing.id} value={b.listing.id}>{b.listing.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type</label>
              <select value={formData.issueType} onChange={e => setFormData(f => ({ ...f, issueType: e.target.value }))} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 bg-transparent dark:text-white outline-none">
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="APPLIANCE">Appliance</option>
                <option value="CLEANING">Cleaning</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 bg-transparent dark:text-white outline-none" placeholder="e.g., Leaking tap in bathroom" required />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 bg-transparent dark:text-white outline-none" placeholder="Provide more details about the issue..." required />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <div className="flex gap-4">
              {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="priority" checked={formData.priority === p} onChange={() => setFormData(f => ({ ...f, priority: p }))} className="text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium capitalize">{p.toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 shadow-md transition-colors">Submit Request</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Maintenance Requests</h3>
          <p className="text-gray-500 dark:text-gray-400">Everything looks good! {user?.role === 'OWNER' ? 'No open issues for your properties.' : 'You haven\'t raised any issues yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.title}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${ticket.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-200' : ticket.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {ticket.priority} PRIORITY
                    </span>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{ticket.description}</p>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">Type:</span> {ticket.issueType}</div>
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">Property:</span> {ticket.listing?.title}</div>
                  {user?.role === 'OWNER' && ticket.tenant && (
                    <div className="flex items-center gap-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">Reported by:</span> {ticket.tenant?.name} ({ticket.tenant?.phone})</div>
                  )}
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">Date:</span> {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              {/* Owner Action Buttons */}
              {user?.role === 'OWNER' && (
                <div className="flex flex-col gap-2 md:w-48 pt-4 md:pt-0 md:border-l md:border-gray-100 md:pl-5 border-t border-gray-100 md:border-t-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Update Status</p>
                  <select 
                    value={ticket.status} 
                    onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                    className="w-full text-sm border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceTab;
