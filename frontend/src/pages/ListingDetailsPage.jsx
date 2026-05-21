import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, AirVent, Tv, Wind, Car, Shield, Dumbbell, CheckCircle2, ArrowLeft, Heart, Send, User, BadgeCheck, Image as ImageIcon, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import api from '../services/api';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

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

const amenityIcons = {
  'WiFi': Wifi, 'AC': AirVent, 'TV': Tv, 'Fridge': Wind,
  'Washing Machine': Wind, 'Parking': Car, 'Security': Shield, 'Gym': Dumbbell,
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

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const ListingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);

  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (err) {}
  };

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });
  const [wishlisted, setWishlisted] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800';

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, reviewsRes, summaryRes] = await Promise.all([
          api.get(`/listings/${id}`),
          api.get(`/reviews/listing/${id}`),
          api.get(`/reviews/listing/${id}/summary`),
        ]);
        setListing(listingRes.data);
        setReviews(reviewsRes.data);
        setReviewSummary(summaryRes.data);
        if (listingRes.data && listingRes.data.latitude && listingRes.data.longitude) {
          setMapCenter([listingRes.data.latitude, listingRes.data.longitude]);
        }
      } catch (err) {
        console.error('Error fetching data', err);
        setFetchError(err.response?.status === 404 ? 'not_found' : 'server_error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Check if wishlisted
    if (isAuthenticated) {
      api.get('/wishlist/ids').then(res => {
        if (res.data.includes(Number(id))) setWishlisted(true);
      }).catch(() => {});
    }
  }, [id, isAuthenticated]);

  const handleBook = async (payNow) => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    try {
      const res = await api.post(`/bookings/${id}`);
      if (payNow) {
        setBookingId(res.data.id);
        setShowPayment(true);
      } else {
        showModal({
          type: 'alert',
          title: 'Booking Placed',
          message: 'Booking placed! You can pay later from your dashboard.',
          onConfirm: () => {
            closeModal();
            navigate('/dashboard?tab=bookings');
          }
        });
      }
    } catch (err) {
      console.error('Booking error', err);
      showModal({ type: 'alert', title: 'Error', message: err.userMessage || 'Failed to initiate booking. Please try again.', onConfirm: closeModal });
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    try {
      const res = await api.post(`/wishlist/${id}`);
      setWishlisted(res.data.wishlisted);
    } catch (err) {
      console.error('Wishlist error', err);
    }
  };

  const handleContactOwner = () => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (listing?.owner?.id) {
      navigate(`/messages?user=${listing.owner.id}&text=Hi, I am interested in your property: ${listing.title}`);
    } else {
      showModal({ type: 'alert', title: 'Not Available', message: 'Owner details not available.', onConfirm: closeModal });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (newRating === 0) return;
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${id}`, { rating: newRating, comment: newComment });
      // Refresh reviews
      const [reviewsRes, summaryRes] = await Promise.all([
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`),
      ]);
      setReviews(reviewsRes.data);
      setReviewSummary(summaryRes.data);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      console.error('Review error', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyLink = () => {
    if (!listing) return;
    const slug = slugify(listing.title);
    const longLink = `${window.location.origin}/listings/${listing.id}/${slug}`;
    navigator.clipboard.writeText(longLink);
    showModal({
      type: 'success',
      title: 'Link Copied!',
      message: 'Interesting descriptive link copied to clipboard successfully!',
      onConfirm: closeModal
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fetchError === 'server_error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-2">Connection Issue</p>
        <p className="text-gray-500 mb-6 max-w-md">Our servers might be waking up or there is a temporary network issue. Please try refreshing the page.</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all">
            Refresh Page
          </button>
          <button onClick={() => navigate('/listings')} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-xl transition-all">
            Browse Flats
          </button>
        </div>
      </div>
    );
  }

  if (!listing || fetchError === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <p className="text-xl font-medium text-gray-900 mb-2">Property not found.</p>
        <p className="text-sm text-gray-500 mb-4">The link might be broken or the property has been removed.</p>
        <button onClick={() => navigate('/listings')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all">
          Explore Other Flats
        </button>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [fallbackImage];
  const avgRating = reviewSummary.averageRating;
  const totalReviews = reviewSummary.totalReviews;

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 min-h-screen pb-16">
      {showPayment && (
        <PaymentModal listing={listing} bookingId={bookingId} onClose={() => setShowPayment(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button & Share */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/listings')} className="flex items-center text-gray-600 hover:text-primary-600 font-semibold transition-colors active:scale-95 duration-200">
            <ArrowLeft size={18} className="mr-2" />
            Back to Listings
          </button>
          <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 hover:text-primary-600 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer">
            <Share2 size={14} />
            Copy Share Link
          </button>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 rounded-3xl overflow-hidden shadow-2xl border border-white/80 dark:border-white/5 bg-white dark:bg-slate-900 p-2">
          <div className="md:col-span-2 relative group overflow-hidden rounded-2xl h-[400px]">
            <img src={images[activeImage]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-semibold border border-white/20 shadow-lg">
              📷 Photo {activeImage + 1} of {images.length}
            </div>
          </div>
          <div className="grid grid-rows-2 gap-4 h-[400px]">
            {images.slice(1, 3).map((img, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-2xl h-full cursor-pointer" onClick={() => setActiveImage(idx + 1)}>
                <img src={img} alt="" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
            {images.length <= 2 && (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-400 rounded-2xl border-2 border-dashed border-gray-200">
                <ImageIcon size={24} className="mb-2 text-gray-300 animate-pulse" />
                <span className="text-xs font-semibold">No more photos</span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-250">
            {images.map((img, idx) => (
              <img key={idx} src={img} alt="" onClick={() => setActiveImage(idx)} className={`h-16 w-24 object-cover rounded-xl cursor-pointer flex-shrink-0 transition-all duration-300 ${activeImage === idx ? 'ring-4 ring-primary-500 scale-95 shadow-md' : 'opacity-60 hover:opacity-90 hover:scale-95'}`} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full shadow-sm">
                  {listing.type}
                </span>
                <div className="flex items-center text-yellow-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30 px-3 py-1 rounded-xl">
                  <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-bold text-sm text-amber-800">{avgRating || 'New'}</span>
                  <span className="text-amber-600 text-xs ml-1">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">{listing.title}</h1>
              <div className="flex items-center text-gray-500 font-medium">
                <MapPin size={16} className="text-primary-500 mr-1.5 flex-shrink-0" />
                <span>{listing.location}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-500 to-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base font-medium">{listing.description || 'No description provided.'}</p>
              
              {/* Owner Info Profile Snippet */}
              {listing.owner && (
                <div className="mt-8 pt-6 border-t border-gray-150 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {listing.owner.profilePhoto ? (
                      <img src={listing.owner.profilePhoto} alt={listing.owner.name} className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                        {listing.owner.name?.charAt(0) || 'O'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-1">
                        Hosted by {maskName(listing.owner.name)}
                        {listing.owner?.kycStatus === 'APPROVED' && (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold ml-2 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><BadgeCheck size={14} className="text-green-500 fill-green-100" /> Verified</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">Member since {new Date(listing.owner.createdAt || Date.now()).getFullYear()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Property Specifications (Area & Facing) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">📐 Property Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/70 dark:from-slate-800 dark:to-slate-800/70 border border-gray-200/50 dark:border-white/5 rounded-2xl hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-lg flex items-center justify-center flex-shrink-0">
                    🧭
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Facing Direction</p>
                    <p className="text-sm font-extrabold mt-0.5 text-gray-900 dark:text-gray-100">
                      {listing.facing || 'East'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/70 dark:from-slate-800 dark:to-slate-800/70 border border-gray-200/50 dark:border-white/5 rounded-2xl hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-lg flex items-center justify-center flex-shrink-0">
                    📏
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Super Built-up Area</p>
                    <p className="text-sm font-extrabold mt-0.5 text-gray-900 dark:text-gray-100">
                      {listing.areaSqft ? `${listing.areaSqft} Sq. Ft.` : 'Not Specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Utility & Maintenance Inclusions */}
            {['flat', 'room', 'apartment', 'pg', 'hostel', 'co-living space'].includes(listing.type?.toLowerCase()) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">🔌 Utility & Maintenance Inclusions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Electricity Bill', value: listing.electricityBill || 'Not Included', icon: '⚡' },
                    { label: 'Water Supply', value: listing.waterSupply || 'Not Included', icon: '💧' },
                    { label: 'Maintenance', value: listing.maintenance || 'Not Included', icon: '🛠️' }
                  ].map((util, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/70 dark:from-slate-800 dark:to-slate-800/70 border border-gray-200/50 dark:border-white/5 rounded-2xl hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-lg flex items-center justify-center flex-shrink-0">
                        {util.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{util.label}</p>
                        <p className={`text-sm font-extrabold mt-0.5 ${util.value === 'Included' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {util.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listing.videoLink && getEmbedUrl(listing.videoLink) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">🎥 Virtual Video Tour</h2>
                <div className="rounded-2xl overflow-hidden bg-gray-100 shadow-md border border-gray-200/60 aspect-video relative group">
                  <iframe 
                    src={getEmbedUrl(listing.videoLink)} 
                    title="Property Video Tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0"
                  ></iframe>
                </div>
              </div>
            )}

            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">⭐ What's Included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {listing.amenities.map((amenity, idx) => {
                    const Icon = amenityIcons[amenity] || CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/70 dark:from-slate-800 dark:to-slate-800/70 border border-gray-200/50 dark:border-white/5 rounded-2xl hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-300 group">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 transition-colors shadow-inner">
                          <Icon size={20} className="transition-transform group-hover:scale-110" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">📍 Location Map</h2>
              {listing.latitude && listing.longitude ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md relative">
                  {/* Map Search Overlay */}
                  <div className="absolute top-3 left-3 right-3 z-[1000] glass-premium rounded-xl p-1.5 flex items-center shadow-lg border border-white/50 bg-white/95 backdrop-blur-sm">
                    <div className="pl-3 pr-2 text-gray-400">
                      <MapPin size={16} className="text-primary-500" />
                    </div>
                    <input 
                      type="text" 
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      placeholder="Search map location..." 
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
                  <div className="h-[280px] z-0 relative">
                    <MapContainer center={mapCenter || [listing.latitude, listing.longitude]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
                      {mapCenter && <MapUpdater center={mapCenter} />}
                      <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      />
                      <Marker position={[listing.latitude, listing.longitude]} icon={customMapPinIcon} />
                    </MapContainer>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors bg-gray-50 border-t border-gray-200"
                  >
                    <MapPin size={16} />
                    Navigate via Google Maps — {listing.location}
                  </a>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 shadow-inner">
                  <div className="text-center">
                    <MapPin size={36} className="mx-auto mb-2 text-primary-500 animate-bounce" />
                    <p className="font-bold text-gray-800">{listing.location}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Exact map location is not pinned.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Reviews Section ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-gray-100/40 dark:shadow-black/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Reviews & Ratings</h2>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-900">{avgRating}</span>
                    <span className="text-gray-500 text-sm">({totalReviews})</span>
                  </div>
                )}
              </div>

              {/* Write Review Form */}
              {isAuthenticated ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            star <= (hoverRating || newRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {newRating > 0 && (
                      <span className="ml-2 text-sm text-gray-500 font-medium">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][newRating]}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={newRating === 0 || submittingReview}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
                    >
                      <Send size={16} />
                      {submittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-center">
                  <p className="text-gray-500 mb-3">Log in to share your review</p>
                  <button onClick={() => navigate('/auth')} className="text-primary-600 font-medium hover:underline">
                    Sign in →
                  </button>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Star size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="flex gap-4 p-4 border border-gray-100 dark:border-white/5 rounded-xl hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary-200">
                        {review.user?.profilePhoto ? (
                          <img src={review.user.profilePhoto} alt={review.user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary-700 font-bold text-sm">
                            {review.user?.name ? review.user.name.charAt(0).toUpperCase() : <User size={18} />}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{maskName(review.user?.name) || 'Anonymous'}</h4>
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                        {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/5 shadow-2xl dark:shadow-black/30 p-6 md:p-8 sticky top-24 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600" />
              <div className="mb-6 bg-gradient-to-br from-primary-50 to-indigo-50/50 dark:from-primary-900/20 dark:to-indigo-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-800/30 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-primary-600">₹{listing.price?.toLocaleString('en-IN')}</span>
                  <span className="text-gray-500 text-xs font-semibold ml-1">/month</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-md">Best Value</span>
              </div>
              <div className="space-y-3.5 mb-6 text-sm text-gray-600 font-medium">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Monthly Rent</span>
                  <span className="font-bold text-gray-900">₹{listing.price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Security Deposit</span>
                  <span className="font-bold text-gray-900">₹{(listing.price * 2)?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-3.5 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl px-3 border border-gray-100 dark:border-white/5">
                  <span className="font-bold text-gray-800">Total Due Now</span>
                  <span className="font-extrabold text-lg text-primary-600">₹{(listing.price * 3)?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="mb-5 bg-amber-50/40 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-700/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs text-amber-900 leading-relaxed font-semibold">
                    <strong>I agree to the Booking & Payment Policy:</strong> We are not responsible for any issues after booking and payment are successfully done.
                  </span>
                </label>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleBook(true)}
                  disabled={!agreed}
                  className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-primary-600/20 flex flex-col items-center justify-center leading-tight cursor-pointer"
                >
                  <span>Book & Pay Now</span>
                  <span className="text-[10px] font-semibold text-primary-100 mt-0.5 tracking-wider uppercase">Confirm Instantly</span>
                </button>
                <button
                  onClick={() => handleBook(false)}
                  disabled={!agreed}
                  className="w-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 disabled:border-gray-300 border-2 border-primary-600 text-primary-600 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  Pay Directly to Owner (Cash/Online)
                </button>
                <div className="bg-orange-50 dark:bg-orange-900/15 border border-orange-200 dark:border-orange-700/30 p-3 rounded-xl mt-3">
                  <p className="text-[11px] text-orange-800 font-bold text-center leading-normal">
                    ⚠️ Note: Payment Gateway is currently in sandbox testing mode. You can use the "Pay Directly to Owner" option to successfully reserve.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleWishlistToggle}
                  className={`border py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    wishlisted
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
                  {wishlisted ? 'Saved' : 'Save'}
                </button>
                
                <button
                  onClick={handleContactOwner}
                  className="bg-gray-900 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Send size={14} />
                  Contact Owner
                </button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 font-semibold mt-4">
                🔒 Secured & encrypted transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default ListingDetailsPage;
