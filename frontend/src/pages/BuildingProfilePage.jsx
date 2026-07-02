import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { Building2, MapPin, ArrowLeft, Star, User, Info, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const BuildingProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [building, setBuilding] = useState(null);
  const [listings, setListings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userReviewSummary, setUserReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form states
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBuildingAndData = async () => {
      setLoading(true);
      try {
        const [buildingRes, listingsRes, reviewsRes, summaryRes] = await Promise.all([
          api.get(`/buildings/${id}`),
          api.get(`/listings/building/${id}`),
          api.get(`/user-reviews/building/${id}`),
          api.get(`/user-reviews/building/${id}/summary`)
        ]);
        setBuilding(buildingRes.data);
        setListings(listingsRes.data);
        setUserReviews(reviewsRes.data);
        setUserReviewSummary(summaryRes.data);
      } catch (err) {
        console.error("Failed to fetch building details", err);
        setError("Could not load building profile. It may have been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingAndData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (newRating === 0) return;
    
    setSubmittingReview(true);
    try {
      await api.post(`/user-reviews/building/${id}`, { rating: newRating, comment: newComment });
      // Refresh reviews
      const [reviewsRes, summaryRes] = await Promise.all([
        api.get(`/user-reviews/building/${id}`),
        api.get(`/user-reviews/building/${id}/summary`),
      ]);
      setUserReviews(reviewsRes.data);
      setUserReviewSummary(summaryRes.data);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      console.error('Review error', err);
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
          <Building2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Building Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/listings')} className="btn-primary bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20">
          <ArrowLeft size={18} className="mr-2" /> Back to Listings
        </button>
      </div>
    );
  }

  const addedDate = building.createdAt ? new Date(building.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200 pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-transparent rounded-full -translate-y-32 -translate-x-32 opacity-70"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-indigo-600 mb-8 transition-colors text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Icon */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0 relative text-indigo-500">
              <Building2 size={64} />
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{building.name}</h1>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100 mx-auto md:mx-0 w-max">
                  {building.type || 'Building'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex flex-col md:flex-row items-center gap-1 md:gap-4 justify-center md:justify-start">
                <span className="flex items-center"><MapPin size={14} className="mr-1.5" /> {building.location}</span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Added {addedDate}</span>
              </p>

              {building.description && (
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 max-w-2xl border border-gray-100 mx-auto md:mx-0">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p>{building.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-6 mt-6 md:mt-0 flex-wrap justify-center">
              <div className="bg-indigo-50 rounded-2xl p-4 sm:p-6 border border-indigo-100 text-center min-w-[120px]">
                <p className="text-3xl font-extrabold text-indigo-600 mb-1">{listings.length}</p>
                <p className="text-[10px] sm:text-xs text-indigo-700 font-bold uppercase tracking-wider">Properties inside</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 sm:p-6 border border-amber-100 text-center min-w-[120px]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={24} className="text-amber-500 fill-amber-500" />
                  <span className="text-3xl font-extrabold text-amber-600">{userReviewSummary.averageRating > 0 ? userReviewSummary.averageRating.toFixed(1) : 'New'}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">{userReviewSummary.totalReviews} Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Info Snippet */}
      {building.owner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {building.owner.name?.charAt(0) || 'O'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-1">
                  Owned / Managed by {maskName(building.owner.name)}
                </h3>
                <p className="text-xs text-gray-500">Owner ID #{building.owner.id}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/owner/${building.owner.id}`)}
              className="px-6 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              View Owner Profile
            </button>
          </div>
        </div>
      )}

      {/* Listings Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <MapPin className="text-indigo-500 mr-2" /> Properties in {building.name}
        </h2>

        {listings.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Properties</h3>
            <p className="text-gray-500 text-sm">There are currently no active listings in this building.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <Star className="text-amber-500 fill-amber-500 mr-2" /> Reviews for {building.name}
        </h2>

        {/* Add Review Form */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-100/40 border border-gray-100 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
          <h3 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h3>
          {!user ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <p className="text-gray-600 text-sm mb-3">You must be logged in to leave a review.</p>
              <button onClick={() => navigate('/auth')} className="btn-primary text-sm py-2 px-6">Log In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={28} className={`${(hoverRating || newRating) >= star ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-gray-300'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                <textarea
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all min-h-[100px] resize-y"
                  placeholder="Share your experience with this building / society..."
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview || newRating === 0}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {userReviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <Star className="text-gray-300 mx-auto mb-3" size={32} />
              <h4 className="text-gray-900 font-bold mb-1">No reviews yet</h4>
              <p className="text-gray-500 text-sm">Be the first to review this building!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReviews.map((review) => (
                <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 border border-gray-200">
                        {review.reviewer?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{maskName(review.reviewer?.name)}</p>
                        <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-700">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingProfilePage;
