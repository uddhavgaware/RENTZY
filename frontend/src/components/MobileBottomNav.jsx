import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Users, Truck, User, Search, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/flats', icon: Building2, label: 'Flats' },
    { path: '/pgs', icon: Search, label: 'PGs' },
    { path: '/roommates', icon: Users, label: 'Mates' },
    { path: isAuthenticated ? '/dashboard' : '/auth', icon: User, label: isAuthenticated ? 'Account' : 'Login' },
  ];

  // Hide on certain pages where bottom nav would interfere
  const hiddenPaths = ['/messages', '/auth'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/flats' && location.pathname === '/flats') ||
            (path === '/pgs' && location.pathname === '/pgs') ||
            (path === '/dashboard' && location.pathname.startsWith('/dashboard'));
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
