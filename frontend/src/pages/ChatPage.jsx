import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Info, ArrowLeft, Check, CheckCheck, Edit2, Trash2, X } from 'lucide-react';
import { chatService } from '../services/chatService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
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

  // Fetch conversations + Polling
  useEffect(() => {
    let isMounted = true;
    const fetchConvos = async () => {
      try {
        const convos = await chatService.getConversations();
        if (!isMounted) return;
        setConversations(prevConvos => {
          // Merge: keep any dummy entries that aren't in the server response
          const serverIds = new Set(convos.map(c => c.id));
          const dummyEntries = prevConvos.filter(c => !serverIds.has(c.id));
          return [...convos, ...dummyEntries];
        });
        
        // If coming from a direct message link (e.g. ?user=3)
        const userId = searchParams.get('user');
        if (userId) {
          const uId = parseInt(userId);
          if (!activeChatRef.current) {
            setActiveChat(uId);
            setShowMobileChat(true);
          }
          // Add dummy conversation if not in list yet so UI shows them
          if (!convos.find(c => c.id === uId)) {
            try {
              // Fetch real user details
              const res = await api.get(`/users/${uId}`);
              const fetchedUser = res.data;
              if (isMounted) {
                setConversations(prev => {
                  if (!prev.find(c => c.id === uId)) {
                    return [{ id: uId, name: fetchedUser.name, role: fetchedUser.role, profilePhoto: fetchedUser.profilePhoto }, ...prev];
                  }
                  return prev;
                });
              }
            } catch (userErr) {
              if (isMounted) {
                setConversations(prev => {
                  if (!prev.find(c => c.id === uId)) {
                    return [{ id: uId, name: 'User', role: 'USER' }, ...prev];
                  }
                  return prev;
                });
              }
            }
          }
        } else if (convos.length > 0 && !activeChatRef.current) {
          setActiveChat(convos[0].id);
        }
      } catch (err) {
        console.error('Error fetching conversations', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchConvos();

    // Poll conversations every 10 seconds
    const convosIntervalId = setInterval(fetchConvos, 10000);
    return () => {
      isMounted = false;
      clearInterval(convosIntervalId);
    };
  }, [searchParams]);

  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Connect to WebSocket on load
  useEffect(() => {
    if (user?.id) {
      chatService.connect(user.id, (newMessage) => {
        // If the message is part of the active conversation, append it
        setMessages((prevMessages) => {
          const currentActiveChat = activeChatRef.current;
          if (
            (newMessage.sender.id === currentActiveChat) || 
            (newMessage.receiver.id === currentActiveChat)
          ) {
            // Check if this message already exists (by real DB id) - if so, it's an update (edit/delete/read)
            const existingIdx = prevMessages.findIndex(m => m.id === newMessage.id);
            if (existingIdx !== -1) {
              const updated = [...prevMessages];
              updated[existingIdx] = newMessage;
              return updated;
            }
            // Replace any optimistic temp messages with matching content from same sender
            const tempIdx = prevMessages.findIndex(m => 
              String(m.id).startsWith('temp-') && 
              m.content === newMessage.content &&
              m.sender?.email === newMessage.sender?.email
            );
            if (tempIdx !== -1) {
              const updated = [...prevMessages];
              updated[tempIdx] = newMessage;
              return updated;
            }
            
            // Mark as read if we are the receiver and chat is active
            if (newMessage.receiver.id === user.id && !newMessage.isRead) {
              chatService.markAsRead(newMessage.id).catch(console.error);
            }

            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });
      });

      return () => {
        chatService.disconnect();
      };
    }
  }, [user]);

  // Fetch chat history with active user
  useEffect(() => {
    if (!activeChat) return;

    const fetchHistory = async () => {
      try {
        const history = await chatService.getChatHistory(activeChat);
        setMessages(history);
        
        // Mark all unread messages from the other user as read
        const unreadMessages = history.filter(m => m.receiver.id === user.id && !m.isRead);
        unreadMessages.forEach(m => {
          chatService.markAsRead(m.id).catch(console.error);
        });
      } catch (err) {
        console.error('Error fetching history', err);
      }
    };

    fetchHistory();
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

    const messageToSend = newMessage;
    setNewMessage('');

    if (editingMessage) {
      const msgId = editingMessage.id;
      setEditingMessage(null);
      try {
        const savedMsg = await chatService.editMessage(msgId, messageToSend);
        setMessages(prev => prev.map(m => m.id === msgId ? savedMsg : m));
      } catch (err) {
        console.error('Failed to edit message', err);
      }
      return;
    }

    // Optimistic update — show message immediately
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      content: messageToSend,
      sender: { id: user?.id, email: user?.email, name: user?.name, profilePhoto: user?.profilePhoto },
      receiver: { id: activeChat },
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const savedMsg = await chatService.sendMessage(activeChat, messageToSend);
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? savedMsg : m));
    } catch (err) {
      console.error('Failed to send message', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(messageToSend); // restore the message so user can retry
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const savedMsg = await chatService.deleteMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? savedMsg : m));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [findResults, setFindResults] = useState([]);
  const [findLoading, setFindLoading] = useState(false);

  // Search users globally by name or RentXY ID
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setFindResults([]); return; }
    const timer = setTimeout(async () => {
      setFindLoading(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setFindResults(res.data.filter(u => u.id !== user?.id)); // exclude self
      } catch { setFindResults([]); }
      finally { setFindLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const startChatWith = (foundUser) => {
    setConversations(prev => {
      if (prev.find(c => c.id === foundUser.id)) return prev;
      return [{ id: foundUser.id, name: foundUser.name, role: foundUser.role, profilePhoto: foundUser.profilePhoto, userCode: foundUser.userCode }, ...prev];
    });
    setActiveChat(foundUser.id);
    setShowMobileChat(true);
    setSearchQuery('');
  };

  // Filtered conversations based on search query
  const filteredConversations = conversations.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar - Contacts List */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col flex-shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search chats or find new users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Active Conversations matching search */}
          {filteredConversations.length > 0 && (
            <div className="mb-2">
              {searchQuery && <div className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Chats</div>}
              {filteredConversations.map((contact) => (
                <button 
                  key={contact.id}
                  onClick={() => { setActiveChat(contact.id); setShowMobileChat(true); }}
                  className={`w-full flex items-start p-4 border-b border-gray-50 transition-colors text-left ${activeChat === contact.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg mr-4 border-2 border-white shadow-sm flex-shrink-0">
                    {contact.profilePhoto ? <img src={contact.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (contact.name?.charAt(0)?.toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-semibold truncate ${activeChat === contact.id ? 'text-primary-900' : 'text-gray-900'}`}>
                        {maskName(contact.name)}
                      </h3>
                    </div>
                    <p className="text-xs text-primary-600 mb-1">{contact.role}</p>
                    {contact.userCode && <p className="text-xs text-gray-400 font-mono">{contact.userCode}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Global Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="pb-4">
              <div className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Other Users on RentXY</div>
              {findLoading ? (
                <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
              ) : (
                findResults.filter(u => !conversations.some(c => c.id === u.id)).length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No new users found</div>
                ) : (
                  findResults
                    .filter(u => !conversations.some(c => c.id === u.id)) // Exclude users already in conversations list
                    .map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {u.profilePhoto ? <img src={u.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (u.name?.charAt(0)?.toUpperCase() || 'U')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.role} · <span className="font-mono">{u.userCode}</span></p>
                        </div>
                        <button
                          onClick={() => startChatWith(u)}
                          className="text-xs font-semibold text-primary-700 bg-primary-100 hover:bg-primary-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                        >
                          Message
                        </button>
                      </div>
                    ))
                )
              )}
            </div>
          )}

          {!searchQuery && filteredConversations.length === 0 && !loading && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-primary-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Find anyone on RentXY</p>
              <p className="text-xs text-gray-400 mt-1">Search above by name or their 10-digit ID</p>
            </div>
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
                  {conversations.find(c => c.id === activeChat)?.profilePhoto ? <img src={conversations.find(c => c.id === activeChat).profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (conversations.find(c => c.id === activeChat)?.name?.charAt(0)?.toUpperCase() || 'U')}
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
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm font-semibold text-gray-700 w-full text-center md:w-auto md:text-left mb-2 md:mb-0 mr-auto">Contact {maskName(conversations.find(c => c.id === activeChat)?.name)} Directly:</span>
                
                {conversations.find(c => c.id === activeChat)?.phone && (
                  <>
                    <a href={`tel:${conversations.find(c => c.id === activeChat).phone}`} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
                      <Phone size={16} /> Call
                    </a>
                    <a href={`https://wa.me/${conversations.find(c => c.id === activeChat).phone.replace(/\\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> WhatsApp
                    </a>
                  </>
                )}
                
                {conversations.find(c => c.id === activeChat)?.email && (
                  <a href={`mailto:${conversations.find(c => c.id === activeChat).email}`} className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"></path><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg> Email
                  </a>
                )}
              </div>
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 mt-10">No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender.email === user?.email;
                    const timeString = new Date(msg.timestamp).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true});
                    
                    if (isMe) {
                      return (
                        <div key={msg.id || idx} className="flex items-end justify-end mb-2 group">
                          {/* Message Actions (Edit/Delete) */}
                          {!String(msg.id).startsWith('temp-') && !msg.isDeleted && (
                            <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1.5 text-gray-400 hover:text-primary-600 bg-white rounded-full shadow-sm" title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-full shadow-sm" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                          <div className={`px-5 py-3.5 rounded-2xl rounded-br-sm max-w-[75%] shadow-md transform transition-all ${msg.isDeleted ? 'bg-gray-200 text-gray-500 italic' : 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-primary-600/20 hover:-translate-y-0.5'}`}>
                            <p className="text-[15px] leading-relaxed break-words">{msg.isDeleted ? 'This message was deleted' : msg.content}</p>
                            <div className="flex items-center justify-end mt-1.5 gap-1">
                              {msg.isEdited && !msg.isDeleted && <span className="text-[10px] text-primary-200 italic mr-1">Edited</span>}
                              <span className={`text-[10px] font-medium ${msg.isDeleted ? 'text-gray-400' : 'text-primary-200'}`}>{timeString}</span>
                              {/* Ticks */}
                              {!msg.isDeleted && (
                                <span className={`ml-1 ${msg.isRead ? 'text-blue-300' : 'text-primary-200/70'}`}>
                                  {String(msg.id).startsWith('temp-') ? (
                                    <Check size={12} className="opacity-50" />
                                  ) : msg.isRead ? (
                                    <CheckCheck size={14} />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id || idx} className="flex items-end mb-2">
                          <div className="w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center font-bold text-xs mr-3 mb-1 shadow-sm border border-gray-200 flex-shrink-0">
                            {msg.sender?.profilePhoto ? <img src={msg.sender.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" /> : (msg.sender?.name?.charAt(0)?.toUpperCase() || 'U')}
                          </div>
                          <div className={`border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-sm max-w-[75%] shadow-md transform transition-all hover:-translate-y-0.5 ${msg.isDeleted ? 'bg-gray-50 text-gray-400 italic' : 'bg-white text-gray-800'}`}>
                            <p className="text-[15px] leading-relaxed break-words">{msg.isDeleted ? 'This message was deleted' : msg.content}</p>
                            <div className="flex items-center justify-end mt-1.5 gap-1">
                              {msg.isEdited && !msg.isDeleted && <span className="text-[10px] text-gray-400 italic mr-1">Edited</span>}
                              <span className="text-[10px] text-gray-400 font-medium">{timeString}</span>
                            </div>
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
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
              {editingMessage && (
                <div className="mb-2 px-4 py-2 bg-primary-50 rounded-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary-700 flex items-center gap-1"><Edit2 size={12}/> Editing message</span>
                    <span className="text-sm text-gray-600 truncate">{editingMessage.content}</span>
                  </div>
                  <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                    <X size={16} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
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
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
