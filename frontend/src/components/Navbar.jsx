import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X, User, LogOut, Home, MessageSquare, Heart, ShieldCheck, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Listings', path: '/listings' },
    { name: 'Roommates', path: '/roommates' },
    { name: 'Movers', path: '/movers' },
  ];

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || 0);
      } catch {}
    };

    fetchCount(); // Immediate fetch on mount / route change
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleNotifs = async () => {
    if (!showNotifs) {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.slice(0, 10));
      } catch {}
    }
    setShowNotifs(!showNotifs);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button 
                onClick={confirmLogout} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Yes
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-primary-600/20"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <Building2 size={24} />
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">RentXY</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={cn("inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200", location.pathname === link.path ? "border-primary-500 text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700")}>{link.name}</Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/post-property" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Post Property</Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition-colors">
                    <ShieldCheck size={14} />Admin
                  </Link>
                )}
                {user?.role === 'MOVER' && (
                  <Link to="/mover-dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                    Vendor Portal
                  </Link>
                )}
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button onClick={toggleNotifs} className="relative text-gray-500 hover:text-primary-600 transition-colors">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline font-medium">Mark all read</button>}

                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">No notifications yet</div>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50/50' : ''}`}>
                            <p className="text-sm text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/messages" className="text-gray-500 hover:text-primary-600"><MessageSquare size={20} /></Link>
                <Link to="/dashboard?tab=saved" className="text-gray-500 hover:text-primary-600"><Heart size={20} /></Link>
                <div className="flex items-center space-x-2">
                  <Link to="/dashboard" className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center overflow-hidden border border-primary-200" title={user?.name}><User size={18} /></Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors" title="Log out"><LogOut size={20} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Log in</Link>
                <Link to="/auth?mode=signup" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm shadow-primary-600/20 transition-all active:scale-95">Sign up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 w-full border-t border-gray-100 bg-white/95 backdrop-blur-xl shadow-2xl z-[100]">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className={cn("block pl-3 pr-4 py-2 border-l-4 text-base font-medium", location.pathname === link.path ? "border-primary-500 text-primary-700 bg-primary-50" : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700")} onClick={() => setIsOpen(false)}>{link.name}</Link>
            ))}
            <Link to="/post-property" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50" onClick={() => setIsOpen(false)}>Post Property</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link to="/dashboard" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Dashboard</Link>
                <Link to="/messages" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Messages</Link>
                {isAdmin && <Link to="/admin" className="block px-4 py-2 text-base font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>}
                {user?.role === 'MOVER' && <Link to="/mover-dashboard" className="block px-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Vendor Portal</Link>}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:text-red-700 hover:bg-red-50">Sign out</button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-4">
                <Link to="/auth" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => setIsOpen(false)}>Log in</Link>
                <Link to="/auth?mode=signup" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700" onClick={() => setIsOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;
