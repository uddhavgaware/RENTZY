import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';

const FlatRentalPortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=flat');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      
      {/* Short teaser section below the fold */}
      <section className="py-20 px-4 bg-white text-center">
        <Building2 size={48} className="mx-auto text-blue-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Ready to move in?</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Browse thousands of verified apartments and connect directly with owners.
        </p>
        <button onClick={handleBrowseAll} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
          Browse All Flats
        </button>
      </section>
    </div>
  );
};

export default FlatRentalPortal;
