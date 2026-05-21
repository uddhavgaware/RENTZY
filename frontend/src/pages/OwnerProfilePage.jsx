import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { BadgeCheck, Calendar, MapPin, Mail, MessageCircle, ArrowLeft, Star, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const maskName = (name) => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed;
};

const OwnerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [owner, setOwner] = useState(null);
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
    const fetchOwnerAndListings = async () => {
      setLoading(true);
      try {
        const [userRes, listingsRes, reviewsRes, summaryRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/listings/owner/${id}`),
          api.get(`/user-reviews/user/${id}`),
          api.get(`/user-reviews/user/${id}/summary`)
        ]);
        setOwner(userRes.data);
        setListings(listingsRes.data);
        setUserReviews(reviewsRes.data);
        setUserReviewSummary(summaryRes.data);
      } catch (err) {
        console.error("Failed to fetch owner details", err);
        setError("Could not load owner profile. They may not exist or have deactivated their account.");
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerAndListings();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (newRating === 0) return;
    
    setSubmittingReview(true);
    try {
      await api.post(`/user-reviews/${id}`, { rating: newRating, comment: newComment });
      // Refresh reviews
      const [reviewsRes, summaryRes] = await Promise.all([
        api.get(`/user-reviews/user/${id}`),
        api.get(`/user-reviews/user/${id}/summary`),
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
            <div className="flex gap-4 sm:gap-6 mt-6 md:mt-0 flex-wrap justify-center">
              {owner.role === 'OWNER' && (
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 text-center min-w-[120px]">
                  <p className="text-3xl font-extrabold text-primary-600 mb-1">{listings.length}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Active Properties</p>
                </div>
              )}
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

      {/* Listings Section (Only for Owners) */}
      {owner.role === 'OWNER' && (
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
      )}

      {/* Reviews Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 border-t border-gray-200 pt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <Star className="text-amber-500 mr-2" /> Reviews for {owner.name}
        </h2>

        {/* Review Form */}
        {user && user.id !== owner.id && (
          <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-12">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= (hoverRating || newRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Share your experience with ${owner.name}...`}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-4 resize-none h-28 text-gray-800"
              required
            ></textarea>
            <button
              type="submit"
              disabled={submittingReview || newRating === 0}
              className="btn-primary"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {userReviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
              <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reviews yet.</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to review {owner.name}!</p>
            </div>
          ) : (
            userReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden">
                      {review.reviewer?.profilePhoto ? (
                        <img src={review.reviewer.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        review.reviewer?.name ? review.reviewer.name.charAt(0).toUpperCase() : <User size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{maskName(review.reviewer?.name) || 'Anonymous'}</h4>
                      <p className="text-xs text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-amber-100'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProfilePage;
