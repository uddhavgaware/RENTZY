import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, Users, ArrowRight, Building2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [heroLocation, setHeroLocation] = useState('');
  const [heroType, setHeroType] = useState('');

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroLocation.trim()) params.set('location', heroLocation.trim());
    if (heroType) params.set('type', heroType);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 -z-10"></div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 w-full">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-premium text-sm font-medium text-primary-700 mb-8 animate-slide-up shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2 animate-pulse"></span>
            The New Way to Find Homes
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 animate-slide-up leading-tight" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Perfect Stay</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-600 mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Discover premium PGs, flats, hostels, or find the ideal roommate. Your next home is just a search away.
          </p>

          {/* Search Bar - Glassmorphism & Mobile First */}
          <div className="max-w-4xl mx-auto glass-premium rounded-3xl p-3 md:p-4 flex flex-col md:flex-row gap-3 animate-slide-up w-full" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="flex-1 flex items-center bg-white/80 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-white/50 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all shadow-sm">
              <MapPin className="text-primary-500 mr-3" size={22} />
              <input 
                type="text"
                value={heroLocation}
                onChange={(e) => setHeroLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                placeholder="Where do you want to live?" 
                className="bg-transparent border-none outline-none w-full text-gray-800 placeholder-gray-400 font-medium"
              />
            </div>
            <div className="flex-1 flex items-center bg-white/80 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-white/50 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all shadow-sm">
              <Home className="text-primary-500 mr-3" size={22} />
              <select 
                value={heroType}
                onChange={(e) => setHeroType(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-gray-800 cursor-pointer font-medium appearance-none"
              >
                <option value="">All Property Types</option>
                <option value="pg">PG / Hostel</option>
                <option value="flat">Flat / Apartment</option>
              </select>
            </div>
            <button 
              onClick={handleHeroSearch}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-2xl px-8 py-4 font-bold flex items-center justify-center shadow-lg shadow-primary-600/30 transition-all active:scale-95 md:w-auto w-full text-lg"
            >
              <Search className="mr-2" size={20} />
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Explore by Category</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Everything you need for a comfortable stay, tailored to your lifestyle.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Category Card 1 */}
            <Link to="/listings?type=pg" className="group block h-[350px] rounded-[2rem] overflow-hidden relative shadow-lg animate-slide-up transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="PGs & Hostels" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <div className="glass-premium inline-block px-3 py-1 rounded-full mb-3 border-white/20">
                  <span className="text-white text-xs font-bold tracking-wider uppercase">Co-living</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 transform transition-transform duration-300 group-hover:translate-x-2">PGs & Hostels</h3>
                <p className="text-gray-300 flex items-center font-medium transform transition-transform duration-300 delay-75 group-hover:translate-x-2">
                  Explore options <ArrowRight size={18} className="ml-2 text-primary-400 group-hover:translate-x-2 transition-transform duration-300" />
                </p>
              </div>
            </Link>
            
            {/* Category Card 2 */}
            <Link to="/listings?type=flat" className="group block h-[350px] rounded-[2rem] overflow-hidden relative shadow-lg animate-slide-up transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80" alt="Flats & Apartments" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <div className="glass-premium inline-block px-3 py-1 rounded-full mb-3 border-white/20">
                  <span className="text-white text-xs font-bold tracking-wider uppercase">Independent</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 transform transition-transform duration-300 group-hover:translate-x-2">Flats</h3>
                <p className="text-gray-300 flex items-center font-medium transform transition-transform duration-300 delay-75 group-hover:translate-x-2">
                  Explore options <ArrowRight size={18} className="ml-2 text-primary-400 group-hover:translate-x-2 transition-transform duration-300" />
                </p>
              </div>
            </Link>

            {/* Category Card 3 */}
            <Link to="/roommates" className="group block h-[350px] rounded-[2rem] overflow-hidden relative shadow-lg animate-slide-up transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Find Roommates" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <div className="glass-premium inline-block px-3 py-1 rounded-full mb-3 border-white/20">
                  <span className="text-white text-xs font-bold tracking-wider uppercase">Community</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 transform transition-transform duration-300 group-hover:translate-x-2">Find Roommates</h3>
                <p className="text-gray-300 flex items-center font-medium transform transition-transform duration-300 delay-75 group-hover:translate-x-2">
                  Connect now <ArrowRight size={18} className="ml-2 text-primary-400 group-hover:translate-x-2 transition-transform duration-300" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-primary-900 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Are you a Property Owner?</h2>
          <p className="text-primary-100 text-lg mb-10">
            List your property on RentXY and reach thousands of verified tenants looking for their next home.
          </p>
          <Link to="/post-property" className="inline-flex items-center bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 shadow-xl shadow-primary-900/50 transition-all active:scale-95">
            <Building2 className="mr-2" size={24} />
            Post Property for Free
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
