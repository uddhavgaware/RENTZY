import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Package, CheckCircle2, ShieldCheck, AlertCircle, Mail, Phone, ArrowRight, Clock, IndianRupee, TrendingUp, CircleDot, ChevronDown, ChevronUp, HelpCircle, Zap, Star, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import MoverRouteMap from '../components/MoverRouteMap';
import { motion, AnimatePresence } from 'framer-motion';

const MoverDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  // Job Action States
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'MOVER') {
      navigate('/');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [leadsRes, jobsRes] = await Promise.all([
        api.get('/movers/leads').catch(() => ({ data: [] })),
        api.get('/movers/my-jobs').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsRes.data || []);
      setMyJobs(jobsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch mover data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLead = async (leadId) => {
    try {
      await api.post(`/movers/accept/${leadId}`);
      showModal({ type: 'success', title: 'Job Accepted!', message: 'You can now view this job in the Active Jobs tab.', onConfirm: closeModal });
      fetchData();
      setActiveTab('jobs');
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: err.response?.data || 'Failed to accept job.', onConfirm: closeModal });
    }
  };

  const handleVerifyStartOTP = async (jobId) => {
    if (!otpInput || otpInput.length !== 4) {
      showModal({ type: 'error', title: 'Invalid OTP', message: 'Please enter a 4-digit OTP.', onConfirm: closeModal });
      return;
    }
    setVerifyingOtp(true);
    try {
      await api.post(`/movers/start/${jobId}`, null, { params: { otp: otpInput } });
      setOtpInput('');
      fetchData();
      showModal({ type: 'success', title: 'Job Started', message: 'The job is now IN_TRANSIT. Live tracking is active.', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'error', title: 'Verification Failed', message: err.response?.data || 'Incorrect OTP.', onConfirm: closeModal });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleVerifyEndOTP = async (jobId) => {
    if (!otpInput || otpInput.length !== 4) {
      showModal({ type: 'error', title: 'Invalid OTP', message: 'Please enter a 4-digit OTP.', onConfirm: closeModal });
      return;
    }
    setVerifyingOtp(true);
    try {
      await api.post(`/movers/complete/${jobId}`, null, { params: { otp: otpInput } });
      setOtpInput('');
      fetchData();
      showModal({ type: 'success', title: 'Job Completed', message: 'Great work! The job is marked as completed.', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'error', title: 'Verification Failed', message: err.response?.data || 'Incorrect OTP.', onConfirm: closeModal });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeJobs = myJobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  const completedJobs = myJobs.filter(j => j.status === 'COMPLETED');
  
  // Quick Mock Earnings Math
  const totalEarnings = completedJobs.length * 1500; // Mock 1500 per job
  const pendingJobs = activeJobs.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 pt-10 pb-20 px-4 sm:px-6 lg:px-8 shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Truck size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Mover <span className="text-indigo-400">Portal</span></h1>
              <p className="text-gray-400 text-sm md:text-base mt-1 font-medium">Find jobs, track routes, and manage your earnings.</p>
            </div>
          </div>
          
          <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 w-full md:w-auto overflow-x-auto hide-scrollbar">
            {[
              { id: 'leads', label: 'Available Leads', icon: MapPin },
              { id: 'jobs', label: 'Active Jobs', icon: Zap },
              { id: 'earnings', label: 'Earnings', icon: IndianRupee }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} /> <span className="inline">{tab.label}</span>
                {tab.id === 'leads' && leads.length > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{leads.length}</span>
                )}
                {tab.id === 'jobs' && pendingJobs > 0 && (
                  <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingJobs}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        <AnimatePresence mode="wait">
          
          {/* TAB: LEADS */}
          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><CircleDot className="text-green-500 animate-pulse" size={20} /> Live Leads Radar</h2>
                  <p className="text-sm text-gray-500 mt-1">Accept jobs quickly before other movers claim them.</p>
                </div>
                <button onClick={fetchData} className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors">
                  <RotateCcw size={20} />
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Leads Right Now</h3>
                  <p className="text-gray-500">We'll notify you when new moving requests come in.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leads.map((lead, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                      key={lead.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden group hover:shadow-xl transition-all flex flex-col"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">New Request</span>
                          <span className="text-gray-400 text-xs font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex-1 space-y-4 mb-6">
                          <div className="flex gap-3">
                            <div className="mt-1"><CircleDot size={16} className="text-indigo-500" /></div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pickup</p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{lead.fromLocation}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="mt-1"><MapPin size={16} className="text-green-500" /></div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Drop-off</p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{lead.toLocation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                          <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><Calendar size={12}/> {lead.movingDate}</span>
                          <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><Package size={12}/> {lead.propertySize}</span>
                        </div>

                        <button 
                          onClick={() => handleAcceptLead(lead.id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
                        >
                          Accept Job
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ACTIVE JOBS */}
          {activeTab === 'jobs' && (
            <motion.div key="jobs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {activeJobs.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Jobs</h3>
                  <p className="text-gray-500 text-sm">Check the 'Available Leads' tab to find new work.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeJobs.map(job => (
                    <div key={job.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden">
                      {/* Header */}
                      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-750 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-gray-400">JOB ID</span>
                          <p className="font-mono font-black text-gray-900 dark:text-white">#{job.id.substring(0,8).toUpperCase()}</p>
                        </div>
                        <div className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {job.status.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Details Col */}
                        <div className="lg:col-span-1 space-y-6">
                          <div>
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">Customer Details</h4>
                            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl">
                                {job.customer?.firstName?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{job.customer?.firstName} {job.customer?.lastName}</p>
                                <a href={`tel:${job.customer?.phoneNumber}`} className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 mt-0.5">
                                  <Phone size={14} /> {job.customer?.phoneNumber}
                                </a>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">Route Information</h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-200 before:via-gray-200 before:to-green-200 dark:before:from-indigo-800 dark:before:to-green-800 pl-8">
                              <div className="relative">
                                <div className="absolute left-[-32px] w-6 h-6 rounded-full bg-indigo-100 border-4 border-white dark:border-slate-800 flex items-center justify-center"><CircleDot size={10} className="text-indigo-600"/></div>
                                <p className="text-xs text-gray-400 font-bold mb-1">PICKUP</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.fromLocation}</p>
                              </div>
                              <div className="relative">
                                <div className="absolute left-[-32px] w-6 h-6 rounded-full bg-green-100 border-4 border-white dark:border-slate-800 flex items-center justify-center"><MapPin size={10} className="text-green-600"/></div>
                                <p className="text-xs text-gray-400 font-bold mb-1">DROP-OFF</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.toLocation}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Map & Actions Col */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                          <div className="h-[300px] w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm relative z-0">
                             <MoverRouteMap from={job.fromLocation} to={job.toLocation} />
                             {job.status === 'IN_TRANSIT' && (
                               <div className="absolute top-4 left-4 right-4 z-10">
                                 <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 animate-pulse">
                                   <Truck size={18} /> Live Tracking Active
                                 </div>
                               </div>
                             )}
                          </div>

                          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                            {job.status === 'ASSIGNED' ? (
                              <div className="text-center">
                                <ShieldCheck size={40} className="mx-auto text-indigo-500 mb-3" />
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">Ready to Start?</h4>
                                <p className="text-sm text-gray-500 mb-6">Arrive at the pickup location and ask the customer for their 4-digit Start OTP.</p>
                                <div className="flex items-center justify-center gap-3">
                                  <input 
                                    type="text" maxLength="4" placeholder="••••" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                    className="w-24 text-center text-2xl font-black tracking-[0.2em] bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl py-3 outline-none focus:border-indigo-500 dark:text-white"
                                  />
                                  <button 
                                    onClick={() => handleVerifyStartOTP(job.id)} disabled={verifyingOtp || otpInput.length !== 4}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all"
                                  >
                                    Verify & Start
                                  </button>
                                </div>
                              </div>
                            ) : job.status === 'IN_TRANSIT' ? (
                              <div className="text-center">
                                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">Arrived at Destination?</h4>
                                <p className="text-sm text-gray-500 mb-6">Collect payment and ask the customer for their End OTP to finish the job.</p>
                                <div className="flex items-center justify-center gap-3">
                                  <input 
                                    type="text" maxLength="4" placeholder="••••" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                    className="w-24 text-center text-2xl font-black tracking-[0.2em] bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl py-3 outline-none focus:border-emerald-500 dark:text-white"
                                  />
                                  <button 
                                    onClick={() => handleVerifyEndOTP(job.id)} disabled={verifyingOtp || otpInput.length !== 4}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all"
                                  >
                                    Complete Job
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: EARNINGS (MOCK) */}
          {activeTab === 'earnings' && (
            <motion.div key="earnings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20"><TrendingUp size={100} /></div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-emerald-200 mb-2">Total Earnings</h2>
                  <p className="text-5xl font-black mb-6">₹{totalEarnings.toLocaleString('en-IN')}</p>
                  <p className="text-emerald-100 font-medium">Based on {completedJobs.length} successfully completed jobs.</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-lg">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Recent Completed Jobs</h3>
                  {completedJobs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No completed jobs yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {completedJobs.map(job => (
                        <div key={job.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-white/5">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">#{job.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{job.fromLocation.split(',')[0]} → {job.toLocation.split(',')[0]}</p>
                          </div>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">₹1,500</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default MoverDashboardPage;
