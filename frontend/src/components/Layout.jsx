import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideFooterRoutes = ['/messages'];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow w-full relative">
        {children}
      </main>
      {!hideFooterRoutes.includes(location.pathname) && <Footer />}
    </div>
  );
};

export default Layout;
