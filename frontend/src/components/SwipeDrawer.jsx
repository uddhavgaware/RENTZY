import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Split, X, ChevronRight, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SwipeDrawer = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Minimum swipe distance (in px) to trigger the drawer
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null; // otherwise previous touch might be used
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchEndX.current - touchStartX.current;
    const isLeftSwipe = distance < -minSwipeDistance;
    const isRightSwipe = distance > minSwipeDistance;

    // Allow swipe to open from anywhere if it's a clear right swipe
    if (isRightSwipe && !isOpen) {
      setIsOpen(true);
    }

    // Close on left swipe anywhere
    if (isLeftSwipe && isOpen) {
      setIsOpen(false);
    }
  };

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/post-property', icon: Building2, label: 'Post Property' },
    { path: '/roommates', icon: Users, label: 'Find Roommates' },
    { path: '/split-expenses', icon: Split, label: 'Split Expenses', requiresAuth: true },
  ];

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Edge Indicator (Subtle hint that swipe exists) */}
      {!isOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-gradient-to-r from-primary-500/20 to-transparent rounded-r-lg pointer-events-none md:hidden" />
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-600 flex justify-between items-center rounded-br-3xl">
          <h2 className="text-xl font-bold text-white">Quick Menu</h2>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              if (item.requiresAuth && !isAuthenticated) return null;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-100/50 dark:border-primary-800/50' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'}`}>
                      <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                    <span className="font-semibold text-[15px]">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className={isActive ? 'text-primary-500' : 'text-gray-400'} />
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">Did you know?</h3>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              You can swipe from the left edge of your screen anytime to access this menu!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeDrawer;
