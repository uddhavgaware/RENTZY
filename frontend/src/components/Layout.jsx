import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingSupportButton from './FloatingSupportButton';
import MobileBottomNav from './MobileBottomNav';
import SwipeDrawer from './SwipeDrawer';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideFooterRoutes = ['/messages'];

  return (
    <SwipeDrawer>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow w-full relative pb-20 md:pb-0">
          {children}
        </main>
        {!hideFooterRoutes.includes(location.pathname) && <Footer />}
        <MobileBottomNav />
        <FloatingSupportButton />
      </div>
    </SwipeDrawer>
  );
};

export default Layout;
