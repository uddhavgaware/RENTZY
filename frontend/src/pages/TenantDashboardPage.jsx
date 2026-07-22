import React, { useState, useEffect } from 'react';
import { FileText, Zap, DollarSign, Droplet, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

const TenantDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/bills/tenant');
      setBills(res.data);
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
    // In a real application, this would integrate with Razorpay or Stripe.
    // For this prototype, we'll just show a pending implementation message.
    showModal({
      type: 'alert',
      title: 'Payment Gateway Integration',
      message: 'Razorpay integration is pending. Please contact your property owner to mark this bill as paid.',
      onConfirm: closeModal
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 pt-10 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Tenant Portal (Rent & EB)</h1>
              <p className="text-gray-400 text-sm mt-0.5">View and pay your rent, electricity, and maintenance bills.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {bills.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-gray-100 dark:border-white/10 shadow-sm">
            <FileText size={48} className="mx-auto text-teal-400 mb-3" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white">No Bills Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mt-1 mb-6">You currently have no pending rent or electricity bills. When your property owner generates a bill, it will appear here.</p>
            <button onClick={fetchBills} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all">Refresh Bills</button>
          </div>
        ) : (
          <div className="space-y-6">
            {bills.map(bill => {
              const isPaid = bill.status === 'PAID';
              return (
                <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden transition-all hover:shadow-xl">
                  {/* Status Banner */}
                  <div className={`px-6 py-3 flex items-center justify-between border-b ${isPaid ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/50' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50'}`}>
                    <div className="flex items-center gap-2">
                      {isPaid ? <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" /> : <Clock size={18} className="text-amber-600 dark:text-amber-400" />}
                      <span className={`font-bold text-sm ${isPaid ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {isPaid ? 'Paid Successfully' : 'Payment Pending'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      Due: {bill.dueDate || '10th of Month'}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Bill for {bill.billingMonth || 'Current Month'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Property: {bill.roomBed?.ownerProperty?.name} (Room {bill.roomBed?.roomNumber})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Amount Due</p>
                        <p className={`text-3xl font-black ${isPaid ? 'text-green-600' : 'text-primary-600'}`}>₹{bill.totalAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-white/5 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Charges Breakdown</h3>
                      
                      <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2"><DollarSign size={16} className="text-gray-400"/> Base Rent</div>
                        <span>₹{bill.baseRent?.toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2"><Zap size={16} className="text-amber-500"/> Electricity (EB)</div>
                        <span>₹{bill.electricityAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      {bill.electricityAmount > 0 && (
                        <div className="pl-6 text-xs text-gray-400 -mt-2">
                          {bill.unitsConsumed} units @ ₹{bill.electricityRate}/unit (Reading: {bill.prevElectricityReading} → {bill.currElectricityReading})
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2"><Droplet size={16} className="text-blue-500"/> Maintenance / Water</div>
                        <span>₹{((bill.maintenanceAmount || 0) + (bill.waterCharge || 0)).toLocaleString('en-IN')}</span>
                      </div>

                      {bill.otherCharges > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="pl-6">Other Charges</span>
                          <span>₹{bill.otherCharges?.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => handlePayBill(bill.id)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary-600/20 text-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        Pay ₹{bill.totalAmount?.toLocaleString('en-IN')} Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title} type={modalConfig.type} onConfirm={modalConfig.onConfirm}>
        <p className="text-sm text-gray-600 dark:text-gray-300">{modalConfig.message}</p>
      </Modal>
    </div>
  );
};

export default TenantDashboardPage;
