import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Home } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';
import ListingCard from '../components/ListingCard';
import PortalEnhancements from '../components/PortalEnhancements';
import api from '../services/api';

const PgHostelPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('boys');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPgListings = async () => {
      setLoading(true);
      try {
        const [pgRes, hostelRes] = await Promise.all([
          api.get('/listings', { params: { type: 'pg', size: 30, _t: Date.now() } }),
          api.get('/listings', { params: { type: 'Hostel', size: 30, _t: Date.now() } })
        ]);
        const data = [
          ...(pgRes.data?.content || pgRes.data || []),
          ...(hostelRes.data?.content || hostelRes.data || [])
        ];
        setListings(data);
      } catch (err) {
        console.error('Failed to fetch PG listings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPgListings();
  }, []);

  const handleBrowseAll = (pref = '') => {
    if (pref) {
      navigate(`/listings?type=pg&tenantPreference=${encodeURIComponent(pref)}`);
    } else {
      navigate('/listings?type=pg');
    }
  };

  const filteredListings = listings.filter(l => {
    if (!l) return false;
    const pref = (l.tenantPreference || '').toLowerCase();
    const title = (l.title || '').toLowerCase();
    const desc = (l.description || '').toLowerCase();

    if (activeTab === 'girls') {
      return pref.includes('women') || pref.includes('girl') || pref.includes('female') || title.includes('women') || title.includes('girl') || title.includes('female') || desc.includes('women only') || desc.includes('girls only') || pref === 'anyone' || !pref;
    }
    if (activeTab === 'boys') {
      return pref.includes('men') || pref.includes('boy') || pref.includes('male') || title.includes('men') || title.includes('boy') || title.includes('male') || desc.includes('men only') || desc.includes('boys only') || pref === 'anyone' || !pref;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <PremiumHero
        title="Your Campus"
        highlightText="Home & Community"
        highlightColorClass="text-purple-400"
        buttonText="Find Your PG"
        buttonColorClass="bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
        searchType="pg"
        subtitle="Discover student-friendly, verified PGs and Hostels near your college. Safe, vibrant, and tailored for boys and girls."
        videoSrc="https://videos.pexels.com/video-files/6394054/6394054-uhd_2560_1440_25fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '📶', text: 'WiFi & Meals Included' },
          { icon: '🛡️', text: 'CCTV & Biometric Security' },
          { icon: '🚫', text: 'No Brokerage Fee' }
        ]}
      />
      
      {/* Interactive Gender Theme Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${
        activeTab === 'girls'
          ? 'bg-gradient-to-b from-pink-50/70 via-white to-pink-50/30 dark:from-pink-950/20 dark:via-slate-900 dark:to-slate-900'
          : activeTab === 'boys'
          ? 'bg-gradient-to-b from-blue-50/70 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900'
          : 'bg-white dark:bg-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          {/* Header & Tabs */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border shadow-sm ${
              activeTab === 'girls'
                ? 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800/50'
                : activeTab === 'boys'
                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50'
                : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/50'
            }`}>
              <Sparkles size={14} /> Curated Housing Communities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              {activeTab === 'girls' && "Girls PGs & Hostels"}
              {activeTab === 'boys' && "Boys PGs & Hostels"}
              {activeTab === 'all' && "Explore All Student PGs"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
              {activeTab === 'girls' && "Safe, comfortable women-only shared housing with 24/7 CCTV security, biometric access, nutritious meals, and a supportive community."}
              {activeTab === 'boys' && "Vibrant, hassle-free men's accommodations with high-speed WiFi, recreational lounges, laundry services, and zero brokerage."}
              {activeTab === 'all' && "Browse our comprehensive catalogue of verified student PGs, hostels, and co-living spaces."}
            </p>

            {/* Gender Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-lg max-w-full overflow-x-auto">
              <button
                onClick={() => setActiveTab('boys')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'boys' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30'}`}
              >
                🧑 Boys PGs & Hostels
              </button>
              <button
                onClick={() => setActiveTab('girls')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'girls' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30 scale-105' : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600 dark:text-gray-400 dark:hover:bg-pink-900/30'}`}
              >
                👩 Girls PGs & Hostels
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                ✨ All PGs
              </button>
            </div>
          </div>

          {/* Theme Highlights Banner */}
          <div className={`mb-12 p-6 sm:p-8 rounded-3xl border transition-all duration-500 shadow-sm ${
            activeTab === 'girls'
              ? 'bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-white dark:to-slate-800 border-pink-200 dark:border-pink-900/40'
              : activeTab === 'boys'
              ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-white dark:to-slate-800 border-blue-200 dark:border-blue-900/40'
              : 'bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-white dark:to-slate-800 border-purple-200 dark:border-purple-900/40'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-xl flex-shrink-0 ${
                  activeTab === 'girls' ? 'bg-gradient-to-tr from-pink-500 to-rose-400 shadow-pink-500/20' : activeTab === 'boys' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-tr from-purple-500 to-violet-600 shadow-purple-500/20'
                }`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Verified Security</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activeTab === 'girls' ? 'CCTV surveillance & female warden on campus.' : 'Secure keycard entry & 24/7 security guard.'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-xl flex-shrink-0 ${
                  activeTab === 'girls' ? 'bg-gradient-to-tr from-pink-500 to-rose-400 shadow-pink-500/20' : activeTab === 'boys' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-tr from-purple-500 to-violet-600 shadow-purple-500/20'
                }`}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Home-Cooked Meals</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hygienic breakfast, lunch, and dinner options included.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-xl flex-shrink-0 ${
                  activeTab === 'girls' ? 'bg-gradient-to-tr from-pink-500 to-rose-400 shadow-pink-500/20' : activeTab === 'boys' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-tr from-purple-500 to-violet-600 shadow-purple-500/20'
                }`}>
                  <Home size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Zero Brokerage</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Connect directly with verified hostel & PG owners.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                activeTab === 'girls' ? 'border-pink-600' : activeTab === 'boys' ? 'border-blue-600' : 'border-purple-600'
              }`}></div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm max-w-xl mx-auto">
              <Users size={48} className={`mx-auto mb-4 ${
                activeTab === 'girls' ? 'text-pink-400' : activeTab === 'boys' ? 'text-blue-400' : 'text-purple-400'
              }`} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No {activeTab === 'girls' ? 'Girls' : activeTab === 'boys' ? 'Boys' : ''} PGs found right now</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
                New accommodations are being verified daily. You can browse all available rentals or set up an alert.
              </p>
              <button
                onClick={() => handleBrowseAll()}
                className={`px-6 py-2.5 rounded-full text-white font-bold text-sm transition-all shadow-md ${
                  activeTab === 'girls' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/20' : activeTab === 'boys' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                }`}
              >
                Browse All Properties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredListings.slice(0, 6).map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  themeOverride={activeTab === 'girls' ? 'girls' : activeTab === 'boys' ? 'boys' : null} 
                />
              ))}
            </div>
          )}

          {/* Bottom CTA to browse more */}
          <div className="text-center mt-8">
            <button
              onClick={() => handleBrowseAll(activeTab === 'girls' ? 'Bachelors (Women)' : activeTab === 'boys' ? 'Bachelors (Men)' : '')}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-white text-base shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeTab === 'girls'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/25 hover:from-pink-600 hover:to-rose-700'
                  : activeTab === 'boys'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-purple-500/25 hover:from-purple-700 hover:to-violet-700'
              }`}
            >
              <span>Explore All {activeTab === 'girls' ? 'Girls' : activeTab === 'boys' ? 'Boys' : ''} PGs & Hostels</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <PortalEnhancements type="pg" />
    </div>
  );
};

export default PgHostelPortal;
