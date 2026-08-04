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
    <div className={`flex flex-col font-sans ${hideFooterRoutes.includes(location.pathname) ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className={`flex flex-col flex-1 w-full relative ${hideFooterRoutes.includes(location.pathname) ? 'pb-0 overflow-hidden h-0' : 'pb-28 md:pb-0'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full h-full flex flex-col flex-1"
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
