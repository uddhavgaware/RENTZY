import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, IndianRupee, MessageCircle, Plus, Minus, X, Users, Trash2, Info, BadgeCheck, Navigation, ChevronLeft, ChevronRight, Image as ImageIcon, Map as MapIcon, List, Home, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { divIcon } from 'leaflet';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[500] flex flex-col bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-xl overflow-hidden">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }} className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-200 active:bg-gray-200" title="Zoom In"><Plus size={18} /></button>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }} className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors active:bg-gray-200" title="Zoom Out"><Minus size={18} /></button>
    </div>
  );
}

const createCustomIcon = (type) => {
  let IconComponent = Building2;
  let colorClass = 'text-gray-500';
  let borderClass = 'border-gray-500';

  if (type === 'Flat') {
    IconComponent = Home;
    colorClass = 'text-blue-500';
    borderClass = 'border-blue-500';
  } else if (type === 'Room') {
    IconComponent = Users;
    colorClass = 'text-red-500';
    borderClass = 'border-red-500';
  } else if (type === 'Hostel') {
    IconComponent = Building2;
    colorClass = 'text-orange-500';
    borderClass = 'border-orange-500';
  }

  const iconHtml = renderToStaticMarkup(<IconComponent size={20} className={colorClass} />);

  return divIcon({
    html: `<div class="bg-white p-1.5 rounded-full shadow-lg border-2 ${borderClass}">${iconHtml}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PremiumHero from '../components/PremiumHero';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const RoommatesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activeImageIndexes, setActiveImageIndexes] = useState({});
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [searchInput, setSearchInput] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [modalMapSearchQuery, setModalMapSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const nextImage = (id, maxIndex) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] === maxIndex ? 0 : (prev[id] || 0) + 1
    }));
  };

  const prevImage = (id, maxIndex) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) === 0 ? maxIndex : (prev[id] || 0) - 1
    }));
  };
  
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

  const geocodeAndSetPostLocation = async (locationText) => {
    if (!locationText || !locationText.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setPostFormData(prev => ({...prev, latitude: lat, longitude: lon}));
      }
    } catch (err) {
      console.error('Geocode failed', err);
    }
  };

  const handleModalMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!modalMapSearchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(modalMapSearchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setPostFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        
        const reverseRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
        const reverseData = await reverseRes.json();
        const addr = reverseData.address || {};
        const area = addr.neighbourhood || addr.suburb || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || '';
        const district = addr.county || addr.state_district || '';
        const pincode = addr.postcode || '';
        setPostFormData(prev => ({
          ...prev,
          areaName: area || reverseData.display_name.split(',')[0],
          villageCityTown: city,
          district: district,
          pincode: pincode
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  function ModalLocationPicker() {
    useMapEvents({
      async click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        setMapCenter([lat, lon]);
        setPostFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};
          const area = addr.neighbourhood || addr.suburb || addr.city_district || '';
          const city = addr.city || addr.town || addr.village || '';
          const district = addr.county || addr.state_district || '';
          const pincode = addr.postcode || '';
          setPostFormData(prev => ({
            ...prev,
            areaName: area || data.display_name.split(',')[0],
            villageCityTown: city,
            district: district,
            pincode: pincode
          }));
        } catch (err) {
          console.error(err);
        }
      }
    });
    return null;
  }

  const handlePostLiveLocation = () => {
    if (!navigator.geolocation) {
      showModal({ type: 'alert', title: 'Location Error', message: "Geolocation is not supported by your browser.", onConfirm: closeModal });
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
        const data = await res.json();
        
        let neighborhood = data.address.neighbourhood || data.address.suburb || data.address.city_district || data.address.city;
        if (neighborhood) {
          setPostFormData(prev => ({...prev, location: neighborhood, latitude, longitude}));
          setMapCenter([latitude, longitude]);
        }
      } catch (err) {
        console.error("Failed to reverse geocode", err);
      }
    });
  };

  const [postFormData, setPostFormData] = useState({
    location: '',
    buildingName: '',
    areaName: '',
    villageCityTown: '',
    taluka: '',
    district: '',
    pincode: '',
    budget: '',
    deposit: '',
    preferences: '',
    vacancies: 1,
    totalCapacity: 2,
    targetOccupation: 'Any',
    targetGender: 'Any',
    maintenanceIncluded: false,
    availableFrom: 'Immediately',
    agePreference: '',
    dietaryPref: 'Any',
    smokingPref: 'Non-Smoking',
    drinkingPref: 'Non-Drinking',
    petsPref: 'No Pets',
    sleepSchedule: 'Flexible',
    cleanlinessLevel: 'Moderate',
    images: [],
    latitude: null,
    longitude: null,
    propertyType: 'Room',
    electricityBill: 'Not Included',
    waterSupply: 'Not Included',
    maintenance: 'Not Included',
    facing: '',
    areaSqft: '',
    gender: '',
    flatSize: '1BHK',
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const currentImagesCount = postFormData.images ? postFormData.images.length : 0;
    
    if (currentImagesCount + files.length > 3) {
      showModal({ type: 'alert', title: 'Limit Exceeded', message: "You can only upload up to 3 photos for your room/flat.", onConfirm: closeModal });
      return;
    }

    Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1080;
            const MAX_HEIGHT = 1080;

            if (width > height && width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            } else if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
          };
          img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
      });
    })).then(base64Images => {
      const newImages = [...(postFormData.images || []), ...base64Images].slice(0, 3);
      setPostFormData({...postFormData, images: newImages});
    });
  };

  const fetchRoommates = async (pageNum = 0, isAppend = false) => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'smartMatch') {
        response = await api.get('/roommates/matches', { params: { _t: Date.now() } });
      } else {
        response = await api.get('/roommates', { 
          params: { location: searchInput, page: pageNum, size: 20, sort: 'id,desc', _t: Date.now() } 
        });
      }
      
      const results = activeTab === 'smartMatch' ? response.data : (response.data.content || []);
      setHasMore(activeTab === 'smartMatch' ? false : !response.data.last);
      
      if (isAppend) {
        setRoommates(prev => [...prev, ...results]);
      } else {
        setRoommates(results);
      }
    } catch (error) {
      console.error('Failed to fetch roommates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchRoommates(0, false);
  }, [searchInput, activeTab]);

  const handleSearch = () => {
    setPage(0);
    fetchRoommates(0, false);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (isPosting) return;

    if (!user) {
      showModal({ type: 'alert', title: 'Login Required', message: 'You must be logged in to post a request.', onConfirm: closeModal });
      return;
    }

    // Manual Validation - Relaxed to improve UX
    if (!postFormData.areaName?.trim() && !postFormData.villageCityTown?.trim()) {
      showModal({ type: 'alert', title: 'Missing Location', message: 'Please provide at least an Area or City name.', onConfirm: closeModal });
      return;
    }
    if (!postFormData.budget) {
      showModal({ type: 'alert', title: 'Missing Budget', message: 'Please specify the total rent budget.', onConfirm: closeModal });
      return;
    }
    if (!postFormData.gender) {
      showModal({ type: 'alert', title: 'Missing Gender', message: 'Please select your gender in the Your Profile section.', onConfirm: closeModal });
      return;
    }
    if (postFormData.pincode && postFormData.pincode.length !== 6) {
      showModal({ type: 'alert', title: 'Invalid Pincode', message: 'Pincode must be exactly 6 digits.', onConfirm: closeModal });
      return;
    }

    setSubmitting(true);
    try {
      // Build combined location string from address fields
      const locationParts = [
        postFormData.buildingName,
        postFormData.areaName,
        postFormData.villageCityTown,
        postFormData.taluka,
        postFormData.district,
        postFormData.pincode ? `- ${postFormData.pincode}` : ''
      ].filter(Boolean).join(', ');

      const payload = {
        location: locationParts || postFormData.location,
        budget: postFormData.budget ? parseFloat(postFormData.budget) : null,
        deposit: postFormData.deposit ? parseFloat(postFormData.deposit) : 0,
        vacancies: postFormData.vacancies ? parseInt(postFormData.vacancies) : null,
        totalCapacity: postFormData.totalCapacity ? parseInt(postFormData.totalCapacity) : null,
        preferences: [
          postFormData.flatSize,
          ...(postFormData.preferences ? postFormData.preferences.split(',').map(p => p.trim()) : [])
        ].filter(Boolean),
        targetOccupation: postFormData.targetOccupation,
        targetGender: postFormData.targetGender,
        maintenanceIncluded: postFormData.maintenanceIncluded,
        availableFrom: postFormData.availableFrom,
        agePreference: postFormData.agePreference,
        dietaryPref: postFormData.dietaryPref,
        smokingPref: postFormData.smokingPref,
        drinkingPref: postFormData.drinkingPref,
        petsPref: postFormData.petsPref,
        sleepSchedule: postFormData.sleepSchedule,
        cleanlinessLevel: postFormData.cleanlinessLevel,
        images: postFormData.images,
        latitude: postFormData.latitude,
        longitude: postFormData.longitude,
        electricityBill: postFormData.electricityBill,
        waterSupply: postFormData.waterSupply,
        facing: postFormData.facing || null,
        areaSqft: postFormData.areaSqft ? parseInt(postFormData.areaSqft) : null,
        gender: postFormData.gender,
        maintenance: postFormData.maintenance,
        propertyType: postFormData.propertyType,
      };

      setIsPosting(true);
      await api.post('/roommates', payload);
      setIsPosting(false);
      setIsModalOpen(false);
      setPostFormData({ location: '', buildingName: '', areaName: '', villageCityTown: '', taluka: '', district: '', pincode: '', budget: '', deposit: '', preferences: '', vacancies: 1, totalCapacity: 2, images: [], latitude: null, longitude: null, propertyType: 'Room', electricityBill: 'Not Included', waterSupply: 'Not Included', maintenance: 'Not Included', facing: '', areaSqft: '', gender: '', flatSize: '1BHK' });
      showModal({ type: 'alert', title: 'Success', message: 'Roommate request posted successfully!', onConfirm: closeModal });
      
      // Delay fetching slightly to ensure backend transactions commit and state settles
      setTimeout(() => {
        setActiveTab('all');
        setPage(0);
        fetchRoommates(0, false);
      }, 300);
      
    } catch (error) {
      setIsPosting(false);
      console.error('Failed to post roommate request', error);
      const errorData = error.response?.data;
      let errorMsg = 'An error occurred while posting your request. Please try again.';
      if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (errorData?.message) {
        errorMsg = errorData.message;
      }
      showModal({ type: 'alert', title: 'Error', message: errorMsg, onConfirm: closeModal });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = (id) => {
    showModal({
      type: 'confirm',
      title: 'Close Post',
      message: 'Have you found a roommate or want to close this post?',
      onConfirm: async () => {
        closeModal();
        try {
          await api.delete(`/roommates/${id}`);
          setRoommates(prev => prev.filter(r => r.id !== id));
        } catch {
          showModal({ type: 'alert', title: 'Error', message: 'Failed to delete post.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };
  const handlePostRequestClick = () => {
    if (!isAuthenticated) {
      showModal({
        type: 'alert',
        title: 'Authorization Required',
        message: 'You must be logged in to post a roommate request. Please sign in or register to continue.',
        onConfirm: () => {
          closeModal();
          navigate('/auth');
        }
      });
      return;
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && user?.gender) {
      setPostFormData(prev => ({ ...prev, gender: user.gender }));
    }
  }, [isModalOpen, user]);

  return (
    <>
      <PremiumHero
        title="Find Your"
        highlightText="Perfect Match"
        highlightColorClass="text-pink-400"
        subtitle="Connect with like-minded people, split the rent, and make lifelong friends in your new city."
        videoSrc="https://videos.pexels.com/video-files/5977797/5977797-uhd_2560_1440_25fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80"
      >
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full max-w-lg mx-auto">
          <button 
            onClick={() => {
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            }}
            className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white rounded-2xl px-8 py-4 font-bold text-lg transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            Browse Roommates
          </button>
          <button 
            onClick={handlePostRequestClick}
            className="bg-pink-600 hover:bg-pink-500 text-white rounded-2xl px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 shadow-pink-500/25"
          >
            <Plus size={20} />
            Post a Request
          </button>
        </div>
      </PremiumHero>

      <div className="bg-gray-50 min-h-screen pt-12 pb-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 💡 Split Rent Info Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-6 mb-10 flex items-start gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-800 text-base mb-1 flex items-center gap-2">
                <Info size={16} /> Split Rent Among All Members
              </h3>
              <p className="text-green-700 text-sm leading-relaxed">
                Each listing shows the <strong>total rent & deposit</strong> for the entire flat. The <strong>per-member split</strong> is automatically calculated based on total capacity. 
                For example, a ₹15,000/mo flat with 3 members = <strong>₹5,000/mo per person</strong>. Connect with the poster to confirm the final arrangement.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="glass-card rounded-3xl p-4 md:p-6 mb-12 border border-white/40 shadow-sm relative z-20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Preferred Location (e.g. Hinjewadi)" 
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <button 
                  onClick={handleLiveLocation}
                  disabled={isLocating}
                  title="Use my current location"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${isLocating ? 'text-primary-500 animate-pulse' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                >
                  <Navigation size={18} className={isLocating ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="flex-1 relative">
                <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer">
                  <option value="">Budget range</option>
                  <option value="5k-10k">₹5,000 - ₹10,000</option>
                  <option value="10k-15k">₹10,000 - ₹15,000</option>
                  <option value="15k+">₹15,000+</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-sm h-full">
                  <button 
                    onClick={() => setIsMapView(false)}
                    className={`flex items-center px-4 py-2 h-full rounded-lg text-sm font-medium transition-all ${!isMapView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <List size={18} className="md:mr-2" />
                    <span className="hidden md:inline">List</span>
                  </button>
                  <button 
                    onClick={() => setIsMapView(true)}
                    className={`flex items-center px-4 py-2 h-full rounded-lg text-sm font-medium transition-all ${isMapView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <MapIcon size={18} className="md:mr-2" />
                    <span className="hidden md:inline">Map</span>
                  </button>
                </div>
                <button onClick={handleSearch} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 h-full rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm">
                  <Search className="md:mr-2" size={20} />
                  <span className="hidden md:inline">Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              All Requests
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showModal({ type: 'alert', title: 'Login Required', message: 'Please log in to use Smart Match.', onConfirm: closeModal });
                  return;
                }
                setActiveTab('smartMatch');
              }}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'smartMatch' ? 'bg-pink-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'}`}
            >
              🔥 Smart Matches
            </button>
          </div>

          {/* Roommates Grid */}
          {loading && roommates.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : roommates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No roommate requests found. Be the first to post!
            </div>
          ) : (
            <div className={`relative ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
            {isMapView ? (
              <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-gray-200 shadow-lg relative z-0 mb-10">
                {/* Map Search Overlay */}
                <div className="absolute top-4 right-4 z-[500] glass-premium rounded-xl p-3 flex flex-col gap-2 shadow-xl border border-white/50 bg-white/90 backdrop-blur-md text-xs font-bold text-gray-700">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-blue-50 border border-white shadow-sm"></div> Flat
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div> Roommate Request
                   </div>
                </div>
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

                <MapContainer center={mapCenter} zoom={12} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                  <CustomZoomControl />
                  <MapUpdater center={mapCenter} />
                  <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution='&copy; Google Maps' />
                  {roommates.map(roommate => {
                    if (!roommate.latitude || !roommate.longitude) return null;
                    return (
                      <Marker key={roommate.id} position={[roommate.latitude, roommate.longitude]} icon={createCustomIcon('Room')}>
                        <Popup className="roommate-popup">
                           <div className="p-2 min-w-[200px]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-lg text-gray-900">{maskName(roommate.user?.name) || 'User'}</div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gray-100 border border-gray-200 text-gray-700">
                                  Roommate Request
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2 font-medium">{roommate.location}</div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(roommate.gender || roommate.user?.gender) && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    (roommate.gender || roommate.user?.gender).toLowerCase() === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    (roommate.gender || roommate.user?.gender).toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                    👤 {roommate.gender || roommate.user?.gender}
                                  </span>
                                )}
                                {roommate.targetGender !== 'Any' && <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{roommate.targetGender}</span>}
                                {roommate.dietaryPref !== 'Any' && <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{roommate.dietaryPref}</span>}
                              </div>
                              {roommate.availableFrom && <div className="text-xs text-green-600 font-bold mb-2">⏱ Move-in: {roommate.availableFrom}</div>}
                              <div className="text-primary-700 font-bold mb-3 text-lg">₹{roommate.budget}/mo</div>
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setIsMapView(false);
                                  setTimeout(() => {
                                    document.getElementById(`roommate-card-${roommate.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }, 100);
                                }} className="flex-1 bg-white border border-primary-600 text-primary-600 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-50 transition-colors shadow-sm">Details</button>
                                <button onClick={() => navigate(`/messages?user=${roommate.user?.id}`)} className="flex-1 bg-primary-600 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm">Message</button>
                              </div>
                           </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roommates.map(roommate => {
                const isOwner = user?.email === roommate.user?.email;
                const myPost = roommates.find(r => r.user?.email === user?.email);
                
                let matchScore = roommate.matchPercentage != null ? roommate.matchPercentage : null;
                if (matchScore === null && !isOwner && myPost) {
                  let weightedScore = 0;
                  let totalWeight = 0;

                  // Factor 1: Smoking (weight: 15)
                  totalWeight += 15;
                  if (myPost.smokingPref === roommate.smokingPref) weightedScore += 15;
                  else if (myPost.smokingPref === 'Smoking Okay' || roommate.smokingPref === 'Smoking Okay') weightedScore += 10;

                  // Factor 2: Drinking (weight: 12)
                  totalWeight += 12;
                  if (myPost.drinkingPref === roommate.drinkingPref) weightedScore += 12;
                  else if (myPost.drinkingPref === 'Drinking Okay' || roommate.drinkingPref === 'Drinking Okay') weightedScore += 8;

                  // Factor 3: Pets (weight: 8)
                  totalWeight += 8;
                  if (myPost.petsPref === roommate.petsPref) weightedScore += 8;
                  else if (myPost.petsPref === 'Pets Welcome' || roommate.petsPref === 'Pets Welcome') weightedScore += 5;

                  // Factor 4: Dietary (weight: 15)
                  totalWeight += 15;
                  if (myPost.dietaryPref === roommate.dietaryPref) weightedScore += 15;
                  else if (myPost.dietaryPref === 'Any' || roommate.dietaryPref === 'Any') weightedScore += 10;

                  // Factor 5: Sleep Schedule (weight: 12)
                  totalWeight += 12;
                  if (myPost.sleepSchedule === roommate.sleepSchedule) weightedScore += 12;
                  else if (myPost.sleepSchedule === 'Flexible' || roommate.sleepSchedule === 'Flexible') weightedScore += 8;

                  // Factor 6: Cleanliness (weight: 10)
                  totalWeight += 10;
                  if (myPost.cleanlinessLevel === roommate.cleanlinessLevel) weightedScore += 10;
                  else if (myPost.cleanlinessLevel === 'Moderate' || roommate.cleanlinessLevel === 'Moderate') weightedScore += 6;

                  // Factor 7: Occupation (weight: 8)
                  totalWeight += 8;
                  if (myPost.targetOccupation === 'Any' || roommate.targetOccupation === 'Any' || myPost.targetOccupation === roommate.targetOccupation) weightedScore += 8;

                  // Factor 8: Gender Preference (weight: 10)
                  totalWeight += 10;
                  if (myPost.targetGender === 'Any' || roommate.targetGender === 'Any' || myPost.targetGender === roommate.targetGender) weightedScore += 10;
                  else if ((myPost.gender || myPost.user?.gender) && roommate.targetGender === (myPost.gender || myPost.user?.gender)) weightedScore += 10;

                  // Factor 9: Budget Range (weight: 10) — within 30% = full, within 60% = half
                  totalWeight += 10;
                  if (myPost.budget && roommate.budget) {
                    const budgetDiff = Math.abs(myPost.budget - roommate.budget) / Math.max(myPost.budget, roommate.budget);
                    if (budgetDiff <= 0.15) weightedScore += 10;
                    else if (budgetDiff <= 0.3) weightedScore += 7;
                    else if (budgetDiff <= 0.6) weightedScore += 3;
                  }

                  matchScore = Math.round((weightedScore / totalWeight) * 100);
                }

                const splitRent = roommate.totalCapacity > 1 && roommate.budget ? Math.round(roommate.budget / roommate.totalCapacity) : null;
                const splitDeposit = roommate.totalCapacity > 1 && roommate.deposit > 0 ? Math.round(roommate.deposit / roommate.totalCapacity) : null;

                const displayBudget = roommate.budget ? roommate.budget.toLocaleString('en-IN') : 'N/A';
                const displayDeposit = roommate.deposit ? roommate.deposit.toLocaleString('en-IN') : 'N/A';

                return (
                  <div id={`roommate-card-${roommate.id}`} key={roommate.id} className="glass-card bg-white/80 rounded-3xl p-6 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-100 to-transparent rounded-bl-full -z-10 opacity-50"></div>
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-2xl flex items-center justify-center font-bold text-xl mr-4 border-2 border-white shadow-sm shadow-primary-200/50 overflow-hidden">
                          {roommate.user?.profilePhoto ? (
                            <img src={roommate.user.profilePhoto} alt={roommate.user.name} className="w-full h-full object-cover" />
                          ) : (
                            roommate.user?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xl font-bold text-gray-900">{maskName(roommate.user?.name) || 'User'}</h3>
                            {roommate.user?.isVerified === true && (
                              <div className="group relative flex items-center">
                                <BadgeCheck size={20} className="text-blue-500 fill-blue-50" />
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">ID Verified</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <span className="text-gray-500 text-xs font-semibold">
                              {roommate.user?.role === 'OWNER' ? 'Property Owner' : 'Tenant'}
                            </span>
                            {roommate.preferences?.find(p => ['1BHK', '2BHK', '3BHK', '4BHK+', '1RK'].includes(p)) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm shadow-blue-100/50 uppercase">
                                🏢 {roommate.preferences.find(p => ['1BHK', '2BHK', '3BHK', '4BHK+', '1RK'].includes(p))}
                              </span>
                            )}
                            {(roommate.gender || roommate.user?.gender) && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-sm flex items-center gap-0.5 ${
                                (roommate.gender || roommate.user?.gender).toLowerCase() === 'male' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50' :
                                (roommate.gender || roommate.user?.gender).toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-pink-100/50' :
                                'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50'
                              }`}>
                                👤 {(roommate.gender || roommate.user?.gender)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Delete own post */}
                      {isOwner && (
                        <button onClick={() => handleDeletePost(roommate.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Found Roommate (Close Post)">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* 🟢 Match Score Badge */}
                    {matchScore !== null && (
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm border z-10 ${
                        matchScore >= 75 ? 'bg-green-100 text-green-700 border-green-200' :
                        matchScore >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {matchScore}% Match
                      </div>
                    )}

                    {/* Image Carousel */}
                    {roommate.images && roommate.images.length > 0 && (
                      <div className="relative h-48 w-full mb-4 rounded-xl overflow-hidden group bg-gray-100 border border-gray-200">
                        <img 
                          src={roommate.images[activeImageIndexes[roommate.id] || 0]} 
                          alt="Room" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {roommate.images.length > 1 && (
                          <>
                            <button 
                              onClick={() => prevImage(roommate.id, roommate.images.length - 1)}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button 
                              onClick={() => nextImage(roommate.id, roommate.images.length - 1)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight size={18} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {(activeImageIndexes[roommate.id] || 0) + 1} / {roommate.images.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* 🟢 Split Rent Badge */}
                    {splitRent && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-medium">💰 Split Rent Among {roommate.totalCapacity} Members</p>
                          <p className="text-lg font-extrabold text-green-700">₹{splitRent.toLocaleString('en-IN')}<span className="text-sm font-medium"> / person / mo</span></p>
                          {splitDeposit && <p className="text-xs text-green-600 mt-0.5">Deposit: ₹{splitDeposit.toLocaleString('en-IN')} / person</p>}
                        </div>
                        <Users size={24} className="text-green-400 flex-shrink-0" />
                      </div>
                    )}
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start">
                        <MapPin size={18} className="text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-500 block">Looking in</span>
                          <span className="font-medium text-gray-800">{roommate.location}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <IndianRupee size={18} className="text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-500 block">Total Rent {roommate.maintenanceIncluded ? '(Inc. Maintenance)' : '(Plus Maintenance)'}</span>
                          <span className="font-medium text-gray-800">₹{displayBudget}</span>
                        </div>
                      </div>
                      {roommate.deposit > 0 && (
                        <div className="flex items-start">
                          <IndianRupee size={18} className="text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-500 block">Total Deposit</span>
                            <span className="font-medium text-gray-800">₹{displayDeposit}</span>
                          </div>
                        </div>
                      )}
                      {roommate.vacancies != null && roommate.totalCapacity != null && (
                        <div className="flex items-start">
                          <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            {roommate.vacancies} Vacanc{roommate.vacancies === 1 ? 'y' : 'ies'} of {roommate.totalCapacity} Total
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <span className="text-xs text-gray-500 block mb-2">Preferences & Lifestyle</span>
                      <div className="flex flex-wrap gap-2">
                        {roommate.availableFrom && <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 flex items-center gap-1 font-medium">⏱ Move-in: {roommate.availableFrom}</span>}
                        {roommate.targetOccupation && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">Prefers {roommate.targetOccupation}</span>}
                        {roommate.targetGender && roommate.targetGender !== 'Any' && <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200">Prefers {roommate.targetGender}</span>}
                        {roommate.agePreference && <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">Age: {roommate.agePreference}</span>}
                        {roommate.dietaryPref && roommate.dietaryPref !== 'Any' && <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">{roommate.dietaryPref}</span>}
                        {roommate.smokingPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.smokingPref}</span>}
                        {roommate.drinkingPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.drinkingPref}</span>}
                        {roommate.petsPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.petsPref}</span>}
                        {roommate.sleepSchedule && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.sleepSchedule}</span>}
                        {roommate.cleanlinessLevel && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.cleanlinessLevel} Clean</span>}
                        {roommate.preferences?.filter(p => !['1BHK', '2BHK', '3BHK', '4BHK+', '1RK'].includes(p)).map((pref, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Specifications Section */}
                    {(roommate.facing || roommate.areaSqft) && (
                      <div className="mb-4 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 block mb-2">Property Specifications</span>
                        <div className="flex gap-2">
                          {roommate.facing && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200 flex items-center gap-1 font-medium">
                              🧭 Facing: {roommate.facing}
                            </span>
                          )}
                          {roommate.areaSqft && (
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200 flex items-center gap-1 font-medium">
                              📏 Size: {roommate.areaSqft} Sq. Ft.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Utility & Maintenance Inclusions badges */}
                    <div className="mb-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 block mb-2">Utility Inclusions</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Electricity', value: roommate.electricityBill || 'Not Included', icon: '⚡' },
                          { label: 'Water', value: roommate.waterSupply || 'Not Included', icon: '💧' },
                          { label: 'Maint.', value: roommate.maintenance || 'Not Included', icon: '🛠️' }
                        ].map((util, idx) => (
                          <div key={idx} className="flex flex-col items-center p-1.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                            <span className="text-sm mb-0.5">{util.icon}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">{util.label}</span>
                            <span className={`text-[10px] font-black leading-none ${util.value === 'Included' ? 'text-green-600' : 'text-amber-600'}`}>
                              {util.value === 'Included' ? 'Included' : 'Not Incl.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isOwner && (
                      <button 
                        onClick={() => {
                          if (!isAuthenticated) {
                            showModal({ type: 'alert', title: 'Sign In Required', message: 'Please log in to message this user.', onConfirm: () => navigate('/auth') });
                            return;
                          }
                          navigate(`/messages?user=${roommate.user?.id}&text=${encodeURIComponent(`Hi ${maskName(roommate.user?.name) || ''}, I saw your roommate posting for ${roommate.location} and I'm interested in joining!`)}`);
                        }}
                        className="w-full bg-primary-50 text-primary-700 hover:bg-primary-100 py-3 rounded-xl font-medium flex items-center justify-center transition-colors mt-4"
                      >
                        <MessageCircle size={18} className="mr-2" />
                        Message to Join
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            )}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchRoommates(nextPage, true);
                  }}
                  disabled={loading}
                  className="bg-white border-2 border-primary-100 text-primary-700 px-8 py-3 rounded-xl font-bold hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Roommates'}
                </button>
              </div>
            )}
            </div>
          )}

        </div>
      </div>
      
      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-gray-900/20" style={{animation: 'slideUp 0.3s ease-out'}}>
            
            {/* Premium Gradient Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 px-6 py-5 flex justify-between items-start flex-shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-20 w-20 h-20 bg-white/5 rounded-full translate-y-8"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users size={14} className="text-white" />
                  </div>
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Roommate Finder</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Post a Request</h2>
                <p className="text-white/70 text-sm mt-0.5">Find your perfect flatmate in minutes</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* Live Split Rent Preview */}
                {postFormData.budget && postFormData.totalCapacity > 1 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Per person estimate</p>
                      <p className="text-green-800 font-bold text-lg">₹{Math.round(parseFloat(postFormData.budget) / parseInt(postFormData.totalCapacity)).toLocaleString('en-IN')}<span className="text-sm font-normal">/mo</span></p>
                    </div>
                  </div>
                )}

                {/* Section: Location */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center"><MapPin size={12} className="text-primary-600" /></div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Location</h3>
                  </div>

                  {/* Building / Society Name */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Building / Society Name</label>
                    <input
                      type="text" value={postFormData.buildingName}
                      onChange={(e) => setPostFormData({...postFormData, buildingName: e.target.value})}
                      placeholder="e.g. Maple Heights, Sai Residency"
                      className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Area Name */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Area / Locality Name <span className="text-red-400">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text" value={postFormData.areaName}
                          onChange={(e) => setPostFormData({...postFormData, areaName: e.target.value})}
                          onBlur={(e) => geocodeAndSetPostLocation(`${e.target.value}, ${postFormData.villageCityTown || 'Pune'}`)}
                          placeholder="e.g. Hinjewadi, Kothrud, Wakad"
                          className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <button type="button" onClick={handlePostLiveLocation}
                        className="px-4 bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200 rounded-xl flex items-center justify-center transition-colors" title="Use my location">
                        <Navigation size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Village/City & Taluka */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Village / City / Town <span className="text-red-400">*</span></label>
                      <input
                        type="text" value={postFormData.villageCityTown}
                        onChange={(e) => setPostFormData({...postFormData, villageCityTown: e.target.value})}
                        placeholder="e.g. Pune"
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Taluka</label>
                      <input
                        type="text" value={postFormData.taluka}
                        onChange={(e) => setPostFormData({...postFormData, taluka: e.target.value})}
                        placeholder="e.g. Haveli"
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* District & Pincode */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">District <span className="text-red-400">*</span></label>
                      <input
                        type="text" value={postFormData.district}
                        onChange={(e) => setPostFormData({...postFormData, district: e.target.value})}
                        placeholder="e.g. Pune"
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Pincode <span className="text-red-400">*</span></label>
                      <input
                        type="text" value={postFormData.pincode}
                        onChange={(e) => setPostFormData({...postFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                        placeholder="e.g. 411057"
                        maxLength={6}
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Embedded Post Map */}
                <div className="mt-4 h-[220px] w-full rounded-xl overflow-hidden border-2 border-primary-200 relative z-0">
                  {/* Map Search Overlay */}
                  <div className="absolute top-2 left-2 right-2 z-[500] rounded-xl p-1 flex items-center bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg">
                    <div className="pl-2 pr-1.5 text-gray-400">
                      <MapPin size={14} className="text-primary-500" />
                    </div>
                    <input
                      type="text"
                      value={modalMapSearchQuery}
                      onChange={(e) => setModalMapSearchQuery(e.target.value)}
                      placeholder="Search exact area / building on map..."
                      className="w-full outline-none text-[11px] bg-transparent font-medium text-gray-800 placeholder-gray-400 py-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleModalMapSearch(e);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleModalMapSearch}
                      className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center transition-colors active:scale-95 ml-1 flex-shrink-0"
                    >
                      Search
                    </button>
                  </div>
                  
                  <MapContainer center={mapCenter} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <CustomZoomControl />
                    <MapUpdater center={mapCenter} />
                    <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution='&copy; Google Maps' />
                    <Marker 
                       position={postFormData.latitude && postFormData.longitude ? [postFormData.latitude, postFormData.longitude] : mapCenter} 
                       icon={createCustomIcon('Room')}
                    />
                    <ModalLocationPicker />
                  </MapContainer>
                  
                  <div className="absolute bottom-2 left-2 z-[500] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black text-primary-700 shadow-md border border-primary-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    Roommate Request
                  </div>
                  <div className="absolute bottom-2 right-14 z-[500] bg-white/95 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-gray-500 shadow-md border border-gray-100">
                    Click Map to Pick Pin
                  </div>
                </div>

                {/* Section: Property */}
                <div className="space-y-4">
                  {/* Configuration/Flat Size Select Option */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                      Flat Size / Room Configuration
                    </label>
                    <select
                      value={postFormData.flatSize}
                      onChange={(e) => setPostFormData({...postFormData, flatSize: e.target.value})}
                      className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none bg-white font-semibold text-gray-700"
                    >
                      <option value="1BHK">1 BHK (1 Bed, Hall, Kitchen)</option>
                      <option value="2BHK">2 BHK (2 Bed, Hall, Kitchen)</option>
                      <option value="3BHK">3 BHK (3 Bed, Hall, Kitchen)</option>
                      <option value="4BHK+">4 BHK+ (4+ Bed, Hall, Kitchen)</option>
                      <option value="1RK">1 RK (1 Room, Kitchen)</option>
                    </select>
                  </div>
                </div>

                {/* Utility & Maintenance Inclusions */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                    Utility & Maintenance Inclusions
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Electricity</label>
                      <select value={postFormData.electricityBill} onChange={(e) => setPostFormData({ ...postFormData, electricityBill: e.target.value })} className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary-500 outline-none bg-white">
                        <option value="Not Included">Not Incl.</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Water Supply</label>
                      <select value={postFormData.waterSupply} onChange={(e) => setPostFormData({ ...postFormData, waterSupply: e.target.value })} className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary-500 outline-none bg-white">
                        <option value="Not Included">Not Incl.</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Maintenance</label>
                      <select value={postFormData.maintenance} onChange={(e) => setPostFormData({ ...postFormData, maintenance: e.target.value })} className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary-500 outline-none bg-white">
                        <option value="Not Included">Not Incl.</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Budget */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center"><IndianRupee size={12} className="text-green-600" /></div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Budget & Capacity</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Total Rent</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="number" value={postFormData.budget}
                          onChange={(e) => setPostFormData({...postFormData, budget: e.target.value})}
                          placeholder="15000"
                          className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Deposit</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="number" value={postFormData.deposit}
                          onChange={(e) => setPostFormData({...postFormData, deposit: e.target.value})}
                          placeholder="50000"
                          className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vacancies</label>
                      <input type="number" min="1" value={postFormData.vacancies}
                        onChange={(e) => setPostFormData({...postFormData, vacancies: e.target.value})}
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Total Capacity</label>
                      <input type="number" min="1" value={postFormData.totalCapacity}
                        onChange={(e) => setPostFormData({...postFormData, totalCapacity: e.target.value})}
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* Section: Optional Specifications (Facing & Area) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">📐</div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Specifications <span className="text-xs text-gray-400 normal-case font-medium">(Optional)</span></h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Facing Direction</label>
                      <select value={postFormData.facing} onChange={(e) => setPostFormData({...postFormData, facing: e.target.value})} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none bg-white">
                        <option value="">Select Direction</option>
                        {['East', 'North', 'South', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(dir => (
                          <option key={dir} value={dir}>{dir}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Area (Sq. Ft.)</label>
                      <input type="number" min="1" value={postFormData.areaSqft} onChange={(e) => setPostFormData({...postFormData, areaSqft: e.target.value})} placeholder="e.g. 1000" className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* Section: Your Profile */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">👤</div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your Profile</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Your Gender <span className="text-red-400">*</span></label>
                    <select 
                      value={postFormData.gender} 
                      onChange={(e) => setPostFormData({...postFormData, gender: e.target.value})} 
                      className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                    >
                      <option value="">Select Your Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Section: Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center"><Briefcase size={12} className="text-purple-600" /></div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Preferences</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select value={postFormData.targetGender} onChange={(e) => setPostFormData({...postFormData, targetGender: e.target.value})} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Any">Any Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <select value={postFormData.dietaryPref} onChange={(e) => setPostFormData({...postFormData, dietaryPref: e.target.value})} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Any">Any Diet</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                    </select>
                    <select value={postFormData.smokingPref} onChange={(e) => setPostFormData({...postFormData, smokingPref: e.target.value})} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Non-Smoking">Non-Smoking</option>
                      <option value="Smoking Okay">Smoking Okay</option>
                    </select>
                    <select value={postFormData.drinkingPref} onChange={(e) => setPostFormData({...postFormData, drinkingPref: e.target.value})} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Non-Drinking">Non-Drinking</option>
                      <option value="Drinking Okay">Drinking Okay</option>
                    </select>
                  </div>
                  <input type="text" value={postFormData.preferences}
                    onChange={(e) => setPostFormData({...postFormData, preferences: e.target.value})}
                    placeholder="Other Tags (e.g. IT Professional, Night Shift)"
                    className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>

                {/* Section: Photos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center"><ImageIcon size={12} className="text-orange-600" /></div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Photos <span className="text-xs text-gray-400 normal-case font-medium">(Max 3)</span></h3>
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                      </div>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                  {postFormData.images && postFormData.images.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {postFormData.images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                          <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPostFormData({...postFormData, images: postFormData.images.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"><X size={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className={`flex-1 py-3 px-4 text-white rounded-xl font-bold transition-colors shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 ${submitting ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Modal {...modalConfig} onCancel={closeModal} />
    </>
  );
};

export default RoommatesPage;
