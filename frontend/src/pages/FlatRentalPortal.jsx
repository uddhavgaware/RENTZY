import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import CinematicHero from '../components/CinematicHero';

const FlatRentalPortal = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ type: 'flat' });
    if (location.trim()) params.set('location', location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CinematicHero
        videoSrc="https://cdn.pixabay.com/video/2020/02/17/32574-393285744_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80"
        title={
          <>
            Find Your <span className="text-blue-400">Perfect Flat</span>
          </>
        }
        subtitle="Experience luxury urban living. Browse premium apartments and modern flats with zero brokerage."
      >
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-3 glass-premium rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 gap-3 border border-white/10 focus-within:bg-white/20 transition-all">
            <MapPin size={22} className="text-blue-300 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city or locality..."
              className="bg-transparent border-none outline-none w-full text-white placeholder-gray-300 font-medium text-lg"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
          >
            <Search size={20} />
            Explore
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400"/> Zero Brokerage</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400"/> Verified Owners</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400"/> Premium Amenities</div>
        </div>
      </CinematicHero>
      
      {/* Short teaser section below the fold */}
      <section className="py-20 px-4 bg-white text-center">
        <Building2 size={48} className="mx-auto text-blue-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Ready to move in?</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Browse thousands of verified apartments and connect directly with owners.
        </p>
        <button onClick={handleSearch} className="btn-primary px-8 py-4 text-lg rounded-full">
          Browse All Flats
        </button>
      </section>
    </div>
  );
};

export default FlatRentalPortal;
