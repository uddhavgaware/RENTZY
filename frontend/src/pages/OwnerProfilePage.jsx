import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { BadgeCheck, Calendar, MapPin, MessageCircle, ArrowLeft, Star, User, Building2, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

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
  const [buildings, setBuildings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userReviewSummary, setUserReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchOwnerAndListings = async () => {
      setLoading(true);
      try {
        const [userRes, listingsRes, buildingsRes, reviewsRes, summaryRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/listings/owner/${id}`),
          api.get(`/buildings/owner/${id}`),
          api.get(`/user-reviews/user/${id}`),
          api.get(`/user-reviews/user/${id}/summary`)
        ]);
        setOwner(userRes.data);
        setListings(listingsRes.data);
        setBuildings(buildingsRes.data);
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
      const [reviewsRes, summaryRes] = await Promise.all([
        api.get(`/user-reviews/user/${id}`),
        api.get(`/user-reviews/user/${id}/summary`),
      ]);
      setUserReviews(reviewsRes.data);
      setUserReviewSummary(summaryRes.data);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
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
  const avgRating = userReviewSummary.averageRating > 0 ? userReviewSummary.averageRating.toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">

      {/* Hero Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-primary-100/60 to-indigo-100/40 dark:from-primary-900/20 dark:to-indigo-900/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-gradient-to-tr from-purple-100/40 to-transparent dark:from-purple-900/10 rounded-full blur-2xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-8 transition-colors text-sm font-semibold group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="relative flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center">
                {owner.profilePhoto ? (
                  <img src={owner.profilePhoto} alt={owner.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white">{owner.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              {owner.kycStatus === 'APPROVED' && (
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md border border-gray-100 dark:border-white/10">
                  <BadgeCheck size={22} className="text-blue-500" />
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{owner.name}</h1>
                {owner.kycStatus === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-700/30 mx-auto md:mx-0 w-max">
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6 flex items-center gap-3 justify-center md:justify-start flex-wrap">
                <span className="flex items-center gap-1"><Calendar size={13} /> Joined {joinDate}</span>
                <span className="text-gray-300 dark:text-white/20">•</span>
                <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-md text-xs font-bold">{owner.role}</span>
              </p>
              {user?.id !== owner.id && (
                <button onClick={() => navigate(`/messages?user=${owner.id}`)} className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95 shadow-md">
                  <MessageCircle size={16} /> Message Owner
                </button>
              )}
            </motion.div>

            {/* Stats */}
            {owner.role === 'OWNER' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex flex-row md:flex-col gap-3 flex-wrap justify-center">
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                  <p className="text-2xl font-black text-primary-600 dark:text-primary-400">{listings.length}</p>
                  <p className="text-[10px] text-primary-700 dark:text-primary-400 font-bold uppercase tracking-wider mt-0.5">Properties</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{buildings.length}</p>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Buildings</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Star size={18} className="text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{avgRating || '—'}</span>
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">{userReviewSummary.totalReviews} Reviews</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-14">

        {/* Properties */}
        {owner.role === 'OWNER' && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Home size={18} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Properties by {owner.name}</h2>
            </div>
            {listings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                <p className="text-gray-500 font-semibold text-sm">No active properties listed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            )}
          </section>
        )}

        {/* Buildings */}
        {owner.role === 'OWNER' && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Buildings &amp; Societies</h2>
            </div>
            {buildings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-indigo-200 dark:border-indigo-800/30 rounded-3xl p-12 text-center">
                <p className="text-gray-500 font-semibold text-sm">No buildings added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {buildings.map(building => (
                  <motion.div key={building.id} whileHover={{ y: -4 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm hover:shadow-lg transition-all">
                    <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                      <Building2 size={22} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{building.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><MapPin size={11} className="text-gray-400" /> {building.location}</p>
                    <button onClick={() => navigate(`/buildings/${building.id}`)} className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-sm rounded-xl transition-colors">
                      View Profile →
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Reviews */}
        <section className="border-t border-gray-100 dark:border-white/10 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Star size={18} className="text-amber-500 fill-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Reviews for {owner.name}</h2>
          </div>

          {user && user.id !== owner.id && (
            <form onSubmit={handleSubmitReview} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm mb-8">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setNewRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none transition-transform hover:scale-110">
                    <Star size={26} className={`${star <= (hoverRating || newRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'} transition-colors`} />
                  </button>
                ))}
              </div>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={`Share your experience with ${owner.name}...`} className="w-full p-4 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mb-4 resize-none h-24 text-sm" required />
              <button type="submit" disabled={submittingReview || newRating === 0} className="bg-gray-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {userReviews.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/10">
              <Star className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userReviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm overflow-hidden flex-shrink-0">
                        {review.reviewer?.profilePhoto ? <img src={review.reviewer.profilePhoto} alt="" className="w-full h-full object-cover" /> : review.reviewer?.name ? review.reviewer.name.charAt(0).toUpperCase() : <User size={14} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{maskName(review.reviewer?.name) || 'Anonymous'}</h4>
                        <p className="text-[11px] text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-amber-100 dark:text-amber-900'} />)}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OwnerProfilePage;
