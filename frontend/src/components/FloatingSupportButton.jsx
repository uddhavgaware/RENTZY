import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, User, ArrowRight, Loader2, Minimize2, Maximize2, RotateCcw, Paperclip, CheckCircle2, ChevronRight, Zap, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import geminiService from '../services/geminiService';

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
      text: 'Hello! I am RentXY AI (powered by Google Gemini ✨). How can I help you find zero-brokerage properties, flatmates, or movers today?',
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

  const handleSendMessage = async (textToSend = '') => {
    const query = textToSend.trim() || inputValue.trim();
    if (!query) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    const lower = query.toLowerCase();

    // Intent detection
    const isGreeting = /^(hi|hello|hey|yo|sup|hola)\b/i.test(lower);
    const wantsRoommate = /\b(roommate|roomie|flatmate|partner|friend|match)\b/i.test(lower);
    const wantsMover = /\b(packer|mover|moving|shift|truck|relocat)\b/i.test(lower);
    const wantsPost = /\b(owner|list|post|rent out|add property|hostel|pg|flat)\b/i.test(lower) && /\b(my|list|post|add|rent out|want)\b/i.test(lower);
    const wantsHostelOrPG = /\b(hostel|pg|paying guest|co-living)\b/i.test(lower);
    const wantsBrokerage = /\b(brokerage|free|charge|commission|fee)\b/i.test(lower);

    // Extract location keywords (Indian cities/areas)
    const locationPatterns = /(?:in|near|at|around|from)\s+([a-z\s]+?)(?:\s+under|\s+below|\s+within|\s+for|\s*$)/i;
    const locMatch = lower.match(locationPatterns);
    let searchLocation = locMatch ? locMatch[1].trim() : '';

    // Also try direct city names
    const knownCities = ['pune', 'mumbai', 'bangalore', 'bengaluru', 'delhi', 'kolhapur', 'satara', 'hyderabad', 'chennai', 'koregaon park', 'viman nagar', 'hinjewadi', 'kothrud', 'wakad', 'baner', 'hadapsar', 'narhe', 'zeal', 'jspm', 'ambegaon', 'katraj', 'dhayari', 'sinhgad', 'wagholi', 'warje', 'bavdhan'];
    if (!searchLocation) {
      for (const city of knownCities) {
        if (lower.includes(city)) { searchLocation = city; break; }
      }
    }

    // Extract budget
    const budgetMatch = lower.match(/(?:under|below|within|budget)\s*₹?\s*(\d+[,.]?\d*)\s*(k|lakh|thousand)?/i);
    let maxBudget = null;
    if (budgetMatch) {
      maxBudget = parseFloat(budgetMatch[1].replace(',', ''));
      if (budgetMatch[2] && /k|thousand/i.test(budgetMatch[2])) maxBudget *= 1000;
      if (budgetMatch[2] && /lakh/i.test(budgetMatch[2])) maxBudget *= 100000;
    }

    const wantsProperty = /\b(flat|room|pg|hostel|house|apartment|property|rent)\b/i.test(lower);

    try {
      let replyText = '';
      let actionButton = null;
      let listingCards = null;

      // 1. Search database for real listing matches if location/budget/property mentioned
      if (searchLocation || maxBudget || wantsProperty) {
        try {
          const params = {};
          if (searchLocation) params.location = searchLocation;
          if (maxBudget) params.maxPrice = maxBudget;
          params.size = 5;

          const res = await api.get('/listings', { params });
          const results = res.data?.content || res.data || [];
          if (results.length > 0) {
            listingCards = results.slice(0, 3).map(l => ({
              id: l.id,
              title: l.title,
              price: l.price,
              location: l.location,
              type: l.type,
            }));
            actionButton = {
              label: `🔍 View All ${results.length} Matching Results`,
              onClick: () => { navigate(`/listings?location=${encodeURIComponent(searchLocation || '')}`); setOpen(false); }
            };
          }
        } catch (dbErr) {
          console.warn('DB search in AI chat failed:', dbErr);
        }
      }

      // 2. Set action buttons for navigation intents
      if (wantsPost) {
        actionButton = { label: '📤 Post Property / Hostel Free', onClick: () => { navigate(`/post-property${searchLocation ? `?location=${encodeURIComponent(searchLocation)}` : ''}`); setOpen(false); } };
      } else if (wantsRoommate) {
        actionButton = { label: '🤝 Find Roommates', onClick: () => { navigate('/roommates'); setOpen(false); } };
      } else if (wantsMover) {
        actionButton = { label: '🚚 Book Movers', onClick: () => { navigate('/movers'); setOpen(false); } };
      } else if (wantsHostelOrPG) {
        actionButton = { label: `🔍 Browse PGs & Hostels ${searchLocation ? `in ${searchLocation.toUpperCase()}` : ''}`, onClick: () => { navigate(`/listings?type=PG${searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : ''}`); setOpen(false); } };
      }

      // 3. Ask Google Gemini API for an intelligent, natural response!
      try {
        replyText = await geminiService.askRentXYAI(query, messages, {
          foundPropertiesCount: listingCards?.length || 0,
          searchLocation,
          maxBudget,
          wantsRoommate,
          wantsMover,
          wantsPost,
          wantsHostelOrPG
        });
      } catch (geminiErr) {
        console.warn('Gemini API fallback triggered:', geminiErr);
        // Fallback rule-based replies if offline or network error
        if (isGreeting) {
          replyText = "Hello! 👋 I'm RentXY AI — your smart property assistant. I can search real listings or help you post your property! Try asking:\n• \"Flats in Narhe under 10k\"\n• \"List my Hostel near Zeal College\"\n• \"Find me a roommate in Pune\"";
        } else if (wantsPost) {
          replyText = `Awesome! You can list your property, hostel, or PG ${searchLocation ? `near ${searchLocation.toUpperCase()}` : ''} completely FREE with zero brokerage on RentXY!\n\n✨ Our AI Smart Assist will automatically recommend the best rent price (e.g. ₹10k for 1BHK / ₹4.5k for PG in Narhe) and generate catchy descriptions for you. Click below to start!`;
        } else if (listingCards && listingCards.length > 0) {
          replyText = `Found ${listingCards.length} verified zero-brokerage properties matching your search! Here are the top picks:`;
        } else if (wantsRoommate) {
          replyText = 'Our AI Roommate Finder matches you with compatible partners using a 10-factor algorithm — analyzing diet, lifestyle, sleep habits, and budget range!';
        } else if (wantsMover) {
          replyText = 'Need to relocate? RentXY Movers provides verified packing & moving services with real-time route tracking on satellite maps!';
        } else if (wantsHostelOrPG) {
          replyText = `We have active zero-brokerage student PGs and Hostels listed ${searchLocation ? `around ${searchLocation.toUpperCase()}` : 'across Pune & Maharashtra'}! Click below to browse verified student stays with mess & Wi-Fi amenities.`;
        } else {
          replyText = `I can help you find PGs, flats, roommates, or movers across Maharashtra! Try asking something like:\n• "1BHK in Narhe under 10k"\n• "Hostel near Zeal College"\n• "Find roommates in Kothrud"`;
        }
      }

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        action: actionButton,
        listings: listingCards,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Oops, something went wrong searching our database. Please try again!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    setIsTyping(false);
  };
  const handleQuickOption = (opt) => {
    handleSendMessage(opt);
  };

  return (
    <div className="fixed bottom-28 md:bottom-6 right-6 z-[1050] flex flex-col items-end gap-3 font-sans select-none">

      {/* Interactive AI Chat Window */}
      {open && (
        <div className="animate-slide-up bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)] border border-indigo-100/50 dark:border-indigo-900/30 overflow-hidden w-80 sm:w-96 flex flex-col h-[480px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-700 px-5 py-4 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <Sparkles size={20} className="text-white animate-pulse drop-shadow-md" />
              </div>
              <div>
                <p className="font-black text-white text-sm tracking-wide drop-shadow-md">RentXY AI <span className="text-purple-200 font-medium text-[10px] ml-1 bg-white/20 px-1.5 py-0.5 rounded-full border border-white/20">Beta</span></p>
                <p className="text-indigo-100 text-[10px] flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  Powered by Google Gemini ✨
                </p>
              </div>
            </div>
            {chatMode && (
              <button
                onClick={() => setChatMode(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold border border-white/30 rounded-xl px-2.5 py-1.5 transition-all backdrop-blur-sm relative z-10"
              >
                Back
              </button>
            )}
          </div>

          {/* Body Content */}
          {!chatMode ? (
            /* Main Menu */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between bg-white dark:bg-gray-900">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/50 dark:border-purple-900/30 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 dark:bg-purple-500/10 blur-xl rounded-full translate-x-8 -translate-y-8"></div>
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-2xl mx-auto mb-3 text-purple-600">
                    <Sparkles size={24} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                  </div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">Hi, I'm RentXY AI!</h4>
                  <p className="text-gray-500 dark:text-gray-300 text-xs mt-1.5 leading-relaxed relative z-10">
                    Locate flatmates, secure packers & movers, or search zero-brokerage stays instantly using AI.
                  </p>
                  <button
                    onClick={() => setChatMode(true)}
                    className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2 relative z-10"
                  >
                    Start AI Chat <Sparkles size={14} />
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
                <p className="text-[10px] text-gray-400 dark:text-gray-500">RentXY Support · Available Mon–Sat, 9am–8pm IST</p>
              </div>
            </div>
          ) : (
            /* Interactive Chat Mode */
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-950/20 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 to-transparent dark:from-purple-900/10 pointer-events-none z-0"></div>
              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start gap-2'} animate-fade-in`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-7 h-7 mt-0.5 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 border border-purple-200 dark:border-purple-800/50 flex flex-shrink-0 items-center justify-center shadow-sm relative overflow-hidden">
                        <Sparkles size={12} className="text-purple-600 dark:text-purple-400 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/20 to-indigo-400/20 animate-spin" style={{ animationDuration: '3s' }}></div>
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${msg.sender === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-purple-500/20 border border-purple-500/30'
                        : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-100 border border-indigo-100/60 dark:border-gray-700 rounded-tl-none shadow-sm'
                      }`}>
                      <p className="text-[11.5px] leading-relaxed font-medium whitespace-pre-line">{msg.text}</p>

                      {/* Real Listing Cards from Database */}
                      {msg.listings && msg.listings.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {msg.listings.map(l => (
                            <div
                              key={l.id}
                              onClick={() => { navigate(`/listings/${l.id}`); setOpen(false); }}
                              className="flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                            >
                              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 text-xs font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                🏠
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{l.title}</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{l.location}</p>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                ₹{l.price?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

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
                  <div className="flex justify-start gap-2 animate-fade-in">
                    <div className="w-7 h-7 mt-0.5 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 border border-purple-200 dark:border-purple-800/50 flex flex-shrink-0 items-center justify-center shadow-sm">
                      <Sparkles size={12} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                    </div>
                    <div className="bg-gradient-to-r from-white to-purple-50/50 dark:from-gray-800 dark:to-gray-800/80 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] font-bold ml-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 opacity-80 animate-pulse">Gemini is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Predefined Quick Pills */}
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto hide-scrollbar flex-shrink-0">
                {[
                  'Flats in Pune',
                  'PG under 10k',
                  'Find Roommates',
                  'Book Movers'
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
              <div className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-indigo-50 dark:border-gray-800 flex gap-2 items-center flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50 dark:to-indigo-900/10 pointer-events-none"></div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Gemini AI..."
                  className="flex-grow bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-indigo-100/50 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder-gray-400 relative z-10 transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 flex items-center justify-center flex-shrink-0 relative z-10"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Floating Action Button (FAB) */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center transition-all duration-500 active:scale-90 relative group ${open
            ? 'bg-gray-800 hover:bg-gray-900 rotate-90'
            : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500'
          }`}
        aria-label="Support AI Bot"
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${!open ? 'animate-pulse' : 'hidden'}`}></div>
        
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {open ? (
            <X size={24} className="text-white drop-shadow-md" />
          ) : (
            <Sparkles size={24} className="text-white drop-shadow-lg" />
          )}
        </div>

        {!open && (
          <>
            <span className="absolute w-[68px] h-[68px] rounded-full border border-purple-400/30 animate-ping" style={{ animationDuration: '3s' }} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 text-[8px] text-white font-black items-center justify-center shadow-lg border border-purple-300/50">AI</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingSupportButton;
