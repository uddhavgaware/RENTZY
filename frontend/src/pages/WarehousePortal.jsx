import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, PackageSearch, CheckCircle2 } from 'lucide-react';
import CinematicHero from '../components/CinematicHero';

const WarehousePortal = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ type: 'warehouse' });
    if (location.trim()) params.set('location', location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CinematicHero
        videoSrc="https://cdn.pixabay.com/video/2021/04/18/71485-538600109_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?auto=format&fit=crop&w=1920&q=80"
        title={
          <>
            Smart <span className="text-amber-400">Logistics</span>
          </>
        }
        subtitle="Secure, high-capacity warehouses and commercial storage solutions for seamless supply chain operations."
      >
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-3 glass-premium rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 gap-3 border border-white/10 focus-within:bg-white/20 transition-all">
            <MapPin size={22} className="text-amber-300 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter industrial area or city..."
              className="bg-transparent border-none outline-none w-full text-white placeholder-gray-300 font-medium text-lg"
            />
          </div>
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-white rounded-2xl px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30"
          >
            <Search size={20} />
            Find Warehouse
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400"/> Heavy Truck Access</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400"/> 24/7 Operations</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400"/> Fire Compliant</div>
        </div>
      </CinematicHero>
      
      <section className="py-20 px-4 bg-white text-center">
        <PackageSearch size={48} className="mx-auto text-amber-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Streamline your supply chain.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Find the perfect warehouse location to optimize your storage and distribution network.
        </p>
        <button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-colors">
          Browse Storage Spaces
        </button>
      </section>
    </div>
  );
};

export default WarehousePortal;
