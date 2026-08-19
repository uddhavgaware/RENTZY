import React from 'react';
import { Hammer, RefreshCw, Mail } from 'lucide-react';

const MaintenancePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 max-w-xl w-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 rounded-3xl shadow-2xl text-center flex flex-col items-center">
        {/* Logo/Icon Area */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
            <Hammer size={38} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
          RentXY Under Maintenance
        </h1>

        {/* Subtitle */}
        <p className="text-purple-400 font-semibold tracking-wider text-sm uppercase mb-6">
          Try another day
        </p>

        {/* Description */}
        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
          We are currently migrating our backend services to a new platform to ensure faster speeds and better reliability. Please come back later.
        </p>

        {/* Action Button */}
        <button
          onClick={handleRefresh}
          className="group w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Refresh Page</span>
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
        </button>

        {/* Footer info inside card */}
        <div className="mt-8 pt-8 border-t border-slate-700/50 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
          <Mail size={14} className="text-slate-500" />
          <span>Need help? Contact <a href="mailto:rentxysupport@gmail.com" className="text-purple-400 hover:text-purple-300 hover:underline">rentxysupport@gmail.com</a></span>
        </div>
      </div>

      {/* Decorative Brand footer */}
      <div className="mt-8 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} RentXY. All rights reserved.
      </div>
    </div>
  );
};

export default MaintenancePage;
