import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, CheckCircle2 } from 'lucide-react';
import CinematicHero from '../components/CinematicHero';

const OfficeSpacePortal = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ type: 'office' });
    if (location.trim()) params.set('location', location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CinematicHero
        videoSrc="https://cdn.pixabay.com/video/2020/06/18/42385-432247345_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
        title={
          <>
            Scale Your <span className="text-emerald-400">Startup</span>
          </>
        }
        subtitle="Premium office spaces and co-working environments designed for modern teams and growing businesses."
      >
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-3 glass-premium rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 gap-3 border border-white/10 focus-within:bg-white/20 transition-all">
            <MapPin size={22} className="text-emerald-300 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter tech park or city..."
              className="bg-transparent border-none outline-none w-full text-white placeholder-gray-300 font-medium text-lg"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <Search size={20} />
            Find Office
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Plug & Play Setup</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> High-Speed Internet</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Direct with Owners</div>
        </div>
      </CinematicHero>
      
      <section className="py-20 px-4 bg-white text-center">
        <Briefcase size={48} className="mx-auto text-emerald-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Elevate your work environment.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          From private cabins to full floor plates, find the right space for your team.
        </p>
        <button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-colors">
          Browse Workspaces
        </button>
      </section>
    </div>
  );
};

export default OfficeSpacePortal;
