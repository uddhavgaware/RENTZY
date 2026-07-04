import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, User, Search, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isOwner, user } = useAuth();

  const handleNav = async (e, path) => {
    e.preventDefault();
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {}
    navigate(path);
  };

  const getNavItems = () => {
    const role = user?.role;
    if (role === 'OWNER') {
      return [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/dashboard?tab=properties', icon: Building2, label: 'My Props' },
        { path: '/post-property', icon: Building2, label: 'Post' },
        { path: '/listings', icon: Search, label: 'All Props' },
      ];
    } else if (role === 'MOVER') {
      return [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/mover-dashboard', icon: Building2, label: 'Vendor' },
        { path: '/dashboard?tab=moving', icon: Users, label: 'Requests' },
        { path: isAuthenticated ? '/dashboard' : '/auth', icon: User, label: isAuthenticated ? 'Account' : 'Login' },
      ];
    }
    // TENANT or Unauthenticated
    return [
      { path: '/', icon: Home, label: 'Home' },
      { path: '/listings', icon: Search, label: 'Search' },
      { path: '/split-expenses', icon: PieChart, label: 'Split' },
      { path: '/roommates', icon: Users, label: 'Mates' },
      { path: isAuthenticated ? '/dashboard' : '/auth', icon: User, label: isAuthenticated ? 'Account' : 'Login' },
    ];
  };

  const navItems = getNavItems();

  // Hide on certain pages where bottom nav would interfere
  const hiddenPaths = ['/messages'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const fullPath = location.pathname + location.search;
          const isActive = fullPath === path || 
            (path === '/listings' && location.pathname.startsWith('/listings')) ||
            (path === '/split-expenses' && location.pathname === '/split-expenses') ||
            (path === '/post-property' && location.pathname === '/post-property') ||
            (path === '/dashboard' && location.pathname === '/dashboard' && !location.search.includes('tab='));
          
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleNav(e, path)}
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
