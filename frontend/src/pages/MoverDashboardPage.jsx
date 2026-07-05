import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Package, CheckCircle2, ShieldCheck, PhoneCall, AlertCircle, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import MoverRouteMap from '../components/MoverRouteMap';

const MoverDashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [availableLeads, setAvailableLeads] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) navigate('/auth');
      else if (user?.role !== 'MOVER') navigate('/');
    }
  }, [isAuthenticated, loading, user, navigate]);

  useEffect(() => {
    if (user?.role !== 'MOVER') return;
    fetchData();
    api.get('/users/me').then(res => setProfile(res.data)).catch(() => {});
  }, [user, activeTab]);

  const fetchData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      if (activeTab === 'available') {
        const res = await api.get('/moving/vendor/available');
        setAvailableLeads(res.data);
      } else {
        const res = await api.get('/moving/vendor/my');
        setMyJobs(res.data);
      }
    } catch (err) {
      setError('Failed to fetch moving data.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleAcceptJob = async (id) => {
    try {
      await api.put(`/moving/vendor/${id}/accept`);
      showModal({ type: 'alert', title: 'Success', message: 'Job Accepted successfully!', onConfirm: () => { closeModal(); fetchData(); } });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Failed to accept job.', onConfirm: closeModal });
    }
  };

  const handleStartJob = (id) => {
    showModal({
      type: 'prompt',
      title: 'Enter Start OTP',
      message: 'Please enter the 4-digit Start OTP given by the customer to start this move and begin live tracking.',
      placeholder: '0000',
      onConfirm: async (otp) => {
        closeModal();
        try {
          await api.post(`/moving/vendor/${id}/verify-start`, { otp });
          import('react-hot-toast').then(({ toast }) => toast.success('Live Tracking Started!'));
          fetchData();
        } catch (err) {
          showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Failed to start job.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  const handleReleaseJob = (id) => showModal({
    type: 'confirm',
    title: 'Release Job',
    message: 'Did negotiation fail? Releasing this job allows other vendors to take it. You will lose this lead.',
    onConfirm: async () => {
      closeModal();
      try {
        await api.put(`/moving/vendor/${id}/release`);
        setMyJobs(prev => prev.filter(job => job.id !== id));
        fetchData(); // Refresh available leads
      } catch (err) {
        setError('Failed to release job');
      }
    }
  });

  const handleCompleteJob = (id) => {
    showModal({
      type: 'prompt',
      title: 'Enter End OTP',
      message: 'Please enter the 4-digit End OTP given by the customer to mark this job as COMPLETED and stop live tracking.',
      placeholder: '0000',
      onConfirm: async (otp) => {
        closeModal();
        try {
          await api.post(`/moving/vendor/${id}/verify-end`, { otp });
          import('react-hot-toast').then(({ toast }) => toast.success('Job Completed Successfully!'));
          fetchData();
        } catch (err) {
          showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Failed to complete job.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  useEffect(() => {
    let watchId;
    const inTransitJob = myJobs.find(j => j.status === 'IN_TRANSIT');
    if (inTransitJob) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              await api.put(`/moving/vendor/${inTransitJob.id}/location`, {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            } catch (err) { }
          },
          (err) => console.error("Error watching position", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [myJobs]);

  if (loading || user?.role !== 'MOVER') return null;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Portal</h1>
              <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.name}</p>
            </div>
          </div>
          {profile?.kycStatus === 'APPROVED' && (
            <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-semibold border border-green-200">
              <ShieldCheck size={18} /> Verified Partner
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'available'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Available Leads ({activeTab === 'available' && !dataLoading ? availableLeads.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('my_jobs')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'my_jobs'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            My Jobs ({activeTab === 'my_jobs' && !dataLoading ? myJobs.length : '...'})
          </button>
        </div>

        {/* Content */}
        {dataLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            
            {activeTab === 'available' && (
              <>
                {availableLeads.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                    <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No leads right now</h3>
                    <p className="text-gray-500 mt-2">New moving requests will appear here instantly.</p>
                  </div>
                ) : (
                  availableLeads.map(lead => (
                    <div key={lead.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New Lead</span>
                          <span className="text-gray-400 text-xs font-medium">Requested: {new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12}/> From</p>
                            <p className="font-bold text-gray-900">{lead.fromLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12}/> To</p>
                            <p className="font-bold text-gray-900">{lead.toLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                            <p className="font-bold text-gray-900">{lead.movingDate}</p>
                            {lead.movingTime && <p className="text-xs text-primary-600 font-medium mt-0.5">{lead.movingTime}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Package size={12}/> Size</p>
                            <p className="font-bold text-gray-900">{lead.propertySize}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <p className="text-sm text-gray-500">Est. Payout</p>
                        <p className="text-3xl font-black text-green-600">{lead.estimatedPrice ? `₹${lead.estimatedPrice.toLocaleString('en-IN')}` : 'TBD'}</p>
                        <button onClick={() => handleAcceptJob(lead.id)} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary-600/20">
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'my_jobs' && (
              <>
                {myJobs.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">You haven't accepted any jobs</h3>
                    <p className="text-gray-500 mt-2">Go to the Available Leads tab to grab some work!</p>
                  </div>
                ) : (
                  myJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                           <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12}/> From</p>
                            <p className="font-bold text-gray-900">{job.fromLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12}/> To</p>
                            <p className="font-bold text-gray-900">{job.toLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                            <p className="font-bold text-gray-900">{job.movingDate}</p>
                            {job.movingTime && <p className="text-xs text-primary-600 font-medium mt-0.5">{job.movingTime}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Package size={12}/> Size</p>
                            <p className="font-bold text-gray-900">{job.propertySize}</p>
                          </div>
                        </div>
                        <div className="text-center md:text-right">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {job.status}
                          </span>
                          <p className="text-2xl font-black text-gray-900 mt-3">{job.estimatedPrice ? `₹${job.estimatedPrice.toLocaleString('en-IN')}` : 'To be decided'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1 w-full md:w-auto shadow-sm">
                          <p className="text-[10px] font-extrabold text-primary-600 mb-2 uppercase tracking-widest border-b border-gray-200 pb-1.5">Customer Details</p>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              {job.user?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{job.user?.name}</p>
                              <p className="text-sm text-gray-700 font-medium">{job.user?.phone || 'No phone provided'}</p>
                              {job.user?.email && <p className="text-xs text-gray-500 truncate">{job.user?.email}</p>}
                            </div>
                          </div>
                          
                          {/* Contact Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t border-gray-200">
                            {job.user?.phone && (
                              <>
                                <a href={`tel:${job.user?.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
                                  <Phone size={14} /> Call
                                </a>
                                <a href={`https://wa.me/${job.user?.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-[#1ebd5a] transition-all active:scale-95 shadow-sm">
                                  WhatsApp
                                </a>
                              </>
                            )}
                            {job.user?.email && (
                              <a href={`mailto:${job.user?.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-bold px-2 py-2 rounded-lg transition-all active:scale-95 shadow-sm">
                                <Mail size={14} /> Email
                              </a>
                            )}
                          </div>
                        </div>
                        {job.status === 'ASSIGNED' && (
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.fromLocation)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-8 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#4285F4]/30"
                            >
                              <MapPin size={18} /> Navigate to Pickup
                            </a>
                            <button onClick={() => handleStartJob(job.id)} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2">
                              <Truck size={18} /> Start Move (OTP)
                            </button>
                            <button onClick={() => handleReleaseJob(job.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl transition-colors text-sm border border-red-200 mt-2">
                              Negotiation Failed? Release Job
                            </button>
                          </div>
                        )}
                        {job.status === 'IN_TRANSIT' && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              Live Tracking Active
                            </div>
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-200 text-sm font-bold text-center">
                              ⚠️ Collect {job.estimatedPrice ? `₹${job.estimatedPrice.toLocaleString('en-IN')}` : 'Payment'} (Cash) before completing
                            </div>
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.toLocation)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-full md:w-auto bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-8 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#4285F4]/30"
                            >
                              <MapPin size={18} /> Navigate to Drop-off
                            </a>
                            <button onClick={() => handleCompleteJob(job.id)} className="w-full md:w-auto bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2">
                              <CheckCircle2 size={18} /> Complete Job (OTP)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Display the Route Map */}
                      {(job.status === 'ASSIGNED' || job.status === 'IN_TRANSIT') && (
                        <MoverRouteMap job={job} />
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default MoverDashboardPage;
