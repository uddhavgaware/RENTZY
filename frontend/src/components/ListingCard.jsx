import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, BadgeCheck, Wifi, Car, Dumbbell, Tv } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

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

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays}d ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)}w ago`;
  return `Updated ${Math.floor(diffDays / 30)}mo ago`;
};

// Map common amenity names to emojis for quick visual scan
const AMENITY_ICONS = {
  'WiFi': '📶', 'AC': '❄️', 'Parking': '🚗', 'Gym': '💪',
  'TV': '📺', 'Fridge': '🧊', 'Washing Machine': '🫧', 'Security': '🔒',
  'Power Backup': '⚡', 'Water Supply': '💧',
};

const TYPE_COLORS = {
  'PG': 'from-purple-500 to-violet-600',
  'Hostel': 'from-orange-500 to-amber-600',
  'Flat': 'from-blue-500 to-indigo-600',
  'Apartment': 'from-blue-500 to-indigo-600',
  'Independent House': 'from-green-500 to-emerald-600',
  'Villa': 'from-rose-500 to-pink-600',
  'Co-living Space': 'from-teal-500 to-cyan-600',
};

const ListingCard = ({ listing, wishlisted: initialWishlisted = false, onWishlistChange }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [animating, setAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const getOptimizedImageUrl = (url) => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      // Upgraded to w_1080 and q_auto:good for premium retina quality
      return url.replace('/upload/', '/upload/f_auto,q_auto:good,w_1080/').replace('http://', 'https://');
    }
    return url;
  };

  const imageUrl = !imgError && listing.images && listing.images.length > 0
    ? getOptimizedImageUrl(listing.images[0])
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800';

  const typeGradient = TYPE_COLORS[listing.type] || 'from-primary-500 to-primary-700';
  const rating = listing.averageRating > 0 ? listing.averageRating.toFixed(1) : null;
  const amenities = listing.amenities || [];

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setAnimating(true);
    try {
      const res = await api.post(`/wishlist/${listing.id}`);
      setWishlisted(res.data.wishlisted);
      if (onWishlistChange) onWishlistChange(listing.id, res.data.wishlisted);
    } catch (err) {
      console.error('Wishlist error', err);
    }
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="h-full flex flex-col"
    >
      <Link
        to={`/listings/${listing.id}/${slugify(listing.title)}`}
        className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col h-full border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-primary-500/10 transition-shadow duration-300"
      >
      {/* Image */}
      <div className="relative h-52 sm:h-56 overflow-hidden bg-gray-100 dark:bg-slate-700">
        <img
          src={imageUrl}
          alt={listing.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent transition-opacity group-hover:opacity-90" />

        {/* Type badge top-left */}
        <div className="absolute top-3 left-3">
          <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white rounded-full bg-gradient-to-r ${typeGradient} shadow-lg`}>
            {listing.type}
          </span>
        </div>

        {/* Wishlist button top-right */}
        <button
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-md ${
            wishlisted
              ? 'bg-red-500 text-white shadow-red-500/40'
              : 'bg-white/85 text-gray-500 hover:text-red-500 hover:bg-white hover:scale-110'
          } ${animating ? 'scale-125' : ''}`}
        >
          <Heart size={17} className={wishlisted ? 'fill-white' : ''} />
        </button>

        {/* Price floating at bottom-left */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-bold text-primary-700 shadow-sm">
            ₹{listing.price?.toLocaleString('en-IN')}
            <span className="text-gray-500 font-normal text-xs">/mo</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-grow flex flex-col relative bg-white dark:bg-slate-800">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[17px] leading-tight text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">
            {listing.title}
          </h3>
          {/* Rating — only shown if real reviews exist */}
          {rating ? (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg flex-shrink-0">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-700">{rating}</span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">New</span>
          )}
        </div>

        {/* Verified badge */}
        {listing.owner?.kycStatus === 'APPROVED' && (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-1.5">
            <BadgeCheck size={13} className="fill-emerald-100" /> ID Verified Owner
          </span>
        )}

        {/* Location */}
        <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
          <MapPin size={13} className="text-primary-400 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                {AMENITY_ICONS[amenity] || ''} {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-lg font-semibold border border-primary-100">
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2">
          {/* Updated timestamp */}
          {listing.updatedAt && (
            <p className="text-[10px] text-gray-400 font-medium">{timeAgo(listing.updatedAt)}</p>
          )}
          <div className="flex items-center justify-between">
          {listing.owner ? (
            <div 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/owner/${listing.owner.id}`); }}
              className="flex items-center gap-2 z-10 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors -ml-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200">
                {listing.owner.profilePhoto ? (
                  <img src={listing.owner.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-primary-700">{listing.owner.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-700 hover:text-primary-600 truncate max-w-[150px]">
                {maskName(listing.owner.name)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-gray-400 font-medium">
              {listing.status === 'ACTIVE' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              ) : listing.status === 'RENTED' ? (
                <span className="text-red-400">Rented</span>
              ) : null}
            </div>
          )}
          <div className="flex items-center gap-3">
            {listing.owner && (
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (!isAuthenticated) {
                    navigate('/auth');
                  } else {
                    navigate(`/messages?user=${listing.owner.id}&text=Hi, I am interested in your property: ${listing.title}`); 
                  }
                }}
                className="z-10 text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors flex items-center"
                title="Message Owner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>
              </button>
            )}
            <span className="text-xs font-semibold text-primary-600 group-hover:underline transition-all">
              View Details →
            </span>
          </div>
          </div>
        </div>
      </div>
      </Link>
    </motion.div>
  );
};

export default ListingCard;
