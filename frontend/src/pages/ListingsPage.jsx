import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Map as MapIcon, List, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
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
  const [sortBy, setSortBy] = useState('');

  // Location autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const suggestionsRef = useRef(null);

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

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedLocation) params.location = appliedLocation;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (sortBy) params.sortBy = sortBy;

      const response = await api.get('/listings', { params });
      let results = response.data;

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

      setListings(results);
      if (results.length > 0 && results[0].latitude && results[0].longitude) {
        setMapCenter([results[0].latitude, results[0].longitude]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeType, appliedLocation, minPrice, maxPrice, sortBy, selectedAmenities]);

  // Load wishlist IDs
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/wishlist/ids').then(res => setWishlistIds(res.data)).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearch = () => {
    setAppliedLocation(searchInput);
    setShowSuggestions(false);
  };

  const selectLocation = (loc) => {
    setSearchInput(loc);
    setAppliedLocation(loc);
    setShowSuggestions(false);
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
    setSortBy('');
    setSearchInput('');
    setAppliedLocation('');
    setActiveType('all');
  };

  const activeFilterCount = [
    minPrice, maxPrice, appliedLocation, ...selectedAmenities
  ].filter(Boolean).length;

  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative" ref={suggestionsRef}>
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchInput.trim().length >= 1 && filteredLocations.length > 0 && setShowSuggestions(true)}
                placeholder="Search by locality, area, or landmark..." 
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm shadow-primary-600/20 active:scale-95"
            >
              <Search className="mr-2" size={20} />
              Search
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`border text-gray-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-colors relative ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="mr-2" size={20} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
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

                {/* Amenities */}
                <div className="md:col-span-2">
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
                    {selectedAmenities.map(a => (
                      <span key={a} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                        {a}
                        <button onClick={() => toggleAmenity(a)} className="ml-1"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap ml-4">
                    Clear All
                  </button>
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search in a different location.</p>
            <button onClick={clearFilters} className="text-primary-600 hover:text-primary-700 font-medium">
              Clear all filters
            </button>
          </div>
        ) : isMapView ? (
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
            
            {/* Map Search Overlay */}
            <div className="absolute top-4 left-16 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center w-64 md:w-80 transition-all focus-within:ring-2 focus-within:ring-primary-500">
              <Search size={18} className="text-gray-400 ml-2 mr-2" />
              <input 
                type="text" 
                placeholder="Search map directly..." 
                className="w-full outline-none text-sm bg-transparent"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.target.value.trim() !== '') {
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(e.target.value)}`);
                      const data = await res.json();
                      if (data && data.length > 0) {
                         setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                      } else {
                         showModal({ type: 'alert', title: 'Not Found', message: 'Location not found on map.', onConfirm: closeModal });
                      }
                    } catch(err) {}
                  }
                }}
              />
            </div>

            <MapContainer 
              center={mapCenter} 
              zoom={12} 
              scrollWheelZoom={true} 
              className="h-full w-full"
            >
              <MapUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {listings.map(listing => (
                listing.latitude && listing.longitude && (
                  <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
                    <Popup className="w-[250px]">
                      <div className="-m-3 pb-2 overflow-hidden rounded-xl">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400'} alt="" className="w-full h-24 object-cover mb-2" />
                        <div className="px-3 pb-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                          <p className="text-xs text-gray-500 mb-1">{listing.location}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-primary-600">₹{listing.price?.toLocaleString()}</span>
                            <a href={`/listings/${listing.id}`} className="text-xs bg-primary-600 text-white px-2 py-1 rounded">View</a>
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
        )}

      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default ListingsPage;
