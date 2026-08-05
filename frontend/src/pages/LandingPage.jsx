import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Home, Users, ArrowRight, Building2, Shield,
  Star, CheckCircle2, Zap, Truck, MessageSquare, BadgeCheck, ChevronRight,
  Smartphone, Download, WifiOff, Bell
} from 'lucide-react';
import PremiumHero from '../components/PremiumHero';
import api from '../services/api';
import { motion } from 'framer-motion';

const STATS = [
  { value: '2,500+', label: 'Properties Listed' },
  { value: '10,000+', label: 'Happy Tenants' },
  { value: '25+', label: 'Cities Covered' },
  { value: '₹0', label: 'Brokerage Fee' },
];

const CATEGORIES = [
  {
    to: '/split-expenses',
    label: 'Split Expenses',
    tag: 'Finance',
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    color: 'from-emerald-600/80 to-teal-900/90',
    emoji: '💸',
  },
  {
    to: '/pgs',
    label: 'PGs & Hostels',
    tag: 'Budget-Friendly',
    img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    color: 'from-violet-600/80 to-purple-900/90',
    emoji: '🏨',
  },
  {
    to: '/flats',
    label: 'Flats & Apartments',
    tag: 'Independent',
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    color: 'from-blue-600/80 to-indigo-900/90',
    emoji: '🏢',
  },
  {
    to: '/roommates',
    label: 'Find Roommates',
    tag: 'Community',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    color: 'from-rose-500/80 to-pink-900/90',
    emoji: '🤝',
  },
  {
    to: '/movers',
    label: 'Packing & Moving',
    tag: 'Relocation',
    img: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=800&q=80',
    color: 'from-orange-500/80 to-amber-900/90',
    emoji: '🚚',
  },
  {
    to: '/offices',
    label: 'Office Spaces',
    tag: 'Commercial',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    color: 'from-teal-600/80 to-emerald-900/90',
    emoji: '💼',
  },
  {
    to: '/warehouses',
    label: 'Warehouses',
    tag: 'Storage',
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    color: 'from-yellow-600/80 to-orange-900/90',
    emoji: '🏭',
  },
];

const HOW_IT_WORKS = [
  { step: '01', icon: Search, title: 'Search Your Area', desc: 'Filter by locality, price, amenities and property type — all in one place.' },
  { step: '02', icon: BadgeCheck, title: 'Verified Listings', desc: 'Every owner is KYC verified. What you see is what you get — zero fake listings.' },
  { step: '03', icon: MessageSquare, title: 'Chat Directly', desc: 'Message owners or tenants directly without any broker in between.' },
  { step: '04', icon: Home, title: 'Move In!', desc: 'Book your visit, confirm the deal, and move into your new home.' },
];

const FEATURES = [
  { icon: Shield, title: 'Zero Brokerage', desc: 'Direct owner-tenant connections. Keep your money for what matters.' },
  { icon: Zap, title: 'Instant Listings', desc: 'New properties go live in minutes. Never miss a good deal.' },
  { icon: BadgeCheck, title: 'KYC Verified', desc: 'All owners verified with govt. ID. Stay safe, stay smart.' },
  { icon: Truck, title: 'Moving Help', desc: 'Book professional packers & movers right from the platform.' },
  { icon: Users, title: 'Roommate Match', desc: 'Find compatible roommates filtered by gender, diet, lifestyle and more.' },
  { icon: Star, title: 'Rated & Reviewed', desc: 'Real reviews from real tenants. Make informed decisions every time.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [heroLocation, setHeroLocation] = useState('');
  const [heroType, setHeroType] = useState('');
  
  const placeholders = [
    "Enter city, locality or landmark...",
    "Try 'PG near COEP'",
    "Try 'Flats under ₹15,000'",
    "Try 'Women PG with Food'",
    "Try 'Furnished Flats in Hinjewadi'"
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [nearbyListings, setNearbyListings] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [realStats, setRealStats] = useState({
    properties: 0,
    cities: 0,
    users: 0
  });

  useEffect(() => {
    const fetchRealPlatformStats = async () => {
      try {
        const res = await api.get('/listings/stats');
        setRealStats(res.data || { properties: 2500, cities: 25, users: 10000 });
      } catch {}
    };
    fetchRealPlatformStats();
  }, []);

  const fetchNearbyListings = async (city) => {
    setNearbyLoading(true);
    try {
      const res = await api.get('/listings', { params: { location: city, size: 6 } });
      setNearbyListings(res.data?.content || []);
    } catch {} finally {
      setNearbyLoading(false);
    }
  };

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroLocation.trim()) params.set('location', heroLocation.trim());
    if (heroType) params.set('type', heroType);
    navigate(`/listings?${params.toString()}`);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const d = await r.json();
          const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
          const state = d.address?.state || '';
          setUserLocation({ city, state });
          setLocationStatus('granted');
          setHeroLocation(city);
          sessionStorage.setItem('rentxy_city', city);
          sessionStorage.setItem('rentxy_state', state);
          fetchNearbyListings(city);
        } catch { setLocationStatus('denied'); }
      },
      () => setLocationStatus('denied'),
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    const city = sessionStorage.getItem('rentxy_city');
    const state = sessionStorage.getItem('rentxy_state');
    if (city) {
      setUserLocation({ city, state });
      setLocationStatus('granted');
      setHeroLocation(city);
      fetchNearbyListings(city);
    } else {
      const t = setTimeout(() => setLocationStatus('asking'), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-gray-50 dark:bg-slate-900 relative">
      
      {/* Dynamic Animated Floating background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* HERO SECTION */}
      <PremiumHero
        title="Find Your"
        highlightText="Perfect Stay"
        highlightColorClass="text-indigo-400"
        subtitle="PGs · Flats · Hostels · Roommates — No brokers, no hidden fees. Just verified listings and direct connections."
        videoSrc="https://videos.pexels.com/video-files/3773486/3773486-uhd_2560_1440_30fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80"
      >
        {/* Search box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto backdrop-blur-xl bg-white/20 dark:bg-black/20 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex flex-col sm:flex-row gap-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-white/10"
        >
          {/* Location input */}
          <div className="flex-1 flex items-center bg-white/95 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl px-4 py-3 gap-3 border border-white/50 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
            <MapPin size={20} className="text-indigo-500 flex-shrink-0" />
            <input
              type="text"
              value={heroLocation}
              onChange={(e) => setHeroLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
              placeholder={placeholders[placeholderIndex]}
              className="bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-semibold text-base transition-all duration-500"
            />
          </div>

          {/* Property type */}
          <div className="flex items-center bg-white/95 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl px-4 py-3 gap-3 border border-white/50 dark:border-gray-700 sm:w-48 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
            <Home size={20} className="text-indigo-500 flex-shrink-0" />
            <select
              value={heroType}
              onChange={(e) => setHeroType(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-gray-900 dark:text-white font-semibold cursor-pointer text-base appearance-none [&>option]:text-gray-900"
            >
              <option value="">All Types</option>
              <option value="pg">PG / Hostel</option>
              <option value="flat">Flat / Apartment</option>
            </select>
          </div>

          {/* Search button */}
          <button
            onClick={handleHeroSearch}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl px-8 py-3.5 font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Search size={20} />
            Search
          </button>
        </motion.div>

        {/* Quick pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[
            { to: '/listings', label: '🏠 Browse All' },
            { to: '/pgs', label: '🏨 PGs & Hostels' },
            { to: '/flats', label: '🏢 Flats' },
            { to: '/roommates', label: '🤝 Roommates' },
            { to: '/split-expenses', label: '💸 Split Expenses' },
            { to: '/movers', label: '🚚 Movers' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-semibold shadow-sm transition-all active:scale-95">{label}</Link>
          ))}
        </div>

        {/* Location Permission Banner */}
        <div className="h-24 w-full flex items-start justify-center mt-5">
          {locationStatus === 'asking' && (
            <div className="mx-auto max-w-xl animate-slide-up w-full" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(99,102,241,0.35)', padding: '0.875rem 1.25rem' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-sm">Get AI-Powered Recommendations</p>
                  <p className="text-white/60 text-xs mt-0.5">Allow location to find spaces closest to you</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={requestLocation} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95">Allow</button>
                  <button onClick={() => setLocationStatus('denied')} className="text-white/50 hover:text-white text-xs px-2 py-1.5 rounded-lg transition-all">Skip</button>
                </div>
              </div>
            </div>
          )}
          {locationStatus === 'loading' && (
            <div className="mx-auto max-w-xl flex items-center justify-center gap-2 text-white/70 text-sm animate-pulse pt-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Detecting your location...
            </div>
          )}
          {locationStatus === 'granted' && userLocation?.city && (
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-semibold animate-fade-in pt-2">
              <span>📍</span> Showing results near <span className="text-white">{userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}</span>
              <button onClick={() => { setLocationStatus('idle'); setUserLocation(null); sessionStorage.removeItem('rentxy_city'); setNearbyListings([]); setHeroLocation(''); }} className="ml-1 text-white/40 hover:text-white/70 text-xs transition-colors">(change)</button>
            </div>
          )}
        </div>
      </PremiumHero>

      {/* STATS BAR */}
      <section className="bg-indigo-600 py-6 relative z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-indigo-500/50">
            {[
              { value: `${realStats.properties}+`, label: 'Properties Listed' },
              { value: `${realStats.users}+`, label: 'Happy Tenants' },
              { value: `${realStats.cities}`, label: 'Cities Covered' },
              { value: '₹0', label: 'Brokerage Fee' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-4">
                <div className="text-3xl sm:text-4xl font-black text-white">{value}</div>
                <div className="text-indigo-200 text-xs sm:text-sm font-bold mt-1 tracking-wider uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI RECOMMENDATIONS */}
      {(locationStatus === 'granted' && userLocation?.city) && (
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-20 bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-900 border-b border-indigo-900/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  ✨ AI Picks
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Best Stays Near <span className="text-indigo-400">{userLocation.city}</span>
                </h2>
              </div>
              <Link to={`/listings?location=${encodeURIComponent(userLocation.city)}`} className="hidden sm:flex items-center gap-1.5 text-indigo-400 hover:text-indigo-350 font-bold transition-all">
                View all <ArrowRight size={16} />
              </Link>
            </div>

            {nearbyLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl skeleton animate-pulse bg-slate-800" />
                ))}
              </div>
            ) : nearbyListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No listings found near {userLocation.city} yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyListings.slice(0, 6).map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listings/${listing.id}`}
                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                  >
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-indigo-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                      📍 Near You
                    </div>
                    <img
                      src={listing.imageUrl || (listing.images && listing.images[0]) || fallbackImage}
                      alt=""
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="p-5">
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-1 mb-1">{listing.title}</h3>
                      <p className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={12} /> {listing.location}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-indigo-400 font-black text-lg">₹{listing.price?.toLocaleString()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/15 text-gray-300">{listing.type}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* CATEGORIES SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 bg-white dark:bg-slate-950 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">✦ Explore</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mt-4 tracking-tight leading-tight">Everything You Need, In One Place</h2>
            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-xl mx-auto">Discover housing options and lifestyle portals tailored just for you.</p>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-4 md:grid md:grid-cols-3 lg:grid-cols-6 pb-4">
            {CATEGORIES.map(({ to, label, tag, img, color, emoji }, i) => (
              <motion.div 
                key={to}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="snap-start flex-shrink-0 w-48 md:w-auto block relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl hover:shadow-2xl border border-gray-100 dark:border-white/5"
              >
                <Link to={to} className="w-full h-full block">
                  <img src={img} alt={label} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <span className="text-3xl mb-2">{emoji}</span>
                    <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-2 w-fit">{tag}</span>
                    <h3 className="text-lg font-black text-white leading-tight">{label}</h3>
                    <p className="text-white/70 text-xs mt-1.5 flex items-center gap-1">Explore <ChevronRight size={14} /></p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* PWA INSTALL BANNER */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 sm:py-24 bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-900 border-y border-indigo-500/20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-400/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-4"><Smartphone size={14} /> Official PWA Available</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">Install RentXY to Your Home Screen</h2>
              <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">Experience 0.1s page load times, offline quote requests, and instant push notifications without downloading from App Stores.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {['0.1s Instant Load', 'Offline Quotes', 'Push Alerts', 'Only 2MB Size'].map((text, i) => (
                  <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-bold text-center text-gray-200">{text}</div>
                ))}
              </div>
            </div>
            <button onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))} className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95">📱 Install Now</button>
          </div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 bg-gray-50 dark:bg-slate-900"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">✦ Process</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mt-4 tracking-tight leading-tight">How It Works</h2>
            <p className="mt-4 text-gray-500 text-base sm:text-lg">Search to move-in in 4 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute top-4 right-5 text-6xl font-black text-gray-50 dark:text-white/5 leading-none pointer-events-none select-none">{step}</div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"><Icon size={20} /></div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* WHY RentXY (FEATURES) */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 bg-white dark:bg-slate-950"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">✦ Why Us</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mt-4 tracking-tight leading-tight">Why Choose RentXY?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all duration-300 group shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"><Icon size={20} /></div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* TRUST & SAFETY SYSTEM */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 border-y border-white/5 text-white relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">✦ Trust & Safety</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">100% Genuine Peer-to-Peer Rental Network</h2>
            <p className="mt-4 text-gray-400 text-base sm:text-lg max-w-xl mx-auto">Clean, transparent, and direct housing portal.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Govt. ID KYC Verification', desc: 'Every landlord, roommate, and tenant profile must undergo verification prior to scheduling tours.', color: 'from-emerald-500/20 to-emerald-500/10' },
              { title: 'Zero Brokerage Guarantee', desc: 'We implement automated keyword filters to permanently block and flag intermediary broker postings.', color: 'from-indigo-500/20 to-indigo-500/10' },
              { title: 'Real-Time Messaging', desc: 'Connect directly with property owners and potential roommates via secure chat channels.', color: 'from-pink-500/20 to-pink-500/10' }
            ].map(({ title, desc, color }) => (
              <div key={title} className={`bg-gradient-to-br ${color} border border-white/10 rounded-3xl p-8 hover:scale-[1.01] transition-transform shadow-lg`}>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* OWNER CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 bg-white dark:bg-slate-950"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 sm:p-16 text-center shadow-2xl">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 border border-white/25 rounded-full text-white/90 text-xs font-bold uppercase tracking-widest mb-6">🏠 For Property Owners</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 tracking-tight">List Your Property for Free</h2>
              <p className="text-indigo-100 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">Reach thousands of verified tenants across India. No commission, no broker, no nonsense.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/post-property" className="px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-xl hover:bg-gray-50 transition-all active:scale-95">Post Property — It's Free</Link>
                <Link to="/about" className="px-8 py-4 bg-white/15 text-white font-bold rounded-2xl border border-white/30 hover:bg-white/25 transition-all">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
};

export default LandingPage;
