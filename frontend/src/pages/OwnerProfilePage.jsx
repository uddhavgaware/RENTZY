import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { BadgeCheck, Calendar, MapPin, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed.charAt(0).toUpperCase();
};

const OwnerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [owner, setOwner] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOwnerAndListings = async () => {
      setLoading(true);
      try {
        const [userRes, listingsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/listings/owner/${id}`)
        ]);
        setOwner(userRes.data);
        setListings(listingsRes.data);
      } catch (err) {
        console.error("Failed to fetch owner details", err);
        setError("Could not load owner profile. They may not exist or have deactivated their account.");
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerAndListings();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/listings')} className="btn-primary">
          <ArrowLeft size={18} className="mr-2" /> Back to Listings
        </button>
      </div>
    );
  }

  const joinDate = owner.createdAt ? new Date(owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200 pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-full -translate-y-32 translate-x-32 opacity-70"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-primary-600 mb-8 transition-colors text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0 relative">
              {owner.profilePhoto ? (
                <img src={owner.profilePhoto} alt={owner.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary-700">{owner.name?.charAt(0) || 'U'}</span>
              )}
              {owner.kycStatus === 'APPROVED' && (
                <div className="absolute bottom-1 right-3 bg-white rounded-full p-0.5 shadow-sm">
                  <BadgeCheck size={24} className="text-blue-500 fill-blue-50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{owner.name}</h1>
                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary-100 mx-auto md:mx-0 w-max">
                  {owner.role}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex flex-col md:flex-row items-center gap-1 md:gap-4 justify-center md:justify-start">
                <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Joined {joinDate}</span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="flex items-center">#{owner.id} Unique ID</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                {user?.id !== owner.id && (
                  <button 
                    onClick={() => navigate(`/messages?user=${owner.id}`)}
                    className="btn-primary shadow-primary-600/20"
                  >
                    <MessageCircle size={18} className="mr-2" /> Message Owner
                  </button>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 mt-6 md:mt-0 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-primary-600 mb-1">{listings.length}</p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Listings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <MapPin className="text-primary-500 mr-2" /> Properties by {owner.name}
        </h2>

        {listings.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Properties</h3>
            <p className="text-gray-500 text-sm">This owner currently has no properties listed on RentXY.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfilePage;
