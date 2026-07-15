import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Map as MapIcon, List, Navigation, Plus, Minus, Bell, BellOff, CheckCircle, Bookmark } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';

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
  }, [center, map]);
  return null;
}

const customMapPinIcon = divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-primary-500 rounded-full opacity-35 animate-ping"></div>
        <div class="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-map-marker-container',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[500] flex flex-col bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-xl overflow-hidden">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }} className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-200 active:bg-gray-200" title="Zoom In"><Plus size={18} /></button>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }} className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors active:bg-gray-200" title="Zoom Out"><Minus size={18} /></button>
    </div>
  );
}
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

// Popular Indian locations for autocomplete
const LOCATIONS = [
  // Pune
  'Koregaon Park', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Wakad', 'Baner', 'Aundh', 'Hadapsar',
  'Kharadi', 'Pimpri-Chinchwad', 'Shivajinagar', 'Deccan', 'Swargate', 'Magarpatta', 'Kalyani Nagar',
  // Mumbai
  'Andheri', 'Bandra', 'Powai', 'Malad', 'Goregaon', 'Borivali', 'Dadar', 'Lower Parel',
  'Worli', 'Juhu', 'Colaba', 'Thane', 'Navi Mumbai', 'Kandivali',
  // Bangalore
  'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Electronic City', 'Marathahalli',
  'BTM Layout', 'JP Nagar', 'Jayanagar', 'Banashankari', 'Hebbal', 'Yelahanka',
  // Delhi NCR
  'Connaught Place', 'Dwarka', 'Noida', 'Gurgaon', 'Greater Noida', 'Rohini',
  'Saket', 'Hauz Khas', 'Lajpat Nagar', 'Karol Bagh',
  // Hyderabad
  'Gachibowli', 'Madhapur', 'Hitech City', 'Jubilee Hills', 'Banjara Hills',
  'Kukatpally', 'Kondapur', 'Miyapur', 'Secunderabad',
  // Chennai
  'Anna Nagar', 'T Nagar', 'Adyar', 'Velachery', 'OMR', 'Tambaram', 'Porur',
];

const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Fridge', 'Washing Machine', 'Parking', 'Security', 'Gym', 'Power Backup', 'Water Supply'];

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const [searchInput, setSearchInput] = useState(searchParams.get('location') || '');
  const [appliedLocation, setAppliedLocation] = useState(searchParams.get('location') || '');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [isMapView, setIsMapView] = useState(false);
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
  const [alertSaved, setAlertSaved] = useState(false);

  // Location autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const suggestionsRef = useRef(null);
  const mapSearchInputRef = useRef(null);

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

  // Close suggestions on outside click
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
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
        const data = await res.json();
        
        let neighborhood = data.address.neighbourhood || data.address.suburb || data.address.city_district || data.address.city;
        if (neighborhood) {
          setSearchInput(neighborhood);
          setAppliedLocation(neighborhood);
          setShowSuggestions(false);
        } else {
          showModal({ type: 'alert', title: 'Location Error', message: "Could not determine your exact neighborhood.", onConfirm: closeModal });
        }
      } catch (err) {
        showModal({ type: 'alert', title: 'Location Error', message: "Failed to reverse geocode location.", onConfirm: closeModal });
      } finally {
        setIsLocating(false);
      }
    }, () => {
      showModal({ type: 'alert', title: 'Location Error', message: "Unable to retrieve your location. Please check your browser permissions.", onConfirm: closeModal });
      setIsLocating(false);
    });
  };

  // Filter locations as user types
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

      // Client-side category filter
      if (activeType === 'pg') {
        results = results.filter(l => ['PG', 'Hostel', 'Co-living Space'].includes(l.type));
      } else if (activeType === 'flat') {
        results = results.filter(l => ['Flat', 'Apartment', 'Independent House', 'Villa'].includes(l.type));
      }

      // Client-side amenity filter
      if (selectedAmenities.length > 0) {
        results = results.filter(listing =>
          selectedAmenities.every(a => (listing.amenities || []).includes(a))
        );
      }

      // Client-side Mess filter
      if (messAvailableOnly) {
        results = results.filter(listing => listing.messAvailable);
      }

      // Client-side Furnishing filter
      if (furnishingFilter) {
        results = results.filter(l => l.furnishing === furnishingFilter);
      }

      // Client-side Tenant Preference filter
      if (tenantPreference) {
        results = results.filter(l => !l.tenantPreference || l.tenantPreference === 'Anyone' || l.tenantPreference === tenantPreference);
      }

      if (isAppend) {
        setListings(prev => [...prev, ...results]);
      } else {
        setListings(results);
      }
      
      if (pageNum === 0 && results.length > 0 && results[0].latitude && results[0].longitude) {
        setMapCenter([results[0].latitude, results[0].longitude]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchListings(0, false);
  }, [activeType, appliedLocation, minPrice, maxPrice, sortBy, selectedAmenities, messAvailableOnly, tenantPreference, furnishingFilter]);

  // Load wishlist IDs
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/wishlist/ids').then(res => setWishlistIds(res.data)).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearch = () => {
    const loc = searchInput.trim();
    setAppliedLocation(loc);
    setShowSuggestions(false);
    // Geocode the searched location and pan map
    if (loc) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        })
        .catch(() => {});
    }
  };

  const selectLocation = (loc) => {
    setSearchInput(loc);
    setAppliedLocation(loc);
    setShowSuggestions(false);
    // Geocode and pan map
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(() => {});
  };

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
    setSortBy('');
    setSearchInput('');
    setAppliedLocation('');
    setActiveType('all');
    setTenantPreference('');
    setFurnishingFilter('');
    setAlertSaved(false);
  };

  const handleSaveSearch = async () => {
    if (!isAuthenticated) { showModal({ type: 'alert', title: 'Login Required', message: 'Please log in to save search alerts.', onConfirm: closeModal }); return; }
    try {
      await api.post('/search-alerts', { location: appliedLocation || 'Any', propertyType: activeType === 'all' ? 'Any' : activeType });
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 3000);
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to save search alert.', onConfirm: closeModal });
    }
  };

  const activeFilterCount = [
    minPrice, maxPrice, appliedLocation, tenantPreference, furnishingFilter, ...selectedAmenities, messAvailableOnly ? 'mess' : null
  ].filter(Boolean).length;

  return (
    <div className="bg-mesh-gradient min-h-screen pt-4 pb-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary-200/15 rounded-full translate-x-1/3 -translate-y-1/3 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Search Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 md:p-6 mb-6 mt-4 relative z-20 shadow-lg shadow-gray-200/50 border border-gray-100/80">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative" ref={suggestionsRef}>
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-500" size={20} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchInput.trim().length >= 1 && filteredLocations.length > 0 && setShowSuggestions(true)}
                placeholder="Search by locality, area, or landmark..." 
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-gray-800 font-medium placeholder-gray-400"
              />
              <button 
                onClick={handleLiveLocation}
                disabled={isLocating}
                title="Use my current location"
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${isLocating ? 'text-primary-500 animate-pulse' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
              >
                <Navigation size={18} className={isLocating ? 'animate-spin' : ''} />
              </button>

              {/* Location Autocomplete Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {filteredLocations.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectLocation(loc)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <MapPin size={16} className="text-primary-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleSearch}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-primary-600/25 active:scale-95"
            >
              <Search className="mr-2" size={20} />
              Search
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`border text-gray-700 px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center transition-all relative ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="mr-2" size={20} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Smart Search Hint Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 w-full sm:w-auto">✨ Try:</p>
            {[
              { label: 'PG under ₹8k with Wi-Fi', loc: '', type: 'pg', maxP: '8000', amenity: 'WiFi' },
              { label: 'Women PG with Meals', loc: '', type: 'pg', pref: 'Bachelors (Women)', mess: true },
              { label: 'Furnished Flat in Koregaon Park', loc: 'Koregaon Park', type: 'flat', furnishing: 'Fully Furnished' },
              { label: 'AC + Parking in Hinjewadi', loc: 'Hinjewadi', type: 'all', amenity: 'AC' },
            ].map((hint, i) => (
              <button
                key={i}
                onClick={() => {
                  if (hint.loc) { setSearchInput(hint.loc); setAppliedLocation(hint.loc); }
                  if (hint.type) setActiveType(hint.type);
                  if (hint.maxP) setMaxPrice(hint.maxP);
                  if (hint.pref) setTenantPreference(hint.pref);
                  if (hint.mess) setMessAvailableOnly(true);
                  if (hint.furnishing) setFurnishingFilter(hint.furnishing);
                  if (hint.amenity) setSelectedAmenities(prev => prev.includes(hint.amenity) ? prev : [...prev, hint.amenity]);
                }}
                className="text-xs font-semibold px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-full transition-colors"
              >
                {hint.label}
              </button>
            ))}
          </div>

          {/* Expandable Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Price Range (₹/month)</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <span className="flex items-center text-gray-400">—</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  {/* Quick price buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['5000', '10000', '15000', '25000'].map(price => (
                      <button
                        key={price}
                        onClick={() => setMaxPrice(price)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          maxPrice === price
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ≤ ₹{parseInt(price).toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furnishing */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Furnishing</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFurnishingFilter(furnishingFilter === f ? '' : f)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          furnishingFilter === f
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                {/* Tenant Preference */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Tenant Preference</h4>
                  <select 
                    value={tenantPreference} 
                    onChange={e => setTenantPreference(e.target.value)} 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Any</option>
                    <option value="Family">Family</option>
                    <option value="Bachelors (Men)">Bachelors (Men)</option>
                    <option value="Bachelors (Women)">Bachelors (Women)</option>
                    <option value="Students">Students</option>
                  </select>
                </div>

                {/* Amenities */}
                <div className="md:col-span-1">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(amenity => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>

                  {/* Mess Filter */}
                  {(activeType === 'all' || activeType === 'pg') && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${messAvailableOnly ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300 group-hover:border-orange-400'}`}>
                          {messAvailableOnly && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={messAvailableOnly}
                          onChange={(e) => setMessAvailableOnly(e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-sm font-bold text-gray-700">Mess / Food Facility Available</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filters + Clear */}
              {activeFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {appliedLocation && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                        📍 {appliedLocation}
                        <button onClick={() => { setAppliedLocation(''); setSearchInput(''); }} className="ml-1 hover:text-primary-900">
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {minPrice && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                        Min ₹{parseInt(minPrice).toLocaleString('en-IN')}
                        <button onClick={() => setMinPrice('')} className="ml-1"><X size={12} /></button>
                      </span>
                    )}
                    {maxPrice && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                        Max ₹{parseInt(maxPrice).toLocaleString('en-IN')}
                        <button onClick={() => setMaxPrice('')} className="ml-1"><X size={12} /></button>
                      </span>
                    )}
                    {tenantPreference && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        {tenantPreference}
                        <button onClick={() => setTenantPreference('')} className="ml-1"><X size={12} /></button>
                      </span>
                    )}
                    {selectedAmenities.map(a => (
                      <span key={a} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                        {a}
                        <button onClick={() => toggleAmenity(a)} className="ml-1"><X size={12} /></button>
                      </span>
                    ))}
                  {furnishingFilter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                      {furnishingFilter}
                      <button onClick={() => setFurnishingFilter('')} className="ml-1"><X size={12} /></button>
                    </span>
                  )}
                  {messAvailableOnly && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                        Mess Available
                        <button onClick={() => setMessAvailableOnly(false)} className="ml-1"><X size={12} /></button>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <button
                      onClick={handleSaveSearch}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        alertSaved
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {alertSaved ? <CheckCircle size={13} /> : <Bookmark size={13} />}
                      {alertSaved ? 'Alert Saved!' : 'Save Search'}
                    </button>
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Categories Tab & Map Toggle */}
        <div className="flex justify-between items-center mb-6 pb-2">
          <div className="flex overflow-x-auto hide-scrollbar gap-2">
            {['all', 'pg', 'flat'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeType === type
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All Properties' : type === 'pg' ? 'PGs & Hostels' : 'Flats & Apartments'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsMapView(!isMapView)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            {isMapView ? <><List size={18} /> List View</> : <><MapIcon size={18} /> Map View</>}
          </button>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-900">
            {listings.length} {listings.length === 1 ? 'Property' : 'Properties'} found
            {appliedLocation && <span className="text-primary-600 font-medium text-base ml-2">in "{appliedLocation}"</span>}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-sm"
            >
              <option value="">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Listings Grid or Map */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                <div className="h-52 sm:h-56 bg-gray-200"></div>
                <div className="p-4 sm:p-5">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-md w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-50/50 rounded-3xl border border-gray-100">
            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any properties matching your criteria in this area. Would you like us to notify you when new properties are added?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={clearFilters} className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                Clear all filters
              </button>
              {(appliedLocation || searchInput) && isAuthenticated && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await api.post('/alerts/subscribe', { 
                        location: appliedLocation || searchInput, 
                        propertyType: activeType === 'all' ? 'Flat' : activeType === 'pg' ? 'PG' : 'Flat'
                      });
                      import('react-hot-toast').then(({ toast }) => toast.success(res.data.message || 'Subscribed successfully!'));
                    } catch (err) {
                      import('react-hot-toast').then(({ toast }) => toast.error(err.response?.data?.error || 'Failed to subscribe'));
                    }
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Bell size={18} /> Notify Me
                </button>
              )}
              {(appliedLocation || searchInput) && !isAuthenticated && (
                <button 
                  onClick={() => navigate('/auth')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Bell size={18} /> Login to get notified
                </button>
              )}
            </div>
          </div>
        ) : isMapView ? (
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
            
            {/* Map Search Overlay */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 md:-translate-x-0 md:left-16 z-[500] glass-premium rounded-2xl p-1.5 flex items-center w-[90%] md:w-96 transition-all focus-within:ring-2 focus-within:ring-primary-500 shadow-xl border border-white/50 bg-white/90 backdrop-blur-md">
              <div className="pl-3 pr-2 text-gray-400">
                <MapPin size={18} className="text-primary-500" />
              </div>
              <input 
                ref={mapSearchInputRef}
                type="text" 
                placeholder="Search map location..." 
                className="w-full outline-none text-sm bg-transparent font-medium text-gray-800 placeholder-gray-400 py-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMapSearch();
                }}
              />
              <button 
                onClick={handleMapSearch}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center shadow-sm transition-colors active:scale-95 ml-1 flex-shrink-0"
              >
                Search
              </button>
            </div>

            <MapContainer 
              center={mapCenter} 
              zoom={12} 
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
                  <Marker key={listing.id} position={[listing.latitude, listing.longitude]} icon={customMapPinIcon}>
                    <Popup className="w-[250px]">
                      <div className="-m-3 pb-2 overflow-hidden rounded-xl">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400'} alt="" className="w-full h-24 object-cover mb-2" />
                        <div className="px-3 pb-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                          <p className="text-xs text-gray-500 mb-1">{listing.location}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-primary-600">₹{listing.price?.toLocaleString()}</span>
                            <a href={`/listings/${listing.id}/${slugify(listing.title)}`} className="text-xs bg-primary-600 text-white px-2 py-1 rounded">View</a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  wishlisted={wishlistIds.includes(listing.id)}
                  onWishlistChange={(id, added) => {
                    setWishlistIds(prev => added ? [...prev, id] : prev.filter(x => x !== id));
                  }}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchListings(nextPage, true);
                  }}
                  disabled={loading}
                  className="bg-white border-2 border-primary-100 text-primary-700 px-8 py-3 rounded-xl font-bold hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Properties'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default ListingsPage;
