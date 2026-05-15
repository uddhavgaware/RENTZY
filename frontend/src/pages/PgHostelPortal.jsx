import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, CheckCircle2 } from 'lucide-react';
import CinematicHero from '../components/CinematicHero';

const PgHostelPortal = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ type: 'pg' });
    if (location.trim()) params.set('location', location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CinematicHero
        videoSrc="https://cdn.pixabay.com/video/2019/03/20/22137-325251662_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80"
        title={
          <>
            Your Campus <span className="text-purple-400">Home</span>
          </>
        }
        subtitle="Discover student-friendly PGs and Hostels near your college. Safe, vibrant, and packed with amenities."
      >
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-3 glass-premium rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 gap-3 border border-white/10 focus-within:bg-white/20 transition-all">
            <MapPin size={22} className="text-purple-300 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter college name or locality..."
              className="bg-transparent border-none outline-none w-full text-white placeholder-gray-300 font-medium text-lg"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30"
          >
            <Search size={20} />
            Find PG
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-400"/> WiFi & Meals Included</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-400"/> CCTV Security</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-400"/> No Brokerage</div>
        </div>
      </CinematicHero>
      
      <section className="py-20 px-4 bg-white text-center">
        <Users size={48} className="mx-auto text-purple-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Start your student journey right.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Find the perfect PG to study, relax, and make lifelong friends.
        </p>
        <button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-colors">
          Browse PGs & Hostels
        </button>
      </section>
    </div>
  );
};

export default PgHostelPortal;
