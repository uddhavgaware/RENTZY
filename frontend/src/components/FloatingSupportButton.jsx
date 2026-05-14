import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, HelpCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HIDE_ON = ['/messages', '/admin', '/auth', '/complete-profile'];

const FloatingSupportButton = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hide on certain pages
  if (HIDE_ON.some(path => location.pathname.startsWith(path))) return null;

  const handleChatWithAdmin = async () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/messages');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/users/admin');
      const adminId = res.data.id;
      navigate(`/messages?user=${adminId}`);
    } catch {
      navigate('/messages');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
      
      {/* Popup menu */}
      {open && (
        <div className="animate-slide-up bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-72">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">RentXY Support</p>
                <p className="text-primary-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  Usually replies in minutes
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="p-3 space-y-1.5">
            <button
              onClick={handleChatWithAdmin}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">Chat with Support</p>
                <p className="text-xs text-gray-500 truncate">
                  {loading ? 'Opening chat...' : 'Send a message directly to admin'}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </button>

            <button
              onClick={() => { navigate('/faq'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <HelpCircle size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">FAQs</p>
                <p className="text-xs text-gray-500">Browse common questions</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </button>
          </div>

          <div className="px-4 pb-3 text-center">
            <p className="text-[10px] text-gray-400">RentXY Support · Available Mon–Sat, 9am–8pm IST</p>
          </div>
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
          open
            ? 'bg-gray-700 hover:bg-gray-800 rotate-90'
            : 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800'
        }`}
        aria-label="Support"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute w-14 h-14 rounded-full bg-primary-500 opacity-30 animate-ping" />
        )}
      </button>
    </div>
  );
};

export default FloatingSupportButton;
