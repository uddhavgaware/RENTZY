import React, { useState, useRef, useEffect } from 'react';
import { Upload, IndianRupee, MapPin, Home, AlignLeft, CheckCircle2, X, Star, Image, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Individual image upload slot component
const ImageSlot = ({ label, isMain, file, preview, onFileSelect, onRemove, slotId }) => {
  const inputRef = useRef(null);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        {isMain && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
        {label}
      </span>
      {preview ? (
        <div className={`relative rounded-xl overflow-hidden border-2 ${isMain ? 'border-primary-400' : 'border-gray-200'} group`}
          style={{ aspectRatio: isMain ? '16/9' : '4/3' }}>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          {isMain && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} className="fill-white" /> Main Photo
            </div>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full p-1 shadow transition-colors opacity-0 group-hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={slotId}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${isMain
              ? 'border-primary-300 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-400'
              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'}
          `}
          style={{ aspectRatio: isMain ? '16/9' : '4/3' }}
        >
          <input
            id={slotId}
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <Image size={isMain ? 28 : 20} className={isMain ? 'text-primary-400 mb-2' : 'text-gray-300 mb-1'} />
          <span className={`text-xs font-medium ${isMain ? 'text-primary-500' : 'text-gray-400'}`}>
            {isMain ? 'Upload Main Photo' : 'Add Photo'}
          </span>
          {isMain && <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</span>}
        </label>
      )}
    </div>
  );
};

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

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

// Map click handler component
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customMapPinIcon}></Marker>
  );
};

const PostPropertyPage = () => {
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Flat',
    configuration: '1BHK',
    furnishing: 'Semi Furnished',
    location: '',
    buildingName: '',
    areaName: '',
    villageCityTown: '',
    taluka: '',
    district: '',
    pincode: '',
    price: '',
    videoLink: '',
    latitude: 18.5204,
    longitude: 73.8567,
    electricityBill: 'Not Included',
    waterSupply: 'Not Included',
    maintenance: 'Not Included',
    facing: 'East',
    areaSqft: '',
  });

  const [mapPosition, setMapPosition] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);

  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        setMapCenter([newLat, newLon]);
        setMapPosition({ lat: newLat, lng: newLon });
        setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
      }
    } catch (err) {}
  };

  // Geocode the locality/area input and update map
  const geocodeLocationInput = async (locationText) => {
    if (!locationText || !locationText.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        setMapCenter([newLat, newLon]);
        setMapPosition({ lat: newLat, lng: newLon });
        setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
      }
    } catch (err) {}
  };

  // Slot-based image state: index 0 = main, index 1-4 = additional
  const [imageFiles, setImageFiles] = useState([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState([null, null, null, null, null]);
  const [amenities, setAmenities] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (index, file) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`"${file.name}" is too large. Max file size is 5MB.`);
      return;
    }
    setError('');
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleRemove = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newFiles[index] = null;
    newPreviews[index] = null;
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.facing || !formData.areaSqft || parseFloat(formData.areaSqft) <= 0) {
        setError('Please select facing direction and enter a valid property area in square feet.');
        return;
      }
      setError('');
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Validate: main image is required
      if (!imageFiles[0]) {
        setError('Please upload at least the main display photo.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Upload all non-null files in slot order (index 0 first = main image)
        const filesToUpload = imageFiles.filter(Boolean);
        let imageUrls = [];
        if (filesToUpload.length > 0) {
          const uploadData = new FormData();
          filesToUpload.forEach(file => uploadData.append('files', file));
          const uploadRes = await api.post('/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrls = uploadRes.data;
        }

        // Build combined location string from address fields
        const locationParts = [
          formData.buildingName,
          formData.areaName,
          formData.villageCityTown,
          formData.taluka,
          formData.district,
          formData.pincode ? `- ${formData.pincode}` : ''
        ].filter(Boolean).join(', ');

        const payload = {
          ...formData,
          location: locationParts || formData.location,
          price: parseFloat(formData.price),
          images: imageUrls,
          amenities: amenities,
          latitude: mapPosition ? mapPosition.lat : null,
          longitude: mapPosition ? mapPosition.lng : null
        };
        await api.post('/listings', payload);
        setIsSubmitted(true);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to post property. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Listed Successfully!</h2>
          <p className="text-gray-500 mb-8">
            Your property is now live and visible to tenants.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner && !isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-8">
            You must be registered as a Property Owner to post listings.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
          <p className="text-gray-600 mt-2">Fill in the details to reach thousands of potential tenants.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <X size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-600 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'} transition-colors duration-300`}>
                {num}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
            <span>Basic Details</span>
            <span>Location & Price</span>
            <span>Photos & Amenities</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Hostel', 'Flat', 'Apartment', 'PG', 'Independent House', 'Villa', 'Co-living Space'].map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleChange} className="peer sr-only" />
                        <div className="rounded-xl border border-gray-200 p-3 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                          <span className="font-medium text-gray-700 text-sm">{type}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Configuration</label>
                    <select name="configuration" value={formData.configuration} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all">
                      {['1RK', 'Single Room', '1BHK', '2BHK', '3BHK', '4BHK', 'Studio Apartment'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
                    <select name="furnishing" value={formData.furnishing} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all">
                      {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                    Utility & Maintenance Inclusions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Electricity Bill</label>
                      <select name="electricityBill" value={formData.electricityBill} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
                        <option value="Not Included">Not Included</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Water Supply</label>
                      <select name="waterSupply" value={formData.waterSupply} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
                        <option value="Not Included">Not Included</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Maintenance Charge</label>
                      <select name="electricityBill" value={formData.maintenance} onChange={(e) => setFormData(prev => ({ ...prev, maintenance: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
                        <option value="Not Included">Not Included</option>
                        <option value="Included">Included</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facing Direction <span className="text-red-400">*</span></label>
                    <select name="facing" value={formData.facing} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" required>
                      {['East', 'North', 'South', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Area (Sq. Ft.) <span className="text-red-400">*</span></label>
                    <input type="number" name="areaSqft" value={formData.areaSqft} onChange={handleChange} min="1" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 1200" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Spacious 2BHK in Viman Nagar" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Describe your property..." required></textarea>
                </div>
              </div>
            )}

            {/* Step 2: Location & Price */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Location & Pricing</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building / Society Name</label>
                  <input type="text" name="buildingName" value={formData.buildingName} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Maple Heights, Sai Residency" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    name="areaName" 
                    value={formData.areaName} 
                    onChange={handleChange} 
                    onBlur={(e) => geocodeLocationInput(`${e.target.value}, ${formData.villageCityTown || 'Pune'}`)}
                    onKeyDown={(e) => e.key === 'Enter' && geocodeLocationInput(`${formData.areaName}, ${formData.villageCityTown || 'Pune'}`)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
                    placeholder="e.g. Koregaon Park, Hinjewadi" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village / City / Town <span className="text-red-400">*</span></label>
                    <input type="text" name="villageCityTown" value={formData.villageCityTown} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pune" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taluka</label>
                    <input type="text" name="taluka" value={formData.taluka} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Haveli" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-400">*</span></label>
                    <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pune" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      name="pincode" 
                      value={formData.pincode} 
                      onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
                      placeholder="e.g. 411057" 
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required 
                    />
                  </div>
                </div>

                {/* Map Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MapIcon size={16} className="text-gray-500" /> Pin on Map
                  </label>
                  <p className="text-xs text-gray-400 mb-3">Click on the map to accurately pin your property's location. This helps tenants find it easily.</p>
                  <div className="h-[250px] rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
                    {/* Map Search Overlay */}
                    <div className="absolute top-3 left-3 right-3 z-[1000] glass-premium rounded-xl p-1.5 flex items-center shadow-lg border border-white/50 bg-white/95 backdrop-blur-sm">
                      <div className="pl-3 pr-2 text-gray-400">
                        <MapPin size={16} className="text-primary-500" />
                      </div>
                      <input 
                        type="text" 
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        placeholder="Search area, landmark or street..." 
                        className="w-full outline-none text-xs bg-transparent font-medium text-gray-800 placeholder-gray-400 py-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleMapSearch(e);
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleMapSearch}
                        className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center shadow-sm transition-colors active:scale-95 ml-1 flex-shrink-0"
                      >
                        Search
                      </button>
                    </div>

                    <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={true} className="h-full w-full">
                      <MapUpdater center={mapCenter} />
                      <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      />
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="15000" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input type="number" className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="30000" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos & Amenities */}
            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Photos & Amenities</h2>

                {/* Image Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Property Photos
                    </label>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {imageFiles.filter(Boolean).length} / 5 uploaded
                    </span>
                  </div>

                  {/* Tip */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                    <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      The <strong>Main Photo</strong> is the first image tenants see on the listing card. Upload your best photo there. You can add up to <strong>4 more photos</strong> to showcase rooms, amenities, etc.
                    </p>
                  </div>

                  {/* Main Image Slot — large and prominent */}
                  <div className="mb-5">
                    <ImageSlot
                      slotId="img-main"
                      label="Main Display Photo (Required)"
                      isMain={true}
                      file={imageFiles[0]}
                      preview={imagePreviews[0]}
                      onFileSelect={(file) => handleFileSelect(0, file)}
                      onRemove={() => handleRemove(0)}
                    />
                  </div>

                  {/* 4 Additional Slots */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((idx) => (
                      <ImageSlot
                        key={idx}
                        slotId={`img-slot-${idx}`}
                        label={`Photo ${idx}`}
                        isMain={false}
                        file={imageFiles[idx]}
                        preview={imagePreviews[idx]}
                        onFileSelect={(file) => handleFileSelect(idx, file)}
                        onRemove={() => handleRemove(idx)}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-3">Accepted: JPG, PNG, WEBP · Max 5MB per photo</p>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Amenities Provided</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['WiFi', 'AC', 'TV', 'Fridge', 'Washing Machine', 'Parking', 'Gym', 'Security'].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                        />
                        <span className="text-sm text-gray-700 select-none">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* YouTube Video Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video Link (Optional)</label>
                  <input type="text" name="videoLink" value={formData.videoLink} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. https://www.youtube.com/watch?v=..." />
                  <p className="text-xs text-gray-400 mt-2">Add a virtual walkthrough video to increase bookings.</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              ) : <div></div>}
              
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-md shadow-primary-600/20 ${loading ? 'opacity-70 cursor-not-allowed animate-pulse' : 'hover:bg-primary-700 active:scale-95'}`}
              >
                {loading ? 'Processing...' : step === 3 ? 'Post Property' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostPropertyPage;

