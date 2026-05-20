import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Info, ArrowLeft } from 'lucide-react';
import { chatService } from '../services/chatService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed.charAt(0).toUpperCase();
};

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-fill message from URL
  useEffect(() => {
    const text = searchParams.get('text');
    if (text) {
      setNewMessage(text);
    }
  }, [searchParams]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    const fetchConvos = async () => {
      try {
        const convos = await chatService.getConversations();
        setConversations(convos);
        
        // If coming from a direct message link (e.g. ?user=3)
        const userId = searchParams.get('user');
        if (userId) {
          const uId = parseInt(userId);
          setActiveChat(uId);
          setShowMobileChat(true);
          // Add dummy conversation if not in list yet so UI shows them
          if (!convos.find(c => c.id === uId)) {
            try {
              // Fetch real user details
              const res = await api.get(`/users/${uId}`);
              const fetchedUser = res.data;
              setConversations([{ id: uId, name: fetchedUser.name, role: fetchedUser.role, profilePhoto: fetchedUser.profilePhoto }, ...convos]);
            } catch (userErr) {
              setConversations([{ id: uId, name: 'User', role: 'USER' }, ...convos]);
            }
          }
        } else if (convos.length > 0 && !activeChat) {
          setActiveChat(convos[0].id);
        }
      } catch (err) {
        console.error('Error fetching conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConvos();
  }, []);

  // Fetch chat history with active user + Polling
  useEffect(() => {
    if (!activeChat) return;

    const fetchHistory = async () => {
      try {
        const history = await chatService.getChatHistory(activeChat);
        setMessages(history);
      } catch (err) {
        console.error('Error fetching history', err);
      }
    };

    fetchHistory();

    // Short Polling every 3 seconds
    const intervalId = setInterval(fetchHistory, 3000);

    return () => clearInterval(intervalId);
  }, [activeChat]);

  const getActiveStatus = () => {
    if (!messages || messages.length === 0) return 'Offline';
    const lastMsg = messages[messages.length - 1];
    const timestamp = lastMsg?.timestamp;
    if (!timestamp) return 'Offline';

    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 5) {
      return 'Active now';
    } else if (diffMins < 60) {
      return `Active ${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `Active ${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `Active ${diffDays}d ago`;
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempMessage = {
      id: Date.now(), // temporary ID
      content: newMessage,
      sender: { email: user?.email },
      timestamp: new Date().toISOString()
    };
    
    // Optimistic UI update
    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      await chatService.sendMessage(activeChat, messageToSend);
    } catch (err) {
      console.error('Failed to send message', err);
      // Optional: Handle failure (e.g., remove from optimistic UI)
    }
  };

  return (
    <div className="bg-gray-50 h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar - Contacts List */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col flex-shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No active conversations.</div>
          ) : (
            conversations.map((contact) => (
              <button 
                key={contact.id}
                onClick={() => { setActiveChat(contact.id); setShowMobileChat(true); }}
                className={`w-full flex items-start p-4 border-b border-gray-50 transition-colors text-left ${activeChat === contact.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg mr-4 border-2 border-white shadow-sm flex-shrink-0">
                  {contact.profilePhoto ? <img src={contact.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (contact.name?.charAt(0) || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-semibold truncate ${activeChat === contact.id ? 'text-primary-900' : 'text-gray-900'}`}>
                      {maskName(contact.name)} <span className="text-gray-400 text-xs font-normal ml-1">#{contact.id}</span>
                    </h3>
                  </div>
                  <p className="text-xs text-primary-600 mb-1">{contact.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white w-full h-full`}>
        {!activeChat ? (
           <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
             <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
               <Info size={40} className="text-gray-300" />
             </div>
             <p className="font-medium text-xl text-gray-600">Select a conversation</p>
             <p className="text-sm mt-2 text-gray-400">Choose a contact to start chatting</p>
           </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-20 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-white z-10 shadow-sm">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-4 text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full active:scale-95"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl mr-4 border border-primary-200 shadow-sm">
                  {conversations.find(c => c.id === activeChat)?.profilePhoto ? <img src={conversations.find(c => c.id === activeChat).profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (conversations.find(c => c.id === activeChat)?.name?.charAt(0) || 'U')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {maskName(conversations.find(c => c.id === activeChat)?.name) || 'User'} 
                    <span className="text-gray-400 text-sm font-normal ml-1">#{activeChat}</span>
                  </h3>
                  <p className={`text-xs font-semibold ${getActiveStatus() === 'Active now' ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {getActiveStatus()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-400">
                <button className="hover:text-primary-600 transition-colors" title="Info"><Info size={20} /></button>
                <button className="hover:text-gray-600 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col">
              {conversations.find(c => c.id === activeChat)?.phone && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-center shadow-sm">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Direct Contact:</span> You can call {maskName(conversations.find(c => c.id === activeChat).name)} at{' '}
                    <a href={`tel:${conversations.find(c => c.id === activeChat).phone}`} className="font-bold text-primary-600 hover:underline">
                      {conversations.find(c => c.id === activeChat).phone}
                    </a>
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 mt-10">No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender.email === user?.email;
                    const timeString = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    if (isMe) {
                      return (
                        <div key={msg.id || idx} className="flex items-end justify-end mb-2">
                          <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white px-5 py-3.5 rounded-2xl rounded-br-sm max-w-[75%] shadow-md shadow-primary-600/20 transform transition-all hover:-translate-y-0.5">
                            <p className="text-[15px] leading-relaxed">{msg.content}</p>
                            <span className="text-[10px] text-primary-200 block mt-1.5 text-right font-medium">{timeString}</span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id || idx} className="flex items-end mb-2">
                          <div className="w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center font-bold text-xs mr-3 mb-1 shadow-sm border border-gray-200 flex-shrink-0">
                            {msg.sender?.profilePhoto ? <img src={msg.sender.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (msg.sender?.name?.charAt(0) || 'U')}
                          </div>
                          <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-sm max-w-[75%] shadow-md transform transition-all hover:-translate-y-0.5">
                            <p className="text-[15px] text-gray-800 leading-relaxed">{msg.content}</p>
                            <span className="text-[10px] text-gray-400 block mt-1.5 text-right font-medium">{timeString}</span>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-end bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none outline-none resize-none p-3 text-gray-800 placeholder-gray-400 h-12"
                />
                <div className="p-1 flex-shrink-0">
                  <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
