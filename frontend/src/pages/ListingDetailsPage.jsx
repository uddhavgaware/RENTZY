import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Star, Wifi, AirVent, Tv, Wind, Car, Shield, Dumbbell, CheckCircle2, ArrowLeft, Heart, Send, User, BadgeCheck, Image as ImageIcon, Share2, Calendar, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import api from '../services/api';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div class="relative w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white">
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
  return name.trim();
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
  const [nearbyAmenities, setNearbyAmenities] = useState({ hospitals: [], gyms: [], transit: [] });
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    fetchListing();
    fetchReviews();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      const data = response.data;
      setListing(data);
      if (data.latitude && data.longitude) {
        setMapCenter([data.latitude, data.longitude]);
        fetchNearbyAmenities(data.latitude, data.longitude);
      }
    } catch (error) {
      setFetchError(error.response?.data || 'Failed to load property details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const [resReviews, resSummary] = await Promise.all([
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`)
      ]);
      setReviews(resReviews.data || []);
      setReviewSummary(resSummary.data || { averageRating: 0, totalReviews: 0 });
    } catch (err) {}
  };

  const fetchNearbyAmenities = async (lat, lon) => {
    setLoadingAmenities(true);
    try {
      // Basic mock setup or API call if exists
      setNearbyAmenities({
        hospitals: [{ name: 'City Hospital', distance: '1.2 km' }],
        gyms: [{ name: 'Gold Gym', distance: '0.5 km' }],
        transit: [{ name: 'Metro Station', distance: '0.8 km' }]
      });
    } catch (err) {} finally {
      setLoadingAmenities(false);
    }
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!agreed) {
      showModal({ type: 'alert', title: 'Agreement Required', message: 'You must agree to the Terms of Lease before booking.', onConfirm: closeModal });
      return;
    }
    try {
      const res = await api.post(`/bookings/create/${id}`);
      setBookingId(res.data.id);
      setShowPayment(true);
    } catch (err) {
      showModal({ type: 'error', title: 'Booking Failed', message: err.response?.data || 'Could not process booking request.', onConfirm: closeModal });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    import('react-hot-toast').then(({ toast }) => toast.success('Share link copied to clipboard!'));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (newRating === 0) {
      showModal({ type: 'alert', title: 'Rating Required', message: 'Please select a star rating.', onConfirm: closeModal });
      return;
    }
    try {
      await api.post(`/reviews/add/${id}`, { rating: newRating, comment: newComment });
      setNewRating(0);
      setNewComment('');
      fetchReviews();
      import('react-hot-toast').then(({ toast }) => toast.success('Review added successfully!'));
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (fetchError || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Error Loading Space</h2>
          <p className="text-gray-500 mb-8">{fetchError || 'The property you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/listings')} className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl">Back to Search</button>
        </div>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'];

  const fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200';
  const avgRating = reviewSummary.averageRating?.toFixed(1) || '0.0';
  const totalReviews = reviewSummary.totalReviews || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-20">
      <Helmet>
        <title>{listing.title} | RentXY</title>
      </Helmet>

      {/* Hero Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={20} /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleCopyLink} className="p-3 bg-white dark:bg-slate-800 border border-gray-250/10 rounded-2xl shadow-sm text-gray-600 hover:text-indigo-600 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Asymmetrical Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl relative group bg-white dark:bg-slate-900 p-2 border border-gray-200/50">
          <div className="md:col-span-2 h-full relative overflow-hidden rounded-2xl">
            <img src={images[activeImage]} alt="" className="w-full h-full object-cover" onError={(e)=>{e.target.src=fallbackImage}} />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 h-full">
            {images.slice(1, 3).map((img, idx) => (
              <div key={idx} className="h-full relative overflow-hidden rounded-2xl cursor-pointer" onClick={() => setActiveImage(idx + 1)}>
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-550" onError={(e)=>{e.target.src=fallbackImage}} />
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-gray-900 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xl border border-gray-200 flex items-center gap-2 hover:bg-white transition-all active:scale-95 z-20"
          >
            <ImageIcon size={14} /> Show all {images.length} photos
          </button>
        </div>
      </div>

      {/* Content Columns with Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Details Panel */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 font-black uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-full">{listing.type}</span>
                <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 border border-yellow-250/20 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" /> {avgRating} ({totalReviews} Reviews)
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tight">{listing.title}</h1>
              <p className="text-gray-500 font-bold flex items-center gap-1.5"><MapPin size={18} className="text-indigo-500"/> {listing.location}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-xl font-black text-gray-950 dark:text-white">About this space</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-semibold whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Amenities Section */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-xl font-black text-gray-950 dark:text-white">What this place offers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.amenities?.map(amenity => {
                  const Icon = amenityIcons[amenity] || CheckCircle2;
                  return (
                    <div key={amenity} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                      <Icon size={20} className="text-indigo-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map Section */}
            {listing.latitude && (
              <div className="bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <h3 className="text-xl font-black text-gray-950 dark:text-white">Where you'll be</h3>
                <div className="h-[350px] rounded-2xl overflow-hidden border border-gray-200/50 relative z-0">
                  <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false} className="h-full w-full">
                    <MapUpdater center={mapCenter} />
                    <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
                    <Marker position={mapCenter} icon={customMapPinIcon} />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Booking Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-slate-800 border border-gray-200/60 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500" />
              
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-400">Monthly Rent</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹{listing.price?.toLocaleString()}</span>
              </div>

              {/* Host Snippet */}
              {listing.owner && (
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">{listing.owner.name?.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Listed By</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1">
                      {maskName(listing.owner.name)}
                      {listing.owner?.kycStatus === 'APPROVED' && <BadgeCheck size={14} className="text-green-500" />}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
                  <span className="text-xs text-gray-500 font-semibold leading-relaxed">I agree to RentXY's Terms of Lease, security deposit terms, and verified cancellation policies.</span>
                </label>

                <button
                  onClick={handleBookNow}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Book / Contact Owner
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[2000] overflow-y-auto p-6 flex flex-col items-center">
            <button onClick={() => setShowAllPhotos(false)} className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-white font-black text-2xl mb-10 mt-6">{listing.title} Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
              {images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={img} alt="" className="w-full object-cover" onError={(e)=>{e.target.src=fallbackImage}} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentModal isOpen={showPayment} bookingId={bookingId} amount={listing.price} onCancel={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); navigate('/tenant/dashboard'); }} />
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default ListingDetailsPage;
