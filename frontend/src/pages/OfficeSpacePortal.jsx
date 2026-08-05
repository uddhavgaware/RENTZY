import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Laptop, Users, Building, Coffee } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';
import FeaturedListings from '../components/FeaturedListings';
import PortalEnhancements from '../components/PortalEnhancements';

const OfficeSpacePortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=office');
  };

  const handleQuickFilter = (subType) => {
    navigate(`/listings?type=office&subType=${subType}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <PremiumHero
        title="Scale Your"
        highlightText="Startup"
        highlightColorClass="text-emerald-400"
        buttonText="Find Office"
        buttonColorClass="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
        searchType="office"
        subtitle="Premium office spaces and co-working environments designed for modern teams and growing businesses."
        videoSrc="https://videos.pexels.com/video-files/7534210/7534210-uhd_2560_1440_25fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '💻', text: 'Plug & Play Setup' },
          { icon: '🚀', text: 'High-Speed Internet' },
          { icon: '🤝', text: 'Direct with Owners' }
        ]}
      />

      {/* Workspace Types Banner */}
      <section className="py-12 px-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
          {[
            { label: 'Co-working', icon: Users },
            { label: 'Private Cabin', icon: Laptop },
            { label: 'Full Floor', icon: Building },
            { label: 'Virtual Office', icon: Coffee }
          ].map(type => (
            <button 
              key={type.label}
              onClick={() => handleQuickFilter(type.label)}
              className="px-6 py-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 font-bold tracking-wide transition-colors flex items-center gap-2 border border-emerald-100 dark:border-emerald-800/50 shadow-sm"
            >
              <type.icon size={18} /> {type.label}
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Featured Listings */}
      <FeaturedListings 
        type="office" 
        title="Premium Workspaces" 
        subtitle="Highly sought-after commercial properties for your business."
        badge="Top Commercial"
      />
      
      <PortalEnhancements type="office" />

      <section className="py-24 px-4 bg-gradient-to-b from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 text-center border-t border-gray-100 dark:border-white/5">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-500/20">
          <Briefcase size={40} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Elevate your work environment.</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          From private cabins to full floor plates, find the right space to inspire your team and impress your clients.
        </p>
        <button onClick={handleBrowseAll} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 text-lg rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto">
          <Building size={24} /> Browse Workspaces
        </button>
      </section>
    </div>
  );
};

export default OfficeSpacePortal;
