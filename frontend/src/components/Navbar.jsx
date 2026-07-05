import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, X, User, LogOut, Home, MessageSquare, Heart, ShieldCheck, Bell, Users, Truck, Briefcase, Warehouse, Sun, Moon, Split, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import api, { isNativePlatform } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isCinematicPage = ['/', '/flats', '/pgs', '/offices', '/warehouses', '/roommates', '/movers'].includes(location.pathname);
  const isDarkHero = ['/', '/flats', '/pgs', '/offices', '/warehouses', '/roommates', '/movers'].includes(location.pathname);

  const getNavLinks = () => {
    const role = user?.role;
    if (role === 'OWNER') {
      return [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Flats', path: '/flats' },
        { name: 'Movers', path: '/movers' },
      ];
    } else if (role === 'MOVER') {
      return [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
      ];
    }
    return [
      { name: 'Home', path: '/' },
      { name: 'Flats', path: '/flats' },
      { name: 'PG/Hostels', path: '/pgs' },
      { name: 'Roommates', path: '/roommates' },
      { name: 'Split', path: '/split-expenses' },
      { name: 'Movers', path: '/movers' },
    ];
  };

  const navLinks = getNavLinks();

  const mobileSwipeLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Flats', path: '/flats', icon: Building2 },
    { name: 'PG/Hostels', path: '/pgs', icon: Warehouse },
    { name: 'Roommates', path: '/roommates', icon: Users },
    { name: 'Split', path: '/split-expenses', icon: Split },
    { name: 'Movers', path: '/movers', icon: Truck },
    { name: 'Offices', path: '/offices', icon: Briefcase },
    { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const latestNotifId = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotificationsAndCount = async () => {
      try {
        const [countRes, notifsRes] = await Promise.all([
          api.get('/notifications/unread-count'),
          api.get('/notifications')
        ]);
        
        const count = countRes.data.count || 0;
        setUnreadCount(count);
        
        const notifs = notifsRes.data;
        if (notifs.length > 0) {
          const newest = notifs[0];
          // If we have a new notification that we haven't seen yet in this session, toast it!
          if (latestNotifId.current && newest.id > latestNotifId.current && !newest.isRead) {
            import('react-hot-toast').then(({ toast }) => {
              toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">New Notification</p>
                        <p className="mt-1 text-sm text-gray-500">{newest.message}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
                    <button onClick={() => { import('react-hot-toast').then(({ toast }) => toast.dismiss(t.id)); if(newest.link) navigate(newest.link); }} className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none">View</button>
                  </div>
                </div>
              ));
            });
          }
          latestNotifId.current = newest.id;
        }
      } catch {}
    };

    fetchNotificationsAndCount(); // Immediate fetch on mount / route change
    const interval = setInterval(fetchNotificationsAndCount, 15000); // Poll every 15s (faster for real-time feel)
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname, navigate]);

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

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    setShowNotifs(false);
    if (notif.link) {
      navigate(notif.link);
    }
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
    setShowLogoutConfirm(false);
    setShowNotifs(false);
    setIsOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  const navScrolledStyle = isScrolled
    ? { backgroundColor: isDarkMode ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
    : {};

  const navClass = isCinematicPage
    ? cn("fixed top-0 z-[1000] w-full transition-all duration-300", isScrolled ? "shadow-sm border-b border-white/10 py-1" : "bg-transparent py-4")
    : cn("sticky top-0 z-[1000] w-full shadow-sm border-b", isDarkMode ? "border-white/5" : "border-gray-100");

  const textColorClass = isDarkHero && !isScrolled ? "text-white" : "text-gray-900";
  const linkColorClass = isDarkHero && !isScrolled ? "text-white/80 hover:text-white" : "text-gray-600 hover:text-primary-700 font-semibold";
  const logoBgClass = isDarkHero && !isScrolled ? "bg-white/20 backdrop-blur-sm" : "bg-gradient-to-br from-primary-500 to-primary-700";
  const logoIconColorClass = "text-white";

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
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
    <nav
      className={navClass}
      style={{
        ...(isCinematicPage ? navScrolledStyle : { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }),
        paddingTop: isNativePlatform() ? 'max(env(safe-area-inset-top), 24px)' : undefined
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors", logoBgClass)}>
                <Building2 size={24} className={logoIconColorClass} />
              </div>
              <span className={cn("font-bold text-2xl tracking-tight transition-colors", textColorClass)}>RentXY</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={cn("inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200", location.pathname === link.path ? cn("border-primary-500", textColorClass) : cn("border-transparent", linkColorClass))}>{link.name}</Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button onClick={toggleDarkMode} className={cn("p-2 rounded-full transition-colors hover:bg-gray-100/20", linkColorClass)} title="Toggle Dark Mode">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {!isNativePlatform() && (
              <a href="/rentxy.apk" download className={cn("text-sm font-bold transition-colors flex items-center gap-1 text-emerald-600 hover:text-emerald-700", isDarkHero && !isScrolled ? "text-emerald-400 hover:text-emerald-300" : "")}>
                <Download size={16} /> App
              </a>
            )}
            <Link to="/post-property" className={cn("text-sm font-medium transition-colors", linkColorClass)}>Post Property</Link>
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
                  <button onClick={toggleNotifs} className={cn("relative transition-colors", linkColorClass)}>
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
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`px-4 py-3 border-b border-gray-50 transition-colors ${n.link ? 'cursor-pointer hover:bg-gray-50' : ''} ${!n.isRead ? 'bg-primary-50/50' : ''}`}
                          >
                            <p className="text-sm text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/messages" className={cn("transition-colors", linkColorClass)}><MessageSquare size={20} /></Link>
                <Link to="/dashboard?tab=saved" className={cn("transition-colors", linkColorClass)}><Heart size={20} /></Link>
                <div className="flex items-center space-x-2">
                  <Link to="/dashboard" className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center overflow-hidden border border-primary-200" title={user?.name}>
                    {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" /> : <User size={18} />}
                  </Link>
                  <button onClick={handleLogout} className={cn("transition-colors hover:text-red-600", linkColorClass)} title="Log out"><LogOut size={20} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth" className={cn("px-4 py-2 text-sm font-medium transition-colors", isDarkHero && !isScrolled ? "text-white/80 hover:text-white" : "text-gray-700 hover:text-gray-900")}>Log in</Link>
                <Link to="/auth?mode=signup" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm shadow-primary-600/20 transition-all active:scale-95">Sign up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleDarkMode} className={cn("p-1.5 rounded-full transition-colors hover:bg-gray-100/20", linkColorClass)} title="Toggle Dark Mode">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {!isNativePlatform() && (
              <a href="/rentxy.apk" download className={cn("px-3 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shadow-sm", isDarkHero && !isScrolled ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm" : "bg-primary-600 text-white hover:bg-primary-700")} title="Download App">
                <Download size={14} /> Get App
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
