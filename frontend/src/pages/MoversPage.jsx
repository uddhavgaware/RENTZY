import React, { useState } from 'react';
import { Truck, MapPin, Calendar, Package, ArrowRight, ShieldCheck, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

const MoversPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const [formData, setFormData] = useState({
    fromLocation: '',
    toLocation: '',
    movingDate: '',
    movingTime: 'Morning (8 AM - 12 PM)',
    propertySize: '1BHK',
    additionalNotes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth?redirect=/movers');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/moving/request', formData);
      showModal({ 
        type: 'alert', 
        title: 'Request Submitted', 
        message: 'Moving request submitted successfully! Verified Agents will contact you shortly to confirm the details.', 
        onConfirm: () => {
          closeModal();
          navigate('/dashboard?tab=moving');
        } 
      });
    } catch (err) {
      showModal({ 
        type: 'alert', 
        title: 'Error', 
        message: `Failed to submit request: ${err.response?.data?.message || err.message || 'Unknown error'}. Please try again.`, 
        onConfirm: closeModal 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <span className="bg-primary-800 text-primary-200 px-3 py-1 rounded-full text-sm font-semibold tracking-wide uppercase mb-6 inline-block border border-primary-700">RENTZY Premium Services</span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Stress-Free Packing & Moving</h1>
            <p className="text-lg text-primary-100 mb-8 max-w-lg">
              Relocating doesn't have to be a nightmare. Get instant quotes, top-rated professional movers, and 100% damage protection.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="text-green-400" size={18} /> Verified Partners</div>
              <div className="flex items-center gap-2 text-sm font-medium"><Clock className="text-green-400" size={18} /> On-Time Guarantee</div>
            </div>
          </div>
          
          <div className="md:w-1/2 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-gray-900">
            <h2 className="text-2xl font-bold mb-6 text-center">Get a Free Quote</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Moving From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" required value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} placeholder="e.g. Andheri East, Mumbai (include landmarks)" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <p className="text-xs text-gray-500 ml-1">Please provide accurate details so verified agents can locate you.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Moving To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-primary-400" size={18} />
                  <input type="text" required value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})} placeholder="e.g. Indiranagar, Bangalore (include landmarks)" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.movingDate} onChange={e => setFormData({...formData, movingDate: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select value={formData.movingTime} onChange={e => setFormData({...formData, movingTime: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Morning (8 AM - 12 PM)">Morning</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon</option>
                      <option value="Evening (4 PM - 8 PM)">Evening</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Property Size</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select value={formData.propertySize} onChange={e => setFormData({...formData, propertySize: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="1RK">1 RK</option>
                      <option value="1BHK">1 BHK</option>
                      <option value="2BHK">2 BHK</option>
                      <option value="3BHK">3 BHK</option>
                      <option value="4BHK+">4 BHK+</option>
                      <option value="FewItems">Just a few items</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95 disabled:opacity-70">
                {loading ? 'Submitting...' : <>Get Instant Quote <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose RENTZY Movers?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">We've partnered with the best in the business to ensure your belongings reach safely.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Damage Protection</h3>
            <p className="text-gray-500">Up to ₹50,000 transit insurance included in every premium move.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Pricing</h3>
            <p className="text-gray-500">No hidden charges. The quote you get is the final amount you pay.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Partners</h3>
            <p className="text-gray-500">We only work with background-verified and highly rated vendors.</p>
          </div>
        </div>
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default MoversPage;
