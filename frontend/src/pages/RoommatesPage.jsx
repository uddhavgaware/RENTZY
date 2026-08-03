import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, IndianRupee, MessageCircle, Plus, Minus, X, Users, Trash2, Info, BadgeCheck, Navigation, ChevronLeft, ChevronRight, Image as ImageIcon, Map as MapIcon, List, Home, Building2, Edit3, Eye, Check, Sparkles, Share2, Maximize2, Minimize2 } from 'lucide-react';
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
import { calculateDistance, geocodeAddress } from '../utils/distanceUtils';
import geminiService from '../services/geminiService';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const RoommatesPage = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
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

  // Smart Commute / Proximity Algo Filter
  const [commuteRefName, setCommuteRefName] = useState('');
  const [commuteCoords, setCommuteCoords] = useState(null);
  const [maxDistance, setMaxDistance] = useState('');
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
      showModal({ type: 'alert', title: 'Location Not Found', message: `Could not find geographical coordinates for "${target}". Please try specifying the city or area.`, onConfirm: closeModal });
    }
  };

  const [preferencesForm, setPreferencesForm] = useState({
    dietaryPref: user?.dietaryPref || 'Any',
    smokingPref: user?.smokingPref || 'Any',
    drinkingPref: user?.drinkingPref || 'Any',
    sleepSchedule: user?.sleepSchedule || 'Any',
    cleanlinessLevel: user?.cleanlinessLevel || 'Any'
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Re-sync local form state when user object updates
  useEffect(() => {
    if (user) {
      setPreferencesForm({
        dietaryPref: user.dietaryPref || 'Any',
        smokingPref: user.smokingPref || 'Any',
        drinkingPref: user.drinkingPref || 'Any',
        sleepSchedule: user.sleepSchedule || 'Any',
        cleanlinessLevel: user.cleanlinessLevel || 'Any'
      });
    }
  }, [user]);

  const hasPreferences = user?.dietaryPref && user?.dietaryPref !== 'Any';
  const [showPreferencesSetup, setShowPreferencesSetup] = useState(false);

  useEffect(() => {
    if (activeTab === 'smartMatch' && !hasPreferences) {
      setShowPreferencesSetup(true);
    }
  }, [activeTab, hasPreferences]);

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
    } catch (err) { }
  };

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const [expandedCardId, setExpandedCardId] = useState(null);
  const toggleExpandCard = (id) => setExpandedCardId(prev => prev === id ? null : id);

  const [lightboxState, setLightboxState] = useState({ isOpen: false, images: [], index: 0 });

  const openLightbox = (images, index = 0) => {
    if (!images || images.length === 0) return;
    setLightboxState({ isOpen: true, images, index });
  };

  const closeLightbox = () => {
    setLightboxState({ isOpen: false, images: [], index: 0 });
  };

  const nextLightboxImage = () => {
    setLightboxState(prev => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length
    }));
  };

  const prevLightboxImage = () => {
    setLightboxState(prev => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length
    }));
  };

  useEffect(() => {
    if (!lightboxState.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen]);

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
        setPostFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
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
          setPostFormData(prev => ({ ...prev, location: neighborhood, latitude, longitude }));
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

  const [aiSuggestingRoommate, setAiSuggestingRoommate] = useState(false);
  const [aiRoommateSuggestions, setAiRoommateSuggestions] = useState(null);

  const handleGetRoommateSuggestions = async () => {
    setAiSuggestingRoommate(true);
    try {
      const suggestions = await geminiService.suggestRoommateDetails(postFormData);
      setAiRoommateSuggestions(suggestions);
    } catch (err) {
      console.error('Failed roommate suggestions', err);
    } finally {
      setAiSuggestingRoommate(false);
    }
  };

  const [cardMatches, setCardMatches] = useState({});
  const [analyzingCardId, setAnalyzingCardId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [selectedDetailRoommate, setSelectedDetailRoommate] = useState(null);

  const handleEditPost = (roommate) => {
    setEditingPostId(roommate.id);
    setPostFormData({
      location: roommate.location || '',
      buildingName: '',
      areaName: roommate.location || '',
      villageCityTown: '',
      taluka: '',
      district: '',
      pincode: '',
      budget: roommate.budget || '',
      deposit: roommate.deposit || '',
      preferences: roommate.preferences ? roommate.preferences.join(', ') : '',
      vacancies: roommate.vacancies || 1,
      totalCapacity: roommate.totalCapacity || 2,
      targetOccupation: roommate.targetOccupation || 'Any',
      targetGender: roommate.targetGender || 'Any',
      maintenanceIncluded: roommate.maintenanceIncluded || false,
      availableFrom: roommate.availableFrom || 'Immediately',
      agePreference: roommate.agePreference || '',
      dietaryPref: roommate.dietaryPref || 'Any',
      smokingPref: roommate.smokingPref || 'Non-Smoking',
      drinkingPref: roommate.drinkingPref || 'Non-Drinking',
      petsPref: roommate.petsPref || 'No Pets',
      sleepSchedule: roommate.sleepSchedule || 'Flexible',
      cleanlinessLevel: roommate.cleanlinessLevel || 'Moderate',
      images: roommate.images || [],
      latitude: roommate.latitude || null,
      longitude: roommate.longitude || null,
      propertyType: roommate.propertyType || 'Room',
      electricityBill: roommate.electricityBill || 'Not Included',
      waterSupply: roommate.waterSupply || 'Not Included',
      maintenance: roommate.maintenance || 'Not Included',
      facing: roommate.facing || '',
      areaSqft: roommate.areaSqft || '',
      gender: roommate.gender || roommate.user?.gender || '',
      flatSize: roommate.preferences?.find(p => ['1BHK', '2BHK', '3BHK', '4BHK+', '1RK'].includes(p)) || '1BHK',
    });
    setIsModalOpen(true);
  };

  const handleSharePost = async (roommate) => {
    const url = `${window.location.origin}/roommates?id=${roommate.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Roommate/Room listing in ${roommate.location}`,
          text: `Check out this listing in ${roommate.location} for ₹${roommate.budget}/mo on RentXY!`,
          url: url
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      showModal({ type: 'alert', title: 'Link Copied', message: 'Share link copied to clipboard!', onConfirm: closeModal });
    }
  };

  const handleAnalyzeCardMatch = async (roommate) => {
    setAnalyzingCardId(roommate.id);
    try {
      const result = await geminiService.analyzeRoommateMatch(user || {}, roommate);
      setCardMatches(prev => ({ ...prev, [roommate.id]: result }));
    } catch (err) {
      console.error('Match analysis failed', err);
    } finally {
      setAnalyzingCardId(null);
    }
  };

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
      setPostFormData({ ...postFormData, images: newImages });
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
    if (postFormData.budget === '' || postFormData.budget === null || postFormData.budget === undefined) {
      showModal({ type: 'alert', title: 'Missing Room Rent', message: 'Please specify the total room rent / budget.', onConfirm: closeModal });
      return;
    }
    if (postFormData.deposit === '' || postFormData.deposit === null || postFormData.deposit === undefined) {
      showModal({ type: 'alert', title: 'Missing Deposit', message: 'Please specify the deposit amount. Enter 0 if none.', onConfirm: closeModal });
      return;
    }
    if (!postFormData.gender) {
      showModal({ type: 'alert', title: 'Missing Gender', message: 'Please select your gender from the dropdown in the form.', onConfirm: closeModal });
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
      if (editingPostId) {
        await api.put(`/roommates/${editingPostId}`, payload);
      } else {
        await api.post('/roommates', payload);
      }
      setIsPosting(false);
      setIsModalOpen(false);
      const wasEditing = !!editingPostId;
      setEditingPostId(null);
      setPostFormData({ location: '', buildingName: '', areaName: '', villageCityTown: '', taluka: '', district: '', pincode: '', budget: '', deposit: '', preferences: '', vacancies: 1, totalCapacity: 2, images: [], latitude: null, longitude: null, propertyType: 'Room', electricityBill: 'Not Included', waterSupply: 'Not Included', maintenance: 'Not Included', facing: '', areaSqft: '', gender: '', flatSize: '1BHK' });

      showModal({
        type: 'alert',
        title: 'Success',
        message: wasEditing ? 'Roommate request updated successfully!' : 'Roommate request posted successfully!',
        onConfirm: () => {
          fetchRoommates(0, false);
          closeModal();
        }
      });

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
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post permanently?',
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

  const handleGotAMate = (id) => {
    showModal({
      type: 'confirm',
      title: 'Got a Mate',
      message: 'Have you found a roommate? This will mark your post as fulfilled and remove it from search results.',
      onConfirm: async () => {
        closeModal();
        try {
          await api.put(`/roommates/${id}/status?status=FULFILLED`);
          setRoommates(prev => prev.filter(r => r.id !== id));
          showModal({ type: 'alert', title: 'Success', message: 'Congratulations! Your post has been marked as fulfilled.', onConfirm: closeModal });
        } catch {
          showModal({ type: 'alert', title: 'Error', message: 'Failed to update post status.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  const handleSendRequest = async (id) => {
    if (!isAuthenticated) {
      showModal({ type: 'alert', title: 'Login Required', message: 'You must be logged in to send a request.', onConfirm: closeModal });
      return;
    }
    try {
      await api.post(`/roommates/requests/${id}`);
      showModal({ type: 'alert', title: 'Success', message: 'Roommate request sent successfully!', onConfirm: closeModal });
    } catch (error) {
      const errorMsg = error.response?.data?.message || typeof error.response?.data === 'string' ? error.response.data : 'Failed to send request';
      showModal({ type: 'alert', title: 'Error', message: errorMsg, onConfirm: closeModal });
    }
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
    setEditingPostId(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && user?.gender) {
      setPostFormData(prev => ({ ...prev, gender: user.gender }));
    }
  }, [isModalOpen, user]);
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    try {
      await api.put('/users/me', preferencesForm);
      await refreshUser();
      setShowPreferencesSetup(false);
      fetchRoommates(0, false);
      import('react-hot-toast').then(({ toast }) => toast.success('Preferences saved! finding matches...'));
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to save preferences.', onConfirm: closeModal });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const displayedRoommates = roommates.map(r => {
    if (commuteCoords && r.latitude && r.longitude) {
      const dist = calculateDistance(commuteCoords.lat, commuteCoords.lon, r.latitude, r.longitude);
      return { ...r, computedDistance: dist };
    }
    return { ...r, computedDistance: null };
  }).filter(r => {
    if (activeTab === 'girls') {
      const g = (r.gender || r.user?.gender || '').toLowerCase();
      const tg = (r.targetGender || '').toLowerCase();
      if (!(g === 'female' || g === 'girl' || g === 'woman' || tg === 'female' || tg === 'girl' || tg === 'woman')) return false;
    }
    if (activeTab === 'boys') {
      const g = (r.gender || r.user?.gender || '').toLowerCase();
      const tg = (r.targetGender || '').toLowerCase();
      if (!(g === 'male' || g === 'boy' || g === 'man' || tg === 'male' || tg === 'boy' || tg === 'man')) return false;
    }
    if (commuteCoords && maxDistance) {
      const maxKm = parseFloat(maxDistance);
      if (r.computedDistance == null || r.computedDistance > maxKm) return false;
    }
    return true;
  });

  if (sortByDistance && commuteCoords) {
    displayedRoommates.sort((a, b) => (a.computedDistance ?? 999999) - (b.computedDistance ?? 999999));
  }

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
            <div className="flex gap-4">
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
              <button
                onClick={() => setActiveTab('girls')}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'girls' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200'}`}
              >
                👩 Girls Section (Women Only)
              </button>
              <button
                onClick={() => setActiveTab('boys')}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'boys' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'}`}
              >
                👨 Boys Section (Men Only)
              </button>
            </div>

            {/* Edit Preferences Button when on Smart Match tab */}
            {activeTab === 'smartMatch' && hasPreferences && !showPreferencesSetup && (
              <button
                onClick={() => setShowPreferencesSetup(true)}
                className="px-4 py-2 text-sm font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors whitespace-nowrap"
              >
                Edit Preferences
              </button>
            )}
          </div>

          {/* Smart Proximity & Commute Distance Filter */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-blue-50/90 border border-indigo-200/80 rounded-2xl p-4 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Navigation size={16} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-indigo-950">📍 Smart Commute & Proximity Algorithm</h4>
                  <p className="text-[11px] text-indigo-700/80 font-medium">Find roommates & flatmates near your College or Workplace</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {user?.collegeName && (
                  <button
                    type="button"
                    onClick={() => handleSetCommuteRef(user.collegeName)}
                    className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold px-3 py-1.5 rounded-xl transition-all border border-indigo-200 flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    🎓 College: {user.collegeName}
                  </button>
                )}
                {user?.companyName && (
                  <button
                    type="button"
                    onClick={() => handleSetCommuteRef(user.companyName)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-3 py-1.5 rounded-xl transition-all border border-purple-200 flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    🏢 Workplace: {user.companyName}
                  </button>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 shadow-sm ml-1">
                  <input
                    type="checkbox"
                    checked={sortByDistance}
                    onChange={(e) => setSortByDistance(e.target.checked)}
                    disabled={!commuteCoords}
                    className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                  />
                  Sort by Nearest
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-2 flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                  <input
                    type="text"
                    value={commuteRefName}
                    onChange={(e) => setCommuteRefName(e.target.value)}
                    placeholder="Type College, Office, Tech Park, or Landmark (e.g. COEP Pune, MIT WPU, Infosys Hinjewadi)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner text-gray-800"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetCommuteRef(); }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSetCommuteRef()}
                  disabled={isGeocoding}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
                >
                  {isGeocoding ? 'Locating...' : 'Set Landmark'}
                </button>
              </div>

              <div>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  disabled={!commuteCoords}
                  className="w-full py-2.5 px-3 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
                >
                  <option value="">Any Commute Distance</option>
                  <option value="1">Within 1 km radius</option>
                  <option value="2">Within 2 km radius</option>
                  <option value="5">Within 5 km radius</option>
                  <option value="10">Within 10 km radius</option>
                  <option value="15">Within 15 km radius</option>
                  <option value="25">Within 25 km radius</option>
                </select>
              </div>
            </div>

            {commuteCoords && (
              <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <span className="truncate">✓ Locked: {commuteCoords.displayName?.split(',').slice(0, 2).join(',') || commuteRefName} ({commuteCoords.lat.toFixed(4)}, {commuteCoords.lon.toFixed(4)})</span>
                <button onClick={() => { setCommuteCoords(null); setCommuteRefName(''); setMaxDistance(''); setSortByDistance(false); }} className="text-red-600 hover:text-red-800 font-bold ml-2 underline flex-shrink-0">Clear</button>
              </div>
            )}
          </div>

          {/* Roommates Grid / Preferences Setup */}
          {activeTab === 'smartMatch' && showPreferencesSetup ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12 animate-scaleIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Set Your Preferences</h2>
                <p className="text-gray-500 mt-2">Tell us about your lifestyle so we can find your perfect roommate matches.</p>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dietary Preference</label>
                    <select value={preferencesForm.dietaryPref} onChange={e => setPreferencesForm({ ...preferencesForm, dietaryPref: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="Any">Any</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Smoking Preference</label>
                    <select value={preferencesForm.smokingPref} onChange={e => setPreferencesForm({ ...preferencesForm, smokingPref: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="Any">Any</option>
                      <option value="Non-Smoker">Non-Smoker</option>
                      <option value="Smoker">Smoker</option>
                      <option value="Outside Only">Outside Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Drinking Preference</label>
                    <select value={preferencesForm.drinkingPref} onChange={e => setPreferencesForm({ ...preferencesForm, drinkingPref: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="Any">Any</option>
                      <option value="Non-Drinker">Non-Drinker</option>
                      <option value="Occasional">Occasional</option>
                      <option value="Regular">Regular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Sleep Schedule</label>
                    <select value={preferencesForm.sleepSchedule} onChange={e => setPreferencesForm({ ...preferencesForm, sleepSchedule: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="Any">Any</option>
                      <option value="Early Bird">Early Bird (Sleeps Early)</option>
                      <option value="Night Owl">Night Owl (Sleeps Late)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cleanliness Level</label>
                    <select value={preferencesForm.cleanlinessLevel} onChange={e => setPreferencesForm({ ...preferencesForm, cleanlinessLevel: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="Any">Any</option>
                      <option value="Very Clean">Very Clean (Cleans daily)</option>
                      <option value="Average">Average (Cleans weekly)</option>
                      <option value="Messy">Messy (Doesn't mind clutter)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  {hasPreferences && (
                    <button type="button" onClick={() => setShowPreferencesSetup(false)} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex-1 transition-colors">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={isSavingPreferences} className={`px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-colors ${hasPreferences ? 'flex-1' : 'w-full'}`}>
                    {isSavingPreferences ? 'Saving...' : 'Find Matches 🎯'}
                  </button>
                </div>
              </form>
            </div>
          ) : loading && displayedRoommates.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : displayedRoommates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No roommate requests found in this section. {activeTab === 'all' && "Be the first to post!"}
            </div>
          ) : (
            <div className={`relative ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
              {activeTab === 'girls' && (
                <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent border border-pink-500/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 text-2xl flex-shrink-0">
                      👩
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">Girls & Women Roommate Community</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Verified female profiles & women-only shared housing opportunities. Safe, comfortable, and direct.</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 text-xs font-bold whitespace-nowrap border border-pink-200 dark:border-pink-800/50">
                    🛡️ Verified Women Profiles
                  </span>
                </div>
              )}
              {activeTab === 'boys' && (
                <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 text-2xl flex-shrink-0">
                      👨
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">Boys & Men Roommate Community</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Verified male profiles & bachelor shared housing opportunities across India.</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold whitespace-nowrap border border-blue-200 dark:border-blue-800/50">
                    🛡️ Verified Men Profiles
                  </span>
                </div>
              )}
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
                    {displayedRoommates.map(roommate => {
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
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${(roommate.gender || roommate.user?.gender).toLowerCase() === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
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
                              
                              <div className="text-primary-700 font-bold mb-1 text-lg">₹{roommate.budget}/mo</div>
                              {roommate.deposit > 0 && <div className="text-gray-600 font-medium text-xs mb-3">Dep: ₹{roommate.deposit}</div>}
                              
                              {roommate.totalCapacity > 1 && (
                                <div className="bg-green-50 border border-green-200 text-green-700 p-2 rounded-lg text-xs font-bold mb-2">
                                  💰 Split: ₹{Math.round(roommate.budget / roommate.totalCapacity)}/mo
                                  {roommate.deposit > 0 && <br />}
                                  {roommate.deposit > 0 && `Dep: ₹${Math.round(roommate.deposit / roommate.totalCapacity)} / person`}
                                </div>
                              )}

                              <div className="flex flex-col gap-2">
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  const lat = roommate.locationCoordinates?.lat || roommate.latitude;
                                  const lng = roommate.locationCoordinates?.lng || roommate.longitude;
                                  const query = lat && lng
                                    ? `${lat},${lng}`
                                    : encodeURIComponent(roommate.location || '');
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                }} className="w-full bg-indigo-50 border border-indigo-200 text-indigo-700 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-1">
                                  <MapIcon size={12} /> Open in Google Maps
                                </button>
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
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </MapContainer>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedRoommates.map(roommate => {
                    const isPostCreator = user?.email && roommate.user?.email && user.email.toLowerCase() === roommate.user.email.toLowerCase();
                    const isAdminOrCreator = isPostCreator || user?.role === 'ADMIN';
                    const myPost = roommates.find(r => r.user?.email && user?.email && r.user.email.toLowerCase() === user.email.toLowerCase());

                    let matchScore = roommate.matchPercentage != null ? roommate.matchPercentage : null;
                    if (matchScore === null && !isPostCreator && myPost) {
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

                    const isExpanded = expandedCardId === roommate.id;

                    return (
                      <div
                        id={`roommate-card-${roommate.id}`}
                        key={roommate.id}
                        className={`glass-card bg-white/95 dark:bg-slate-800/95 rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group ${
                          isExpanded ? 'ring-2 ring-primary-500/50 shadow-2xl col-span-1 md:col-span-2 bg-white dark:bg-slate-900' : ''
                        }`}
                      >
                        {/* Top: Header & User Info */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                onClick={() => {
                                  if (roommate.images?.length) openLightbox(roommate.images, 0);
                                  else if (roommate.user?.profilePhoto) openLightbox([roommate.user.profilePhoto], 0);
                                }}
                                className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-xl flex items-center justify-center font-bold text-base border border-white shadow-sm overflow-hidden flex-shrink-0 cursor-pointer"
                              >
                                {roommate.images && roommate.images.length > 0 ? (
                                  <img src={roommate.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : roommate.user?.profilePhoto ? (
                                  <img src={roommate.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  roommate.user?.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate flex items-center gap-1">
                                  {maskName(roommate.user?.name) || 'User'}
                                  {roommate.user?.isVerified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />}
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{roommate.propertyType || 'Room'} • {roommate.gender || 'Any'}</p>
                              </div>
                            </div>
                            {matchScore !== null && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex-shrink-0 ${
                                matchScore >= 75 ? 'bg-green-100 text-green-700 border-green-200' :
                                matchScore >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-red-100 text-red-700 border-red-200'
                              }`}>
                                {matchScore}%
                              </span>
                            )}
                          </div>

                          {/* Location */}
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 truncate mt-1">
                              <MapPin size={14} className="text-primary-500 mr-1 flex-shrink-0" />
                              <span className="truncate">{roommate.location}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSharePost(roommate); }}
                                className="flex items-center gap-1 text-[10px] font-bold bg-white hover:bg-gray-50 text-gray-700 px-2 py-1 rounded-md transition-all border border-gray-200 cursor-pointer shadow-sm active:scale-95 w-full justify-center"
                              >
                                <Share2 size={12} /> Share
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const lat = roommate.locationCoordinates?.lat || roommate.latitude;
                                  const lng = roommate.locationCoordinates?.lng || roommate.longitude;
                                  const query = lat && lng
                                    ? `${lat},${lng}`
                                    : encodeURIComponent(roommate.location || '');
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-1 rounded-md transition-all border border-primary-100 cursor-pointer shadow-sm active:scale-95 w-full justify-center"
                              >
                                <MapIcon size={12} /> View in Maps
                              </button>
                            </div>
                          </div>

                          {/* Split Rent Badge - Green Card like Mobile */}
                          {splitRent ? (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-xl p-3 mb-3">
                              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mb-1">💰 Split Rent Among {roommate.totalCapacity} Members</p>
                              <div className="flex items-end justify-between">
                                <div>
                                  <span className="text-lg font-extrabold text-green-700 dark:text-green-300">₹{splitRent.toLocaleString('en-IN')}</span>
                                  <span className="text-[11px] text-green-600 dark:text-green-400 font-medium"> / person / mo</span>
                                </div>
                                <Users size={22} className="text-green-400 flex-shrink-0" />
                              </div>
                              {splitDeposit && <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5 font-semibold">Deposit: ₹{splitDeposit.toLocaleString('en-IN')} / person</p>}
                            </div>
                          ) : (
                            <div className="bg-primary-50/70 dark:bg-slate-700/50 p-2.5 rounded-xl mb-3 border border-primary-100/50 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-bold uppercase text-primary-600 dark:text-primary-300 block">Total Rent</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">₹{displayBudget}<span className="text-[10px] font-normal text-gray-500">/mo</span></span>
                              </div>
                            </div>
                          )}

                          {/* Quick Badges (When Collapsed) */}
                          {!isExpanded && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {roommate.vacancies && (
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                                  {roommate.vacancies} vacancy
                                </span>
                              )}
                              {roommate.availableFrom && (
                                <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100">
                                  Move-in: {roommate.availableFrom}
                                </span>
                              )}
                              {roommate.targetGender && roommate.targetGender !== 'Any' && (
                                <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md border border-pink-100">
                                  For: {roommate.targetGender}
                                </span>
                              )}
                            </div>
                          )}

                          {/* IN-PLACE EXPANDED DETAILS */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-5 animate-fadeIn">
                              {/* Full Image Gallery */}
                              {roommate.images && roommate.images.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Room / Flat Photos (Tap to Zoom 🔍)</h4>
                                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                    {roommate.images.map((img, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => openLightbox(roommate.images, idx)}
                                        className="relative w-48 sm:w-56 h-32 sm:h-36 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm group cursor-pointer"
                                      >
                                        <img src={img} alt={`Room photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm flex items-center gap-1">
                                          <Eye size={12} /> {idx + 1} / {roommate.images.length}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Vacancies & Move-In availability */}
                              <div className="flex flex-wrap gap-2">
                                {roommate.vacancies != null && (
                                  <div className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1 rounded-xl text-xs font-extrabold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {roommate.vacancies} Vacanc{roommate.vacancies === 1 ? 'y' : 'ies'} of {roommate.totalCapacity || 2} Total
                                  </div>
                                )}
                                {roommate.availableFrom && (
                                  <div className="bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 px-3 py-1 rounded-xl text-xs font-extrabold border border-green-200 dark:border-green-800">
                                    ⏱ Move-in Available: {roommate.availableFrom}
                                  </div>
                                )}
                                {roommate.deposit > 0 && (
                                  <div className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-3 py-1 rounded-xl text-xs font-extrabold border border-purple-200 dark:border-purple-800">
                                    Deposit: ₹{displayDeposit}
                                  </div>
                                )}
                              </div>

                              {/* Utility & Bill Inclusions */}
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Utility & Bill Inclusions</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: 'Electricity', value: roommate.electricityBill || 'Not Included', icon: '⚡' },
                                    { label: 'Water', value: roommate.waterSupply === 'Included' ? '24 Hrs Water' : (roommate.waterSupply || 'Not Included'), icon: '💧' },
                                    { label: 'Maintenance', value: roommate.maintenance || 'Not Included', icon: '🛠️' }
                                  ].map((util, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/10 text-center">
                                      <span className="text-base block mb-0.5">{util.icon}</span>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block leading-none mb-1">{util.label}</span>
                                      <span className={`text-[11px] font-black ${util.value === 'Included' || util.value === '24 Hrs Water' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {util.value === 'Included' || util.value === '24 Hrs Water' ? (util.label === 'Water' ? '24 Hrs Water' : 'Included') : 'Not Incl.'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Specifications */}
                              {(roommate.facing || roommate.areaSqft) && (
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Property Specs</h4>
                                  <div className="flex gap-2">
                                    {roommate.facing && (
                                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 font-bold">
                                        🧭 Facing: {roommate.facing}
                                      </span>
                                    )}
                                    {roommate.areaSqft && (
                                      <span className="px-3 py-1 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-xs rounded-xl border border-teal-200 dark:border-teal-800 font-bold">
                                        📏 Size: {roommate.areaSqft} Sq. Ft.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Full Preferences & Lifestyle Tags */}
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Preferences & Lifestyle</h4>
                                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                                  {roommate.targetOccupation && <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">💼 Prefers {roommate.targetOccupation}</span>}
                                  {roommate.targetGender && roommate.targetGender !== 'Any' && <span className="bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 px-2.5 py-0.5 rounded-full border border-pink-200 dark:border-pink-800">👤 Prefers {roommate.targetGender}</span>}
                                  {roommate.dietaryPref && <span className="bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">🥗 Diet: {roommate.dietaryPref}</span>}
                                  {roommate.smokingPref && <span className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">🚬 {roommate.smokingPref}</span>}
                                  {roommate.drinkingPref && <span className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">🍻 {roommate.drinkingPref}</span>}
                                  {roommate.petsPref && <span className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">🐾 {roommate.petsPref}</span>}
                                  {roommate.sleepSchedule && <span className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">😴 Sleep: {roommate.sleepSchedule}</span>}
                                  {roommate.cleanlinessLevel && <span className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">✨ Cleanliness: {roommate.cleanlinessLevel}</span>}
                                  {roommate.preferences?.filter(p => !['1BHK', '2BHK', '3BHK', '4BHK+', '1RK'].includes(p)).map((pref, idx) => {
                                    let icon = '✔️';
                                    const pLower = pref.toLowerCase();
                                    if(pLower.includes('cctv')) icon = '📹';
                                    else if(pLower.includes('water')) icon = '💧';
                                    else if(pLower.includes('wifi')) icon = '📶';
                                    else if(pLower.includes('ac')) icon = '❄️';
                                    else if(pLower.includes('tv')) icon = '📺';
                                    else if(pLower.includes('parking')) icon = '🚗';
                                    else if(pLower.includes('security')) icon = '👮';
                                    else if(pLower.includes('gym')) icon = '🏋️';
                                    else if(pLower.includes('backup') || pLower.includes('power')) icon = '⚡';
                                    return (
                                      <span key={idx} className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">{icon} {pref}</span>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* ✨ Expanded Actions Row (AI Match, Action Buttons, Show Less) */}
                              <div className="flex flex-col md:flex-row gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/10 w-full items-stretch">
                                {/* AI Match Section */}
                                <div className="flex-[1.2]">
                                  {!cardMatches[roommate.id] ? (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleAnalyzeCardMatch(roommate); }}
                                      disabled={analyzingCardId === roommate.id}
                                      className="w-full h-full min-h-[44px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/25 disabled:opacity-50 active:scale-95 group relative overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[sweep_2s_infinite]"></div>
                                      {analyzingCardId === roommate.id ? (
                                        <>
                                          <Sparkles size={14} className="animate-pulse" />
                                          <span className="animate-pulse tracking-wide">Analyzing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles size={14} className="group-hover:animate-pulse" />
                                          <span className="tracking-wide">AI Compatibility Match</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="h-full w-full relative bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 text-gray-800 dark:text-gray-100 p-3 rounded-xl text-xs space-y-1.5 border border-purple-200 dark:border-purple-800/50 shadow-sm animate-fadeIn overflow-hidden flex flex-col justify-center">
                                      <div className="flex items-center justify-between relative z-10 border-b border-purple-100 dark:border-purple-900/30 pb-1.5">
                                        <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                          <Sparkles size={12} className="text-purple-500 animate-pulse" />
                                          Gemini Match
                                        </span>
                                        <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black px-2 py-0.5 rounded flex-shrink-0 text-[10px] shadow-sm">
                                          {cardMatches[roommate.id].matchScore}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 dark:text-purple-50 text-[10px] leading-snug font-medium z-10 relative">
                                        {cardMatches[roommate.id].analysis}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex-[1.5] flex flex-col sm:flex-row gap-3">
                                  {isAdminOrCreator ? (
                                    <>
                                      {isPostCreator && (
                                        <button
                                          type="button"
                                          onClick={() => handleEditPost(roommate)}
                                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                        >
                                          <Edit3 size={14} /> Edit Post
                                        </button>
                                      )}
                                      {isPostCreator && (
                                        <button
                                          type="button"
                                          onClick={() => handleGotAMate(roommate.id)}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                        >
                                          <Check size={14} /> Mark Fulfilled
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePost(roommate.id)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                      >
                                        <Trash2 size={14} /> Delete Post
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleSendRequest(roommate.id)}
                                        className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                      >
                                        <Users size={14} /> Send Request
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isAuthenticated) { showModal({ type: 'alert', title: 'Sign In Required', message: 'Please log in to message.', onConfirm: () => navigate('/auth') }); return; }
                                          let url = `/messages?user=${roommate.user?.id}`;
                                          if (cardMatches[roommate.id]?.icebreaker) {
                                            url += `&text=${encodeURIComponent(cardMatches[roommate.id].icebreaker)}`;
                                          }
                                          navigate(url);
                                        }}
                                        className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                      >
                                        <MessageCircle size={14} /> Direct Message
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Show Less Toggle */}
                                <div className="flex-1 md:max-w-[140px]">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandCard(roommate.id)}
                                    className="w-full h-full min-h-[44px] bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                                  >
                                    Show Less <ChevronLeft size={14} className="rotate-90" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Collapsed Actions */}
                        {!isExpanded && (
                          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2 w-full">
                            {!isAdminOrCreator && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendRequest(roommate.id)}
                                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                                >
                                  <Users size={13} /> Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isAuthenticated) { showModal({ type: 'alert', title: 'Sign In Required', message: 'Please log in to message.', onConfirm: () => navigate('/auth') }); return; }
                                    navigate(`/messages?user=${roommate.user?.id}`);
                                  }}
                                  className="flex-1 bg-slate-800 hover:bg-black text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                                >
                                  <MessageCircle size={13} /> Message
                                </button>
                              </div>
                            )}
                            {isPostCreator && (
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleEditPost(roommate)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95">
                                  <Edit3 size={13} /> Edit
                                </button>
                                <button type="button" onClick={() => handleDeletePost(roommate.id)} className="flex-1 bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95">
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleExpandCard(roommate.id)}
                              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                              <Eye size={15} /> Show All Details <ChevronRight size={15} className="rotate-90" />
                            </button>
                          </div>
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
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-gray-900/20" style={{ animation: 'slideUp 0.3s ease-out' }}>

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

                {/* AI Roommate Assist — Suggest & Add */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-primary-900 text-white rounded-2xl p-4 shadow-md border border-purple-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">✨</span>
                        <h4 className="text-sm font-bold">AI Roommate Assist (Suggest & Add)</h4>
                      </div>
                      <p className="text-[11px] text-purple-200 mt-0.5">Auto-suggest fair budget share and lifestyle tags.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetRoommateSuggestions}
                      disabled={aiSuggestingRoommate}
                      className="bg-white text-purple-900 hover:bg-purple-50 font-bold px-3 py-2 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5 flex-shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {aiSuggestingRoommate ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                          <span>Thinking...</span>
                        </>
                      ) : (
                        <span>✨ Get Suggestions</span>
                      )}
                    </button>
                  </div>

                  {aiRoommateSuggestions && (
                    <div className="mt-3.5 pt-3.5 border-t border-white/20 space-y-3 animate-fadeIn text-xs">
                      {/* Budget Suggestion */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-2 border border-white/10">
                        <div>
                          <span className="text-[10px] text-purple-200 uppercase tracking-wider block">Suggested Budget / Person</span>
                          <span className="text-base font-black text-amber-300">₹{parseInt(aiRoommateSuggestions.suggestedBudget || 0).toLocaleString('en-IN')}/mo</span>
                          <p className="text-[10px] text-purple-200 italic mt-0.5">💡 {aiRoommateSuggestions.reasoning}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPostFormData(prev => ({ ...prev, budget: aiRoommateSuggestions.suggestedBudget }))}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 shadow cursor-pointer"
                        >
                          + Apply Budget
                        </button>
                      </div>

                      {/* Preferences Suggestion */}
                      {aiRoommateSuggestions.suggestedPreferences && (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-2 border border-white/10">
                          <div>
                            <span className="text-[10px] text-purple-200 uppercase tracking-wider block">Recommended Tags</span>
                            <span className="text-xs font-semibold text-white block mt-0.5">{aiRoommateSuggestions.suggestedPreferences}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPostFormData(prev => ({ ...prev, preferences: aiRoommateSuggestions.suggestedPreferences }))}
                            className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 shadow cursor-pointer"
                          >
                            + Use Tags
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                      onChange={(e) => setPostFormData({ ...postFormData, buildingName: e.target.value })}
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
                          onChange={(e) => setPostFormData({ ...postFormData, areaName: e.target.value })}
                          onBlur={(e) => geocodeAndSetPostLocation(`${e.target.value}, ${postFormData.villageCityTown || 'Pune'}`)}
                          placeholder="e.g. Hinjewadi, Kothrud, Wakad"
                          required
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
                        onChange={(e) => setPostFormData({ ...postFormData, villageCityTown: e.target.value })}
                        placeholder="e.g. Pune"
                        required
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Taluka</label>
                      <input
                        type="text" value={postFormData.taluka}
                        onChange={(e) => setPostFormData({ ...postFormData, taluka: e.target.value })}
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
                        onChange={(e) => setPostFormData({ ...postFormData, district: e.target.value })}
                        placeholder="e.g. Pune"
                        required
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Pincode <span className="text-red-400">*</span></label>
                      <input
                        type="text" value={postFormData.pincode}
                        onChange={(e) => setPostFormData({ ...postFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="e.g. 411057"
                        maxLength={6}
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Embedded Post Map */}
                <div className={`mt-4 w-full overflow-hidden border-2 border-primary-200 relative z-0 transition-all duration-300 ${isMapExpanded ? 'fixed inset-0 z-[600] h-[100dvh] w-screen rounded-none' : 'h-[220px] rounded-xl'}`}>
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
                    <button
                      type="button"
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                      className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-lg p-1 text-[10px] font-semibold flex items-center transition-colors active:scale-95 ml-1 flex-shrink-0"
                      title={isMapExpanded ? "Minimize Map" : "Maximize Map"}
                    >
                      {isMapExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
                      onChange={(e) => setPostFormData({ ...postFormData, flatSize: e.target.value })}
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
                        <option value="Not Included">Not Included</option>
                        <option value="24 Hrs Water">24 Hrs Water</option>
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
                          onChange={(e) => setPostFormData({ ...postFormData, budget: e.target.value })}
                          placeholder="15000"
                          className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Deposit</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="number" value={postFormData.deposit}
                          onChange={(e) => setPostFormData({ ...postFormData, deposit: e.target.value })}
                          placeholder="50000"
                          className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vacancies</label>
                      <input type="number" min="1" value={postFormData.vacancies}
                        onChange={(e) => setPostFormData({ ...postFormData, vacancies: e.target.value })}
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Total Capacity</label>
                      <input type="number" min="1" value={postFormData.totalCapacity}
                        onChange={(e) => setPostFormData({ ...postFormData, totalCapacity: e.target.value })}
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
                      <select value={postFormData.facing} onChange={(e) => setPostFormData({ ...postFormData, facing: e.target.value })} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none bg-white">
                        <option value="">Select Direction</option>
                        {['East', 'North', 'South', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(dir => (
                          <option key={dir} value={dir}>{dir}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Area (Sq. Ft.)</label>
                      <input type="number" min="1" value={postFormData.areaSqft} onChange={(e) => setPostFormData({ ...postFormData, areaSqft: e.target.value })} placeholder="e.g. 1000" className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
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
                      onChange={(e) => setPostFormData({ ...postFormData, gender: e.target.value })}
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
                    <select value={postFormData.targetGender} onChange={(e) => setPostFormData({ ...postFormData, targetGender: e.target.value })} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Any">Any Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <select value={postFormData.dietaryPref} onChange={(e) => setPostFormData({ ...postFormData, dietaryPref: e.target.value })} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Any">Any Diet</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                    </select>
                    <select value={postFormData.smokingPref} onChange={(e) => setPostFormData({ ...postFormData, smokingPref: e.target.value })} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Non-Smoking">Non-Smoking</option>
                      <option value="Smoking Okay">Smoking Okay</option>
                    </select>
                    <select value={postFormData.drinkingPref} onChange={(e) => setPostFormData({ ...postFormData, drinkingPref: e.target.value })} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Non-Drinking">Non-Drinking</option>
                      <option value="Drinking Okay">Drinking Okay</option>
                    </select>
                  </div>
                  <input type="text" value={postFormData.preferences}
                    onChange={(e) => setPostFormData({ ...postFormData, preferences: e.target.value })}
                    placeholder="Other Tags (e.g. IT Professional, Night Shift)"
                    className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm mb-2" />
                  
                  {/* Quick Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'WiFi 📶', 'Water Heater 🚿', '24h Water 💧', 'Housekeeping 🧹',
                      '24/7 Security 👮‍♂️', 'Washing Machine 🧺', 'Study Table 🪑', 'Parking 🅿️',
                      'No Light Bill ⚡', 'CCTV 📹', 'Pantry 🍽️', 'Locker 🔐'
                    ].map((tag) => {
                      const cleanTag = tag.split(' ')[0];
                      const isSelected = postFormData.preferences?.includes(cleanTag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            let curr = postFormData.preferences ? postFormData.preferences.split(',').map(s => s.trim()).filter(Boolean) : [];
                            if (curr.includes(cleanTag)) {
                              curr = curr.filter(c => c !== cleanTag);
                            } else {
                              curr.push(cleanTag);
                            }
                            setPostFormData({ ...postFormData, preferences: curr.join(', ') });
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
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
                          <button type="button" onClick={() => setPostFormData({ ...postFormData, images: postFormData.images.filter((_, i) => i !== idx) })} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingPostId(null); }} className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className={`flex-1 py-3 px-4 text-white rounded-xl font-bold transition-colors shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 ${submitting ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {submitting ? 'Saving...' : (editingPostId ? 'Update Request' : 'Post Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Image Lightbox / Zoom Modal */}
      {lightboxState.isOpen && (
        <div 
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/10 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold transition-all border border-white/20 active:scale-95 backdrop-blur-sm shadow-xl"
            title="Close"
          >
            <X size={24} />
          </button>

          <div className="absolute top-4 left-4 z-20 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-bold border border-white/20">
            {lightboxState.index + 1} / {lightboxState.images.length}
          </div>

          {lightboxState.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevLightboxImage(); }}
              className="absolute left-4 z-20 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-4xl transition-all border border-white/20 active:scale-95 backdrop-blur-sm"
            >
              ‹
            </button>
          )}

          <div 
            className="max-w-5xl max-h-[90vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxState.images[lightboxState.index]}
              alt={`Zoomed photo ${lightboxState.index + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
            />
          </div>

          {lightboxState.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextLightboxImage(); }}
              className="absolute right-4 z-20 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-4xl transition-all border border-white/20 active:scale-95 backdrop-blur-sm"
            >
              ›
            </button>
          )}
        </div>
      )}

      <Modal {...modalConfig} onCancel={closeModal} />
    </>
  );
};

export default RoommatesPage;
