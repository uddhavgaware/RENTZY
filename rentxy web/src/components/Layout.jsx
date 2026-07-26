import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingSupportButton from './FloatingSupportButton';
import MobileBottomNav from './MobileBottomNav';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

const Layout = ({ children }) => {
  const location = useLocation();
  const hideFooterRoutes = ['/messages'];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow w-full relative pb-28 md:pb-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideFooterRoutes.includes(location.pathname) && <Footer />}
      <MobileBottomNav />
      <FloatingSupportButton />
    </div>
  );
};

export default Layout;
