import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = async (path) => {
    // Fire a light native haptic vibration for that "Zepto" premium feel
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Ignore if not running in native Capacitor (e.g. normal web browser)
    }
    navigate(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/listings', label: 'Search', icon: Search },
    { path: '/post-property', label: 'Post', icon: PlusCircle },
    { path: '/messages', label: 'Chat', icon: MessageCircle },
    { path: '/dashboard', label: 'Profile', icon: User },
  ];

  // Don't show bottom nav on authentication pages or message thread
  const hiddenRoutes = ['/auth', '/forgot-password', '/reset-password'];
  if (hiddenRoutes.includes(location.pathname) || (location.pathname === '/messages' && location.search.includes('user='))) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 z-[999] px-2 pb-safe pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-transform active:scale-95"
            >
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-primary-600 rounded-b-full animate-fadeIn" />
              )}
              <Icon 
                size={isActive ? 24 : 22} 
                className={`transition-colors duration-200 ${isActive ? 'text-primary-600 fill-primary-100' : 'text-gray-500'}`} 
              />
              <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
