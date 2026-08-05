import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Home, Search, Star } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';
import FeaturedListings from '../components/FeaturedListings';
import PortalEnhancements from '../components/PortalEnhancements';

const FlatRentalPortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=flat');
  };

  const handleQuickFilter = (bhk) => {
    navigate(`/listings?type=flat&bhk=${bhk}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <PremiumHero
        title="Find Your"
        highlightText="Perfect Flat"
        highlightColorClass="text-blue-400"
        buttonText="Explore"
        buttonColorClass="bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
        searchType="flat"
        subtitle="Experience luxury urban living. Browse premium apartments and modern flats with zero brokerage."
        videoSrc="https://videos.pexels.com/video-files/5137779/5137779-uhd_2560_1440_25fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '🏢', text: 'Zero Brokerage' },
          { icon: '✅', text: 'Verified Owners' },
          { icon: '✨', text: 'Premium Amenities' }
        ]}
      />
      
      {/* Popular Configurations Banner */}
      <section className="py-12 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
          {['1 BHK', '2 BHK', '3 BHK', 'Villa'].map(config => (
            <button 
              key={config}
              onClick={() => handleQuickFilter(config)}
              className="px-6 py-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 font-bold tracking-wide transition-colors flex items-center gap-2 border border-blue-100 dark:border-blue-800/50 shadow-sm"
            >
              <Home size={18} /> {config}
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Featured Listings */}
      <FeaturedListings 
        type="flat" 
        title="Trending Flats" 
        subtitle="Highly rated apartments curated just for you."
        badge="Hot Properties"
      />

      <PortalEnhancements type="flat" />

      {/* Short teaser section below the fold */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 text-center border-t border-gray-100 dark:border-white/5">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-500/20">
          <Building2 size={40} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Ready to move in?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Browse thousands of verified apartments, luxury penthouses, and cozy studios. Connect directly with owners.
        </p>
        <button onClick={handleBrowseAll} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 text-lg rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 flex items-center gap-3 mx-auto">
          <Search size={24} /> Browse All Flats
        </button>
      </section>
    </div>
  );
};

export default FlatRentalPortal;
