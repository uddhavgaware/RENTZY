import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Map as MapIcon, List, Navigation, Plus, Minus, Bell, BellOff, CheckCircle, CheckCircle2, Bookmark, Heart, Star, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [center, map]);
  return null;
}

const customMapPinIcon = (isActive) => divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-9 h-9 flex items-center justify-center">
        <div class="absolute inset-0 bg-indigo-500 rounded-full opacity-35 ${isActive ? 'animate-ping' : ''}"></div>
        <div class="relative w-8 h-8 ${isActive ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white text-indigo-600 border-indigo-600'} rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-map-marker-container',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[500] flex flex-col bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl overflow-hidden">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }} className="p-3 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-200 active:bg-gray-200" title="Zoom In"><Plus size={16} /></button>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }} className="p-3 hover:bg-gray-100 text-gray-700 transition-colors active:bg-gray-200" title="Zoom Out"><Minus size={16} /></button>
    </div>
  );
}

import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { calculateDistance, geocodeAddress } from '../utils/distanceUtils';

const LOCATIONS = [
  'Koregaon Park', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Wakad', 'Baner', 'Aundh', 'Hadapsar',
  'Kharadi', 'Pimpri-Chinchwad', 'Shivajinagar', 'Deccan', 'Swargate', 'Magarpatta', 'Kalyani Nagar',
  'Andheri', 'Bandra', 'Powai', 'Malad', 'Goregaon', 'Borivali', 'Dadar', 'Lower Parel',
  'Worli', 'Juhu', 'Colaba', 'Thane', 'Navi Mumbai', 'Kandivali',
  'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Electronic City', 'Marathahalli',
  'BTM Layout', 'JP Nagar', 'Jayanagar', 'Banashankari', 'Hebbal', 'Yelahanka',
  'Connaught Place', 'Dwarka', 'Noida', 'Gurgaon', 'Greater Noida', 'Rohini',
  'Saket', 'Hauz Khas', 'Lajpat Nagar', 'Karol Bagh',
  'Gachibowli', 'Madhapur', 'Hitech City', 'Jubilee Hills', 'Banjara Hills',
  'Kukatpally', 'Kondapur', 'Miyapur', 'Secunderabad',
  'Anna Nagar', 'T Nagar', 'Adyar', 'Velachery', 'OMR', 'Tambaram', 'Porur',
];

const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Fridge', 'Washing Machine', 'Parking', 'Security', 'Gym', 'Power Backup', 'Water Supply'];

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const [searchInput, setSearchInput] = useState(searchParams.get('location') || '');
  const [appliedLocation, setAppliedLocation] = useState(searchParams.get('location') || '');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [isMapView, setIsMapView] = useState(false); // Used on mobile
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [messAvailableOnly, setMessAvailableOnly] = useState(false);
  const [tenantPreference, setTenantPreference] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [furnishingFilter, setFurnishingFilter] = useState('');
  const [zeroBrokerageOnly, setZeroBrokerageOnly] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);

  // Commute Proximity
  const [commuteRefName, setCommuteRefName] = useState('');
  const [commuteCoords, setCommuteCoords] = useState(null);
  const [maxDistance, setMaxDistance] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const suggestionsRef = useRef(null);
  const mapSearchInputRef = useRef(null);

  const handleSetCommuteRef = async (queryStr) => {
    const target = queryStr || commuteRefName;
    if (!target || !target.trim()) {
      setCommuteCoords(null);
      return;
    }
    setIsGeocoding(true);
    const result = await geocodeAddress(target);
    setIsGeocoding(false);
    if (result) {
      setCommuteCoords(result);
      setCommuteRefName(target);
    } else {
      showModal({ type: 'alert', title: 'Location Not Found', message: `Could not find coordinates for "${target}".`, onConfirm: closeModal });
    }
  };

  const handleMapSearch = async () => {
    const query = mapSearchInputRef.current?.value;
    if (!query || query.trim() === '') return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        showModal({ type: 'alert', title: 'Not Found', message: 'Location not found on map.', onConfirm: closeModal });
      }
    } catch(err) {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isLocating, setIsLocating] = useState(false);

  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      showModal({ type: 'alert', title: 'Location Error', message: "Geolocation is not supported by your browser.", onConfirm: closeModal });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`);
        const data = await res.json();
        let neighborhood = data.address.neighbourhood || data.address.suburb || data.address.city;
        if (neighborhood) {
          setSearchInput(neighborhood);
          setAppliedLocation(neighborhood);
        }
      } catch (err) {} finally {
        setIsLocating(false);
      }
    }, () => {
      setIsLocating(false);
    });
  };

  useEffect(() => {
    if (searchInput.trim().length >= 1) {
      const filtered = LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(searchInput.toLowerCase())
      ).slice(0, 8);
      setFilteredLocations(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchInput]);

  const fetchListings = async (pageNum = 0, isAppend = false) => {
    setLoading(true);
    try {
      const params = { page: pageNum, size: 20 };
      if (appliedLocation) params.location = appliedLocation;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (sortBy) params.sortBy = sortBy;

      const response = await api.get('/listings', { params });
      let results = response.data.content || [];
      setHasMore(!response.data.last);

      if (activeType === 'pg') {
        results = results.filter(l => l && l.type && ['PG', 'Hostel', 'Co-living Space', 'PG/Hostel'].includes(l.type));
      } else if (activeType === 'flat') {
        results = results.filter(l => l && l.type && ['Flat', 'Apartment', 'Independent House', 'Villa'].includes(l.type));
      }

      if (selectedAmenities.length > 0) {
        results = results.filter(listing =>
          listing && selectedAmenities.every(a => (listing.amenities || []).includes(a))
        );
      }

      if (messAvailableOnly) {
        results = results.filter(listing => listing && listing.messAvailable);
      }

      if (furnishingFilter) {
        results = results.filter(listing => listing && listing.furnishing === furnishingFilter);
      }

      if (tenantPreference) {
        results = results.filter(listing => listing && listing.tenantPreference === tenantPreference);
      }

      if (zeroBrokerageOnly) {
        results = results.filter(listing => listing && (listing.listedBy === 'VERIFIED_OWNER' || !listing.listedBy));
      }

      if (commuteCoords) {
        results = results.map(listing => {
          if (!listing.latitude || !listing.longitude) return { ...listing, distanceToCommute: null };
          const dist = calculateDistance(commuteCoords.lat, commuteCoords.lon, listing.latitude, listing.longitude);
          return { ...listing, distanceToCommute: dist };
        });

        if (maxDistance) {
          results = results.filter(listing => listing.distanceToCommute !== null && listing.distanceToCommute <= parseFloat(maxDistance));
        }

        if (sortBy === 'distance') {
          results.sort((a, b) => {
            if (a.distanceToCommute === null) return 1;
            if (b.distanceToCommute === null) return -1;
            return a.distanceToCommute - b.distanceToCommute;
          });
        }
      }

      if (isAppend) {
        setListings(prev => [...prev, ...results]);
      } else {
        setListings(results);
        if (results.length > 0 && results[0].latitude) {
          setMapCenter([results[0].latitude, results[0].longitude]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchListings(0, false);
    setAlertSaved(false);
  }, [appliedLocation, activeType, minPrice, maxPrice, selectedAmenities, messAvailableOnly, furnishingFilter, tenantPreference, commuteCoords, maxDistance, sortBy, zeroBrokerageOnly]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setMessAvailableOnly(false);
    setTenantPreference('');
    setSortBy('');
    setFurnishingFilter('');
    setCommuteRefName('');
    setCommuteCoords(null);
    setMaxDistance('');
    setAppliedLocation('');
    setSearchInput('');
    setZeroBrokerageOnly(false);
  };

  const handleSaveSearch = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    try {
      await api.post('/alerts/subscribe', {
        location: appliedLocation || 'All Locations',
        propertyType: activeType === 'all' ? 'Flat' : activeType === 'pg' ? 'PG' : 'Flat'
      });
      setAlertSaved(true);
    } catch (err) {}
  };

  const activeFilterCount =
    (appliedLocation ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    selectedAmenities.length +
    (messAvailableOnly ? 1 : 0) +
    (tenantPreference ? 1 : 0) +
    (furnishingFilter ? 1 : 0) +
    (commuteCoords ? 1 : 0) +
    (zeroBrokerageOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-10 pt-24 relative overflow-hidden">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-slate-900 py-12 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-4">
            <Sparkles size={12} className="animate-pulse" /> Find Your Next Home
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8">Discover verified spaces with zero brokerage.</h1>

          {/* Floating Glass Search Panel */}
          <div className="max-w-4xl mx-auto bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative" ref={suggestionsRef}>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">
                <MapPin size={20} />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Where do you want to live? (e.g. Hinjewadi, Koramangala)"
                className="w-full pl-12 pr-4 py-4 bg-white/10 dark:bg-slate-800/50 border-none rounded-2xl text-white font-bold outline-none placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-[1000]">
                  {filteredLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSearchInput(loc);
                        setAppliedLocation(loc);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 font-semibold transition-colors flex items-center gap-2"
                    >
                      <MapPin size={16} className="text-indigo-500" /> {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleLiveLocation}
              disabled={isLocating}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 flex-shrink-0"
            >
              <Navigation size={18} /> {isLocating ? 'Locating...' : 'Near Me'}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 flex-shrink-0"
            >
              <SlidersHorizontal size={18} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Animated Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">Price Range</h4>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">Furnishing</h4>
                  <div className="flex gap-2 flex-wrap">
                    {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFurnishingFilter(furnishingFilter === f ? '' : f)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          furnishingFilter === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 border-transparent text-gray-600 dark:text-gray-300 dark:bg-slate-900'
                        }`}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">Tenant Preference</h4>
                  <select value={tenantPreference} onChange={e => setTenantPreference(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200">
                    <option value="">Any</option>
                    <option value="Family">Family</option>
                    <option value="Bachelors (Men)">Bachelors (Men)</option>
                    <option value="Bachelors (Women)">Bachelors (Women)</option>
                  </select>
                </div>

                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">Verification</h4>
                  <button
                    onClick={() => setZeroBrokerageOnly(!zeroBrokerageOnly)}
                    className={`w-full py-3 px-4 text-xs font-bold rounded-xl border transition-all ${
                      zeroBrokerageOnly 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-gray-50 border-transparent text-gray-600 dark:text-gray-300 dark:bg-slate-900'
                    }`}
                  >
                    🚫 Zero Brokerage Only
                  </button>
                </div>

                <div className="md:col-span-4 pt-6 border-t border-gray-100 dark:border-white/5">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          selectedAmenities.includes(a) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 border-transparent text-gray-600 dark:text-gray-300 dark:bg-slate-900'
                        }`}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                {/* Commute Proximity Panel */}
                <div className="md:col-span-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 mt-4">
                  <h4 className="text-sm font-black text-indigo-950 dark:text-indigo-400 flex items-center gap-2 mb-3"><Navigation size={16} /> Locked Landmarks / Smart Commute</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Type College or Workplace..." value={commuteRefName} onChange={e => setCommuteRefName(e.target.value)} className="w-full md:col-span-2 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={() => handleSetCommuteRef()} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors">Lock Location</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Tab & Mobile Map Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {['all', 'pg', 'flat'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeType === type ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-white/5 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All Spaces' : type === 'pg' ? 'PGs & Hostels' : 'Flats & Apartments'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMapView(!isMapView)}
            className="lg:hidden flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20"
          >
            {isMapView ? <><List size={18} /> List View</> : <><MapIcon size={18} /> Map View</>}
          </button>
        </div>

        {/* Airbnb-style Split-Screen Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Scrollable Listings */}
          <div className={`lg:col-span-7 space-y-6 ${isMapView ? 'hidden lg:block' : ''}`}>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 4].map(i => (
                  <div key={i} className="h-96 bg-white dark:bg-slate-800 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-3xl">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Matching Spaces</h3>
                <button onClick={clearFilters} className="text-indigo-600 font-bold underline mt-2">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map(listing => (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    className="transition-transform"
                  >
                    <ListingCard
                      listing={listing}
                      wishlisted={wishlistIds.includes(listing.id)}
                      onWishlistChange={(id, added) => {
                        setWishlistIds(prev => added ? [...prev, id] : prev.filter(x => x !== id));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => { setPage(p => p + 1); fetchListings(page + 1, true); }}
                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold text-center shadow-sm"
              >
                Load More Spaces
              </button>
            )}
          </div>

          {/* Right: Sticky Map */}
          <div className={`lg:col-span-5 lg:sticky lg:top-28 h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl relative z-0 ${!isMapView ? 'hidden lg:block' : 'w-full h-[600px] lg:h-[calc(100vh-140px)]'}`}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              zoomControl={false}
              className="h-full w-full"
            >
              <CustomZoomControl />
              <MapUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; Google Maps'
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              />
              {listings.map(listing => (
                listing.latitude && listing.longitude && (
                  <Marker
                    key={listing.id}
                    position={[listing.latitude, listing.longitude]}
                    icon={customMapPinIcon(hoveredListingId === listing.id || listings.indexOf(listing) === 0)}
                  >
                    <Popup className="w-[280px]">
                      <div className="-m-3 rounded-2xl overflow-hidden shadow-lg">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400'} alt="" className="w-full h-28 object-cover" />
                        <div className="p-4 bg-white dark:bg-slate-900">
                          <p className="font-black text-gray-900 dark:text-white truncate">{listing.title}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {listing.location}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                            <span className="font-black text-indigo-600 dark:text-indigo-400">₹{listing.price?.toLocaleString()}</span>
                            <a href={`/listings/${listing.id}/${slugify(listing.title)}`} className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Details</a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default ListingsPage;
