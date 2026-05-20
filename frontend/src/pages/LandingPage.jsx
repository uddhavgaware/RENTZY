import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Home, Users, ArrowRight, Building2, Shield,
  Star, CheckCircle2, Zap, Truck, MessageSquare, BadgeCheck, ChevronRight
} from 'lucide-react';
import PremiumHero from '../components/PremiumHero';

const STATS = [
  { value: '2,500+', label: 'Properties Listed' },
  { value: '10,000+', label: 'Happy Tenants' },
  { value: '25+', label: 'Cities Covered' },
  { value: '₹0', label: 'Brokerage Fee' },
];

const CATEGORIES = [
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
    img: 'https://images.unsplash.com/photo-1587293852726-59cb2f794fee?auto=format&fit=crop&w=800&q=80',
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

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer, Pune',
    text: 'Found my perfect PG in Koregaon Park within 2 days. No broker fees, no hidden charges. RentXY is simply the best!',
    avatar: '👩‍💻',
    rating: 5,
  },
  {
    name: 'Rohit Desai',
    role: 'MBA Student, Mumbai',
    text: 'The roommate finder is a game changer. Met my roommate through RentXY and we get along great. Saved ₹8,000/month on rent!',
    avatar: '👨‍🎓',
    rating: 5,
  },
  {
    name: 'Ananya Kulkarni',
    role: 'Property Owner, Bangalore',
    text: 'Listed my flat and got 12 enquiries in 3 days. The platform is clean, fast and the tenants are genuine. Highly recommend!',
    avatar: '👩‍💼',
    rating: 5,
  },
];

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
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <PremiumHero
        title="Find Your"
        highlightText="Perfect Stay"
        highlightColorClass="text-indigo-400"
        subtitle="PGs · Flats · Hostels · Roommates — No brokers, no hidden fees. Just verified listings and direct connections."
        videoSrc="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80"
      >
        {/* Search box */}
        <div className="max-w-3xl mx-auto glass-premium rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex flex-col sm:flex-row gap-2.5 shadow-xl border border-white/60 dark:border-white/10">
          {/* Location input */}
          <div className="flex-1 flex items-center bg-white/95 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl px-4 py-3 gap-3 border border-white/50 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
            <MapPin size={20} className="text-indigo-500 flex-shrink-0" />
            <input
              type="text"
              value={heroLocation}
              onChange={(e) => setHeroLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
              placeholder="Enter city, locality or landmark…"
              className="bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-semibold text-base"
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
        </div>

        {/* Quick pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[
            { to: '/listings', label: '🏠 Browse All', },
            { to: '/pgs', label: '🏨 PGs & Hostels' },
            { to: '/flats', label: '🏢 Flats' },
            { to: '/roommates', label: '🤝 Roommates' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              {label}
            </Link>
          ))}
        </div>
      </PremiumHero>

      {/* ═══════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════ */}
      <section className="bg-primary-600 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-primary-500">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center px-4 py-1">
                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                <div className="text-primary-200 text-xs sm:text-sm font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="section-badge mb-4">✦ Explore</div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Everything You Need,<br className="hidden sm:block" /> In One Place
            </h2>
            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              From student PGs to luxury flats — find exactly what fits your lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.map(({ to, label, tag, img, color, emoji }, i) => (
              <Link
                key={to}
                to={to}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[3/4] shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
              >
                <img
                  src={img}
                  alt={label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />

                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
                  <span className="text-2xl sm:text-3xl mb-2">{emoji}</span>
                  <div className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest mb-2 w-fit">
                    {tag}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-tight group-hover:translate-x-1 transition-transform">
                    {label}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-transform delay-75">
                    Explore <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-primary-50/40 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="section-badge mb-4">✦ Process</div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-gray-500 text-base sm:text-lg">
              From search to move-in in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Step number watermark */}
                <div className="absolute top-4 right-5 text-6xl font-black text-gray-50 dark:text-white/5 select-none leading-none pointer-events-none">{step}</div>

                <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-5 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>

                {/* Connector arrow — hide on last item */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-primary-300">
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ROOMMATE FINDING VIDEO ANIMATION
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-slide-up">
              <div className="section-badge mb-4">✦ Roommate Finder</div>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                Find Your Vibe,<br />
                <span className="gradient-text">Not Just a Roommate</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Tired of awkward roommate interviews? Our AI-powered matchmaking connects you with like-minded individuals based on lifestyle, habits, and preferences.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Advanced compatibility matching',
                  'Verified profiles & background checks',
                  'Secure in-app chat & video calls',
                  'Shared expenses tracking'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link
                to="/roommates"
                className="btn-primary rounded-xl px-8 py-4 text-base shine-hover inline-flex items-center gap-2"
              >
                Find a Roommate <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="order-1 lg:order-2 relative">
              {/* Interactive Roommate Match Showcase Card */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/15 border border-gray-100 bg-gradient-to-tr from-slate-900 to-indigo-950 p-6 aspect-[4/3] flex flex-col justify-between z-10 select-none">
                
                {/* Background mesh glow inside the card */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-[40px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-[40px]" />

                {/* Profile Header */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" 
                      alt="Roommate Profile" 
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/10"
                    />
                    <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">Kriti Sen, 24</span>
                      <span className="bg-primary-500/20 text-primary-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-primary-500/30">VERIFIED</span>
                    </div>
                    <p className="text-gray-400 text-xs">UX Designer · Looking in Koregaon Park</p>
                  </div>
                </div>

                {/* Match compatibility banner */}
                <div className="my-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between relative z-10 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                      <Star size={18} className="fill-current" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">98% Match Score</h4>
                      <p className="text-gray-400 text-[11px]">Highly compatible preferences</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-pink-400 font-extrabold text-lg">Match Found!</span>
                  </div>
                </div>

                {/* Badges and tags */}
                <div className="flex flex-wrap gap-2 relative z-10 mb-2">
                  {['Veg Only', 'Early Bird', 'No Smoking', 'Pets Welcomed'].map((tag, i) => (
                    <span 
                      key={i} 
                      className="bg-white/5 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Floating message overlay */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-4 pointer-events-none z-20">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl flex items-center gap-3 animate-bounce-slow border border-gray-100 dark:border-white/10">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-500">
                      <MessageSquare size={16} className="fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-gray-900 dark:text-white">Direct Message</div>
                      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">"Hey! I like your profile, let's connect?"</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-[60px] opacity-70 animate-blob" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-[60px] opacity-70 animate-blob animation-delay-2000" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY RentXY (FEATURES)
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="section-badge mb-4">✦ Why Us</div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Why Choose <span className="gradient-text">RentXY?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex gap-4 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-primary-200 dark:hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-all duration-300 group cursor-default shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest mb-4">
              ✦ Testimonials
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by Thousands
            </h2>
            <p className="mt-3 text-primary-200 text-base sm:text-lg">Real stories from real people</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text, avatar, rating }) => (
              <div key={name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl p-6 hover:bg-white/15 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {avatar}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{name}</div>
                    <div className="text-primary-300 text-xs">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          OWNER CTA
      ═══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-10 sm:p-16 text-center shadow-2xl shadow-primary-500/30">
            {/* Decorative blobs inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 border border-white/25 rounded-full text-white/90 text-xs font-bold uppercase tracking-widest mb-6">
                🏠 For Property Owners
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 tracking-tight">
                List Your Property<br className="hidden sm:block" /> for Free
              </h2>
              <p className="text-primary-100 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Reach thousands of verified tenants across India. No commission, no broker, no nonsense.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/post-property"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-black text-base rounded-2xl shadow-xl shadow-black/20 hover:bg-gray-50 transition-all active:scale-95 shine-hover"
                >
                  <Building2 size={20} />
                  Post Property — It's Free
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur text-white font-bold text-base rounded-2xl border border-white/30 hover:bg-white/25 transition-all active:scale-95"
                >
                  Learn More <ArrowRight size={18} />
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 text-white/70 text-sm">
                {['✅ No broker fees', '✅ Verified tenants', '✅ Live in minutes'].map(t => (
                  <span key={t} className="font-medium">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
