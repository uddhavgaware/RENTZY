import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ListingCard = ({ listing, wishlisted: initialWishlisted = false, onWishlistChange }) => {
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800';

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = '/auth';
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
    setTimeout(() => setAnimating(false), 300);
  };
    
  return (
    <Link to={`/listings/${listing.id}`} className="group bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in">
      <div className="relative h-56 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <button 
            className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              wishlisted 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-white/80 text-gray-500 hover:text-red-500 hover:bg-white'
            } ${animating ? 'scale-125' : 'scale-100'}`}
            onClick={handleWishlistToggle}
          >
            <Heart size={18} className={wishlisted ? 'fill-white' : ''} />
          </button>
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white glass-dark rounded-full shadow-lg">
            {listing.type}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex items-center gap-1">
            {listing.title}
            {listing.owner?.kycStatus === 'APPROVED' && (
              <span className="flex items-center gap-1 text-green-600 text-[10px] font-medium leading-none ml-1"><BadgeCheck size={14} className="text-green-500 fill-green-100" /> Verified</span>
            )}
          </h3>
          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
            <Star className="text-yellow-400 fill-yellow-400 mr-1" size={14} />
            <span className="text-sm font-semibold text-gray-700">{listing.averageRating || listing.rating || '4.8'}</span>
          </div>
        </div>
        
        <p className="text-gray-500 text-sm flex items-center mb-4">
          <MapPin size={14} className="mr-1 text-gray-400" />
          {listing.location}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {(listing.amenities || []).slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              {amenity}
            </span>
          ))}
          {(listing.amenities || []).length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{listing.amenities.length - 3} more
            </span>
          )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-primary-600">₹{listing.price.toLocaleString('en-IN')}</span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
