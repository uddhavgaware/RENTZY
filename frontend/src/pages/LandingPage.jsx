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
      <section className="relative pt-20 pb-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white -z-10"></div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 animate-slide-up">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Perfect Stay</span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            Discover premium PGs, flats, hostels, or find the ideal roommate. Your next home is just a search away.
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-2 md:p-4 flex flex-col md:flex-row gap-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-primary-300 focus-within:ring focus-within:ring-primary-200 focus-within:ring-opacity-50 transition-all">
              <MapPin className="text-gray-400 mr-3" size={20} />
              <input 
                type="text"
                value={heroLocation}
                onChange={(e) => setHeroLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                placeholder="Where do you want to live?" 
                className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-primary-300 focus-within:ring focus-within:ring-primary-200 focus-within:ring-opacity-50 transition-all">
              <Home className="text-gray-400 mr-3" size={20} />
              <select 
                value={heroType}
                onChange={(e) => setHeroType(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-gray-700 cursor-pointer"
              >
                <option value="">All Property Types</option>
                <option value="pg">PG / Hostel</option>
                <option value="flat">Flat / Apartment</option>
              </select>
            </div>
            <button 
              onClick={handleHeroSearch}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-8 py-3 font-medium flex items-center justify-center shadow-lg shadow-primary-600/30 transition-all active:scale-95"
            >
              <Search className="mr-2" size={20} />
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Explore by Category</h2>
            <p className="mt-4 text-gray-600">Everything you need for a comfortable stay.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Category Card 1 */}
            <Link to="/listings?type=pg" className="group block h-80 rounded-3xl overflow-hidden relative shadow-lg animate-slide-up">
              <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/30 transition-colors z-10"></div>
              <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="PGs & Hostels" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-8 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">PGs & Hostels</h3>
                <p className="text-gray-200 flex items-center font-medium">Explore options <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></p>
              </div>
            </Link>
            
            {/* Category Card 2 */}
            <Link to="/listings?type=flat" className="group block h-80 rounded-3xl overflow-hidden relative shadow-lg animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/30 transition-colors z-10"></div>
              <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80" alt="Flats & Apartments" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-8 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Flats</h3>
                <p className="text-gray-200 flex items-center font-medium">Explore options <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></p>
              </div>
            </Link>

            {/* Category Card 3 */}
            <Link to="/roommates" className="group block h-80 rounded-3xl overflow-hidden relative shadow-lg animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/30 transition-colors z-10"></div>
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Find Roommates" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-8 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Find Roommates</h3>
                <p className="text-gray-200 flex items-center font-medium">Connect now <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></p>
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
            List your property on Rentzy and reach thousands of verified tenants looking for their next home.
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
