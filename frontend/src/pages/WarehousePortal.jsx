import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Truck, Package, Activity, Navigation2 } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';
import FeaturedListings from '../components/FeaturedListings';
import PortalEnhancements from '../components/PortalEnhancements';

const WarehousePortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=warehouse');
  };

  const handleQuickFilter = (subType) => {
    navigate(`/listings?type=warehouse&subType=${subType}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <PremiumHero
        title="Industrial"
        highlightText="Logistics Hub"
        highlightColorClass="text-amber-400"
        buttonText="Find Storage"
        buttonColorClass="bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
        searchType="warehouse"
        subtitle="Secure, accessible, and large-scale warehouse spaces designed for modern supply chain and storage needs."
        videoSrc="https://videos.pexels.com/video-files/3129595/3129595-uhd_2560_1440_30fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1586528116311-ad8ed7c159ad?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '🚚', text: 'Heavy Vehicle Access' },
          { icon: '🏭', text: 'High Ceilings' },
          { icon: '⚡', text: 'High Power Load' }
        ]}
      />

      {/* Industrial Highlights Banner */}
      <section className="py-12 px-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
          {[
            { label: 'Cold Storage', icon: Activity },
            { label: 'Distribution Center', icon: Navigation2 },
            { label: 'Light Manufacturing', icon: Package },
            { label: 'Yard Space', icon: Truck }
          ].map(type => (
            <button 
              key={type.label}
              onClick={() => handleQuickFilter(type.label)}
              className="px-6 py-3 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 font-bold tracking-wide transition-colors flex items-center gap-2 border border-amber-100 dark:border-amber-800/50 shadow-sm"
            >
              <type.icon size={18} /> {type.label}
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Featured Listings */}
      <FeaturedListings 
        type="warehouse" 
        title="Top Facilities" 
        subtitle="Prime industrial real estate for your operational needs."
        badge="Verified Logistics"
      />

      <PortalEnhancements type="warehouse" />

      <section className="py-24 px-4 bg-gradient-to-b from-white to-amber-50/50 dark:from-slate-900 dark:to-amber-950/20 text-center border-t border-gray-100 dark:border-white/5">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-amber-500/20">
          <Warehouse size={40} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Expand your operations.</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Discover properties with excellent highway connectivity, heavy vehicle access, and secure environments.
        </p>
        <button onClick={handleBrowseAll} className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-5 text-lg rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20 flex items-center gap-3 mx-auto">
          <Package size={24} /> Browse Warehouses
        </button>
      </section>
    </div>
  );
};

export default WarehousePortal;
