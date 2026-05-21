import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, HelpCircle, ShieldCheck, ChevronRight, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HIDE_ON = ['/messages', '/admin', '/auth', '/complete-profile'];

const FloatingSupportButton = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [chatMode, setChatMode] = useState(false); // false = main menu, true = AI chat
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Rentzy AI, your virtual assistant. How can I help you find your dream home or roommate today? ✨',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

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

  const handleSendMessage = (textToSend = '') => {
    const query = textToSend.trim() || inputValue.trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // AI Semantic response generation
    setTimeout(() => {
      let replyText = '';
      let actionButton = null;
      const lower = query.toLowerCase();

      if (lower.includes('pune') || lower.includes('kolhapur') || lower.includes('satara') || lower.includes('maharashtra')) {
        replyText = 'Excellent choice! Maharashtra is booming! We have active PGs, flats, and roommates available across Pune (Koregaon Park, Viman Nagar), Kolhapur, and Satara. All 100% brokerage-free!';
        actionButton = {
          label: '🔍 Browse Maharashtra Stays',
          onClick: () => { navigate('/listings?location=Maharashtra'); setOpen(false); }
        };
      } else if (lower.includes('bangalore') || lower.includes('bengaluru') || lower.includes('karnataka')) {
        replyText = 'Bangalore has some of our top-rated smart co-living homes and IT hub PGs! Check out our brokerage-free options in Indiranagar, HSR, and Whitefield.';
        actionButton = {
          label: '🏢 View Bangalore Flats',
          onClick: () => { navigate('/listings?location=Bangalore'); setOpen(false); }
        };
      } else if (lower.includes('brokerage') || lower.includes('free') || lower.includes('charge') || lower.includes('commission')) {
        replyText = 'Rentzy is completely brokerage-free! No hidden commissions, no middle-men. You connect directly with government ID-verified owners to book visits.';
        actionButton = {
          label: '🏠 Find A Stay Now',
          onClick: () => { navigate('/listings'); setOpen(false); }
        };
      } else if (lower.includes('roommate') || lower.includes('roomie') || lower.includes('roomy') || lower.includes('partner') || lower.includes('friend')) {
        replyText = 'Our AI Roommate Finder matches you with highly compatible partners based on lifestyle, diet (Veg/Non-Veg), gender preference, and hobbies!';
        actionButton = {
          label: '🤝 Find Roommates',
          onClick: () => { navigate('/roommates'); setOpen(false); }
        };
      } else if (lower.includes('packer') || lower.includes('mover') || lower.includes('moving') || lower.includes('shift') || lower.includes('truck')) {
        replyText = 'Need relocation assistance? Rentzy Packers & Movers offers government ID-verified professional moving assistance with instant automated quotes!';
        actionButton = {
          label: '🚚 Packers & Movers',
          onClick: () => { navigate('/movers'); setOpen(false); }
        };
      } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('yo')) {
        replyText = 'Hello there! Rentzy AI here. I can help you locate PGs/flats in Pune, Satara, Kolhapur, find roommates, or guide you with packers & movers. What are you looking for today?';
      } else if (lower.includes('owner') || lower.includes('list') || lower.includes('post') || lower.includes('rent out')) {
        replyText = 'Listing your PG or Flat is completely free and takes less than 3 minutes! You can reach thousands of verified seekers instantly.';
        actionButton = {
          label: '📤 Post Free Property',
          onClick: () => { navigate('/post-property'); setOpen(false); }
        };
      } else {
        replyText = "I'm on it! Rentzy simplifies finding premium, zero-brokerage apartments, PGs, and verified roommates in key cities. How else can I assist you?";
      }

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        action: actionButton,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleQuickOption = (opt) => {
    handleSendMessage(opt);
  };

  return (
    <div className="fixed bottom-28 md:bottom-6 right-6 z-[999] flex flex-col items-end gap-3 font-sans select-none">

      {/* Interactive AI Chat Window */}
      {open && (
        <div className="animate-slide-up bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden w-80 sm:w-96 flex flex-col h-[480px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-primary-600 to-indigo-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Sparkles size={20} className="text-white animate-pulse" />
              </div>
              <div>
                <p className="font-black text-white text-sm">Rentzy AI Assistant</p>
                <p className="text-primary-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Online & Free
                </p>
              </div>
            </div>
            {chatMode && (
              <button
                onClick={() => setChatMode(false)}
                className="text-white/60 hover:text-white text-xs font-bold border border-white/20 rounded-xl px-2 py-1 transition-all"
              >
                Back to Menu
              </button>
            )}
          </div>

          {/* Body Content */}
          {!chatMode ? (
            /* Main Menu */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between bg-white dark:bg-gray-900">
              <div className="space-y-4">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-1">🤖</p>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">Hi, I'm Rentzy AI!</h4>
                  <p className="text-gray-500 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                    Locate flatmates, secure packers & movers, or search zero-brokerage stays in Maharashtra (Pune, Kolhapur, Satara) instantly!
                  </p>
                  <button
                    onClick={() => setChatMode(true)}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                  >
                    Start AI Assistant Chat ✨
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Quick Actions</p>

                  <button
                    onClick={handleChatWithAdmin}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors text-left group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 bg-primary-50 dark:bg-primary-950/30 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                      <MessageCircle size={16} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-xs">Chat with Support Team</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {loading ? 'Opening chat...' : 'Direct support channel'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => { navigate('/faq'); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors text-left group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-400">
                      <HelpCircle size={16} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-xs">Help & FAQs</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Frequently Asked Questions</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Rentzy Support · Available Mon–Sat, 9am–8pm IST</p>
              </div>
            </div>
          ) : (
            /* Interactive Chat Mode */
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-950/20">
              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                      }`}>
                      <p className="text-xs leading-relaxed font-semibold">{msg.text}</p>

                      {msg.action && (
                        <button
                          onClick={msg.action.onClick}
                          className="mt-2.5 w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 transition-all text-center flex items-center justify-center"
                        >
                          {msg.action.label}
                        </button>
                      )}

                      <span className={`text-[8px] mt-1 block text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Predefined Quick Pills */}
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto hide-scrollbar flex-shrink-0">
                {[
                  'Stays in Pune',
                  'Zero Brokerage',
                  'Find Roommates',
                  'Relocation movers'
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleQuickOption(opt)}
                    className="bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-center flex-shrink-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about Pune, Satara, roommates..."
                  className="flex-grow bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Floating Action Button (FAB) */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 relative ${open
            ? 'bg-gray-800 hover:bg-gray-900 rotate-90'
            : 'bg-gradient-to-br from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700'
          }`}
        aria-label="Support AI Bot"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}

        {!open && (
          <>
            <span className="absolute w-14 h-14 rounded-full bg-indigo-500 opacity-30 animate-ping" />
            <span className="absolute -top-1.5 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 text-[8px] text-white font-black items-center justify-center">AI</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingSupportButton;
