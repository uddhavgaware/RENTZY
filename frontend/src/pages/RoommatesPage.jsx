import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, IndianRupee, MessageCircle, Plus, X, Users, Trash2, Info, BadgeCheck, Navigation, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const RoommatesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activeImageIndexes, setActiveImageIndexes] = useState({});
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [searchInput, setSearchInput] = useState('');

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

  const [postFormData, setPostFormData] = useState({
    location: '',
    budget: '',
    deposit: '',
    preferences: '',
    vacancies: 1,
    totalCapacity: 2,
    targetOccupation: 'Any',
    agePreference: '',
    smokingPref: 'Non-Smoking',
    drinkingPref: 'Non-Drinking',
    petsPref: 'No Pets',
    sleepSchedule: 'Flexible',
    cleanlinessLevel: 'Moderate',
    images: []
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const currentImagesCount = postFormData.images ? postFormData.images.length : 0;
    
    if (currentImagesCount + files.length > 5) {
      showModal({ type: 'alert', title: 'Limit Exceeded', message: "You can only upload up to 5 photos for your room/flat.", onConfirm: closeModal });
      return;
    }

    Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    })).then(base64Images => {
      const newImages = [...(postFormData.images || []), ...base64Images].slice(0, 5);
      setPostFormData({...postFormData, images: newImages});
    });
  };

  const fetchRoommates = async () => {
    try {
      const response = await api.get('/roommates', { params: { location: searchInput } });
      setRoommates(response.data);
    } catch (error) {
      console.error('Failed to fetch roommates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [searchInput]); // Re-fetch when searchInput changes

  const handleSearch = () => {
    fetchRoommates();
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        location: postFormData.location,
        budget: parseFloat(postFormData.budget),
        deposit: parseFloat(postFormData.deposit) || 0,
        vacancies: parseInt(postFormData.vacancies) || null,
        totalCapacity: parseInt(postFormData.totalCapacity) || null,
        preferences: postFormData.preferences ? postFormData.preferences.split(',').map(p => p.trim()) : [],
        targetOccupation: postFormData.targetOccupation,
        agePreference: postFormData.agePreference,
        smokingPref: postFormData.smokingPref,
        drinkingPref: postFormData.drinkingPref,
        petsPref: postFormData.petsPref,
        sleepSchedule: postFormData.sleepSchedule,
        cleanlinessLevel: postFormData.cleanlinessLevel,
        images: postFormData.images
      };
      await api.post('/roommates', payload);
      setIsModalOpen(false);
      setPostFormData({ location: '', budget: '', deposit: '', preferences: '', vacancies: 1, totalCapacity: 2, images: [] });
      fetchRoommates();
    } catch (error) {
      console.error('Failed to post roommate request', error);
      showModal({ type: 'alert', title: 'Error', message: 'Failed to post request. Make sure you are logged in.', onConfirm: closeModal });
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

  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center py-12 relative">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Find Your Perfect Roommate</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Connect with like-minded people looking to share a space in your preferred location.
          </p>
          {isAuthenticated && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-all active:scale-95"
            >
              <Plus className="mr-2" size={20} />
              Post a Request
            </button>
          )}
        </div>

        {/* 💡 Split Rent Info Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-10">
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
            <button onClick={handleSearch} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm">
              <Search className="mr-2" size={20} />
              Search
            </button>
          </div>
        </div>

        {/* Roommates Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : roommates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No roommate requests found. Be the first to post!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roommates.map(roommate => {
              const isOwner = user?.email === roommate.user?.email;
              const myPost = roommates.find(r => r.user?.email === user?.email);
              
              let matchScore = null;
              if (!isOwner && myPost) {
                let score = 0;
                let total = 4;
                if (myPost.smokingPref === roommate.smokingPref || myPost.smokingPref === 'Smoking Okay' || roommate.smokingPref === 'Smoking Okay') score++;
                if (myPost.drinkingPref === roommate.drinkingPref || myPost.drinkingPref === 'Drinking Okay' || roommate.drinkingPref === 'Drinking Okay') score++;
                if (myPost.petsPref === roommate.petsPref || myPost.petsPref === 'Pets Welcome' || roommate.petsPref === 'Pets Welcome') score++;
                if (myPost.targetOccupation === 'Any' || roommate.targetOccupation === 'Any' || myPost.targetOccupation === roommate.targetOccupation) score++;
                matchScore = Math.round((score / total) * 100);
              }

              const splitRent = roommate.totalCapacity > 1 && roommate.budget ? Math.round(roommate.budget / roommate.totalCapacity) : null;
              const splitDeposit = roommate.totalCapacity > 1 && roommate.deposit > 0 ? Math.round(roommate.deposit / roommate.totalCapacity) : null;

              const displayBudget = roommate.budget ? roommate.budget.toLocaleString('en-IN') : 'N/A';
              const displayDeposit = roommate.deposit ? roommate.deposit.toLocaleString('en-IN') : 'N/A';

              return (
                <div key={roommate.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-100 to-transparent rounded-bl-full -z-10 opacity-50"></div>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl mr-4 border-2 border-white shadow-sm">
                        {roommate.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1">
                          {roommate.user?.name || 'Unknown User'}
                          {roommate.user?.kycStatus === 'APPROVED' && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium ml-2"><BadgeCheck size={18} className="text-green-500 fill-green-100" /> Verified</span>
                          )}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {roommate.user?.role === 'OWNER' ? 'Property Owner' : 'Tenant'}
                        </p>
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
                        <span className="text-xs text-gray-500 block">Total Rent</span>
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
                      {roommate.targetOccupation && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">Prefers {roommate.targetOccupation}</span>}
                      {roommate.smokingPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.smokingPref}</span>}
                      {roommate.drinkingPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.drinkingPref}</span>}
                      {roommate.petsPref && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.petsPref}</span>}
                      {roommate.sleepSchedule && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.sleepSchedule}</span>}
                      {roommate.cleanlinessLevel && <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">{roommate.cleanlinessLevel} Clean</span>}
                      {roommate.preferences?.map((pref, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isOwner && (
                    <button 
                      onClick={() => window.location.href = `/messages?user=${roommate.user?.id}&text=${encodeURIComponent(`Hi ${roommate.user?.name || ''}, I saw your roommate posting for ${roommate.location} and I'm interested in joining!`)}`}
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

      </div>
      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Post Roommate Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handlePostSubmit} className="p-6 space-y-5">
              {/* Split rent preview inside modal */}
              {postFormData.budget && postFormData.totalCapacity > 1 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                  <Users size={16} className="flex-shrink-0" />
                  <span>Each member pays <strong>₹{Math.round(parseFloat(postFormData.budget) / parseInt(postFormData.totalCapacity)).toLocaleString('en-IN')}/mo</strong> rent</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={postFormData.location}
                    onChange={(e) => setPostFormData({...postFormData, location: e.target.value})}
                    placeholder="e.g. Hinjewadi, Pune" 
                    className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Rent</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      required
                      value={postFormData.budget}
                      onChange={(e) => setPostFormData({...postFormData, budget: e.target.value})}
                      placeholder="15000" 
                      className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deposit</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      required
                      value={postFormData.deposit}
                      onChange={(e) => setPostFormData({...postFormData, deposit: e.target.value})}
                      placeholder="50000" 
                      className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies</label>
                  <input 
                    type="number" 
                    min="1"
                    value={postFormData.vacancies}
                    onChange={(e) => setPostFormData({...postFormData, vacancies: e.target.value})}
                    placeholder="1" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={postFormData.totalCapacity}
                    onChange={(e) => setPostFormData({...postFormData, totalCapacity: e.target.value})}
                    placeholder="2" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Occupation</label>
                  <select value={postFormData.targetOccupation} onChange={(e) => setPostFormData({...postFormData, targetOccupation: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="Any">Any</option>
                    <option value="Student">Student</option>
                    <option value="Working Professional">Working Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                  <select value={postFormData.smokingPref} onChange={(e) => setPostFormData({...postFormData, smokingPref: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="Non-Smoking">Non-Smoking</option>
                    <option value="Smoking Okay">Smoking Okay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
                  <select value={postFormData.drinkingPref} onChange={(e) => setPostFormData({...postFormData, drinkingPref: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="Non-Drinking">Non-Drinking</option>
                    <option value="Drinking Okay">Drinking Okay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pets</label>
                  <select value={postFormData.petsPref} onChange={(e) => setPostFormData({...postFormData, petsPref: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="No Pets">No Pets</option>
                    <option value="Pets Welcome">Pets Welcome</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Preferences (optional)</label>
                <input 
                  type="text" 
                  value={postFormData.preferences}
                  onChange={(e) => setPostFormData({...postFormData, preferences: e.target.value})}
                  placeholder="e.g. Vegetarian, Gym bro" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Room/Flat Photos</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {postFormData.images && postFormData.images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {postFormData.images.map((img, i) => (
                      <div key={i} className="relative flex-shrink-0">
                        <img src={img} alt={`Preview ${i}`} className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                        <button 
                          type="button" 
                          onClick={() => setPostFormData({...postFormData, images: postFormData.images.filter((_, index) => index !== i)})}
                          className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full shadow-sm hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-primary-600 text-white rounded-xl py-3 font-medium hover:bg-primary-700 transition-colors shadow-sm mt-4">
                Post Request
              </button>
            </form>
          </div>
        </div>
      )}
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default RoommatesPage;

