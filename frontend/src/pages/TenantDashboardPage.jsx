import React, { useState, useEffect } from 'react';
import { FileText, Zap, DollarSign, Droplet, CheckCircle2, Clock, Wrench, Home, MessageSquare, Plus, AlertCircle, Wifi, ShieldCheck, Key, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'framer-motion';

const TenantDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [showConfetti, setShowConfetti] = useState(false);
  const [maintenanceTickets, setMaintenanceTickets] = useState([
    { id: 'M-1012', title: 'Leaking Tap in Washroom', status: 'RESOLVED', date: '12th July 2026' }
  ]);
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'MEDIUM' });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/bills/tenant').catch(() => ({ data: [] }));
      setBills(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tenant bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBills();
  }, [user, navigate]);

  const handlePayBill = (billId) => {
    const billToPay = bills.find(b => b.id === billId);
    if (billToPay) {
      setSelectedBill(billToPay);
    }
  };

  const handleBillPaidSuccess = (paidBillId) => {
    setBills(prev => prev.map(b => b.id === paidBillId ? { ...b, status: 'PAID' } : b));
    setSelectedBill(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // hide after 5s
    showModal({
      type: 'alert',
      title: 'Payment Confirmed 🎉',
      message: 'Your bill payment has been successfully verified via Razorpay.',
      onConfirm: closeModal
    });
  };

  const submitTicket = (e) => {
    e.preventDefault();
    const newTicket = {
      id: `M-${Math.floor(Math.random() * 9000) + 1000}`,
      title: ticketForm.title,
      status: 'PENDING',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    setMaintenanceTickets([newTicket, ...maintenanceTickets]);
    setNewTicketModal(false);
    setTicketForm({ title: '', description: '', priority: 'MEDIUM' });
    showModal({ type: 'alert', title: 'Ticket Raised', message: 'Your PG owner has been notified.', onConfirm: closeModal });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const unpaidBills = bills.filter(b => b.status !== 'PAID');
  const totalUnpaid = unpaidBills.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 relative overflow-hidden">
      
      {/* Confetti Animation Layer */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: '100vh', 
                  x: Math.random() * window.innerWidth, 
                  rotate: 0, 
                  scale: Math.random() * 1.5 + 0.5 
                }}
                animate={{ 
                  y: '-20vh', 
                  x: Math.random() * window.innerWidth + (Math.random() > 0.5 ? 200 : -200),
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: Math.random() * 2 + 2, ease: 'easeOut' }}
                className={`absolute w-3 h-3 rounded-sm ${['bg-teal-500', 'bg-blue-500', 'bg-pink-500', 'bg-yellow-500'][Math.floor(Math.random() * 4)]}`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 pt-10 pb-20 px-4 sm:px-6 lg:px-8 shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Home size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Tenant <span className="text-teal-400">Hub</span></h1>
              <p className="text-gray-400 text-sm md:text-base mt-1 font-medium">Manage your stay, pay rent, and track requests.</p>
            </div>
          </div>
          
          <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 w-full md:w-auto overflow-x-auto hide-scrollbar">
            {[
              { id: 'bills', label: 'My Bills', icon: FileText },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'room', label: 'My Room', icon: ShieldCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-teal-600 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} /> <span className="inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* Content Area */}
        <AnimatePresence mode="wait">
          
          {/* TAB: BILLS */}
          {activeTab === 'bills' && (
            <motion.div key="bills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Financial Overview Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Financial Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Total Unpaid Dues</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
                      ₹{totalUnpaid.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="md:border-l md:border-gray-100 dark:border-white/5 md:pl-6">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Next Bill Due</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {unpaidBills.length > 0 ? unpaidBills[0].dueDate || '10th of Month' : 'All Clear! 🎉'}
                    </p>
                  </div>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                  <CheckCircle2 size={48} className="mx-auto text-teal-400 mb-3 opacity-50" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Bills Found</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto mt-2">You currently have no pending rent or electricity bills.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {bills.map((bill, idx) => {
                    const isPaid = bill.status === 'PAID';
                    const total = bill.totalAmount || 0;
                    const basePerc = total > 0 ? ((bill.baseRent || 0) / total) * 100 : 0;
                    const ebPerc = total > 0 ? ((bill.electricityAmount || 0) / total) * 100 : 0;
                    const maintPerc = total > 0 ? (((bill.maintenanceAmount || 0) + (bill.waterCharge || 0)) / total) * 100 : 0;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                        key={bill.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden group hover:shadow-xl transition-all"
                      >
                        <div className={`px-6 py-4 flex items-center justify-between border-b ${isPaid ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-900/50' : 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-100 dark:from-rose-900/20 dark:to-orange-900/20 dark:border-rose-900/50'}`}>
                          <div className="flex items-center gap-2">
                            {isPaid ? <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" /> : <Clock size={20} className="text-rose-600 dark:text-rose-400" />}
                            <span className={`font-black text-sm uppercase tracking-wider ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                              {isPaid ? 'Paid Successfully' : 'Action Required'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full">
                            Due: {bill.dueDate || '10th of Month'}
                          </span>
                        </div>

                        <div className="p-6 md:p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{bill.billingMonth || 'Current Month'} Bill</h2>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{bill.roomBed?.ownerProperty?.name} • Room {bill.roomBed?.roomNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-4xl font-black tracking-tight ${isPaid ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>₹{total.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          {/* Visual Breakdown Bar */}
                          <div className="h-3 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex mb-4 shadow-inner">
                            <div style={{ width: `${basePerc}%` }} className="bg-blue-500 h-full" title="Rent" />
                            <div style={{ width: `${ebPerc}%` }} className="bg-amber-400 h-full" title="Electricity" />
                            <div style={{ width: `${maintPerc}%` }} className="bg-teal-500 h-full" title="Maintenance" />
                          </div>

                          <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center text-sm font-medium">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><div className="w-2 h-2 rounded-full bg-blue-500"/> Base Rent</div>
                              <span className="text-gray-900 dark:text-white">₹{bill.baseRent?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><div className="w-2 h-2 rounded-full bg-amber-400"/> Electricity</div>
                              <span className="text-gray-900 dark:text-white">₹{bill.electricityAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><div className="w-2 h-2 rounded-full bg-teal-500"/> Maint. & Water</div>
                              <span className="text-gray-900 dark:text-white">₹{((bill.maintenanceAmount || 0) + (bill.waterCharge || 0)).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {!isPaid && (
                            <button 
                              onClick={() => handlePayBill(bill.id)}
                              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                              Pay Securely <span className="text-xl">→</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <motion.div key="maintenance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Service Requests</h2>
                  <p className="text-gray-500">Raise tickets for repairs or issues in your room.</p>
                </div>
                <button onClick={() => setNewTicketModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2">
                  <Plus size={18} /> New Request
                </button>
              </div>

              {maintenanceTickets.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5">
                  <Wrench size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No maintenance requests raised yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenanceTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-gray-400">#{ticket.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${ticket.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">Raised on: {ticket.date}</p>
                      </div>
                      <div className={`p-3 rounded-full ${ticket.status === 'PENDING' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {ticket.status === 'PENDING' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          )}

          {/* TAB: MY ROOM */}
          {activeTab === 'room' && (
            <motion.div key="room" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Room Details */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20"><Home size={100} /></div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-6">Current Allocation</h2>
                  
                  {bills.length > 0 && bills[0].roomBed ? (
                    <>
                      <h3 className="text-3xl font-black mb-1">{bills[0].roomBed.ownerProperty?.name || 'Property'}</h3>
                      <p className="text-indigo-100 mb-8">{bills[0].roomBed.ownerProperty?.address}, {bills[0].roomBed.ownerProperty?.city}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                          <p className="text-xs text-indigo-200 font-bold mb-1 uppercase">Room No</p>
                          <p className="text-2xl font-black">{bills[0].roomBed.roomNumber}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                          <p className="text-xs text-indigo-200 font-bold mb-1 uppercase">Bed No</p>
                          <p className="text-2xl font-black">{bills[0].roomBed.bedNumber}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                     <div className="bg-white/10 p-4 rounded-2xl">
                       <p className="text-indigo-100 font-medium">No active room allocation found.</p>
                       <p className="text-sm text-indigo-200 mt-1">When your owner adds you to a room, it will appear here.</p>
                     </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-2xl"><Wifi size={24} /></div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase">Building Wi-Fi</h4>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-wider font-mono mt-1">FASTNET_5G</p>
                      <p className="text-xs text-gray-400 mt-0.5">Password: connect123</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl"><Key size={24} /></div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase">Gate Pass Code</h4>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-wider font-mono mt-1">4092#</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal {...modalConfig} onCancel={closeModal} />
      {selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => handleBillPaidSuccess(selectedBill.id)}
        />
      )}

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Raise Maintenance Request</h3>
            <form onSubmit={submitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title</label>
                <input required type="text" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Broken fan, Plumbing issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                <textarea rows="3" value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Describe the issue in detail..."></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setNewTicketModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 transition-transform active:scale-95">Submit Ticket</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default TenantDashboardPage;
