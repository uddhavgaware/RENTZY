import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, AirVent, Tv, Wind, Car, Shield, Dumbbell, CheckCircle2, ArrowLeft, Heart, Send, User, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';

const amenityIcons = {
  'WiFi': Wifi, 'AC': AirVent, 'TV': Tv, 'Fridge': Wind,
  'Washing Machine': Wind, 'Parking': Car, 'Security': Shield, 'Gym': Dumbbell,
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
      } catch (err) {
        console.error('Error fetching data', err);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <p className="text-xl font-medium">Property not found.</p>
        <button onClick={() => navigate('/listings')} className="mt-4 text-primary-600 hover:underline">
          Back to Listings
        </button>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [fallbackImage];
  const avgRating = reviewSummary.averageRating;
  const totalReviews = reviewSummary.totalReviews;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {showPayment && (
        <PaymentModal listing={listing} bookingId={bookingId} onClose={() => setShowPayment(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button */}
        <button onClick={() => navigate('/listings')} className="flex items-center text-gray-600 hover:text-primary-600 mb-6 font-medium transition-colors">
          <ArrowLeft size={18} className="mr-2" />
          Back to Listings
        </button>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
          <div className="md:col-span-2">
            <img src={images[activeImage]} alt={listing.title} className="w-full h-[380px] object-cover" />
          </div>
          <div className="grid grid-rows-2 gap-3">
            {images.slice(1, 3).map((img, idx) => (
              <img key={idx} src={img} alt="" className="w-full h-[185px] object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActiveImage(idx + 1)} />
            ))}
            {images.length <= 2 && (
              <div className="w-full h-[185px] bg-gray-200 flex items-center justify-center text-gray-400 rounded-xl">
                <span className="text-sm">No more photos</span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {images.map((img, idx) => (
              <img key={idx} src={img} alt="" onClick={() => setActiveImage(idx)} className={`h-16 w-24 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${activeImage === idx ? 'ring-2 ring-primary-600' : 'opacity-60 hover:opacity-90'}`} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-primary-600 rounded-full">
                  {listing.type}
                </span>
                <div className="flex items-center text-yellow-500">
                  <Star size={16} className="fill-yellow-400" />
                  <span className="ml-1 font-semibold text-gray-700">{avgRating || 'New'}</span>
                  <span className="text-gray-400 text-sm ml-1">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center text-gray-500">
                <MapPin size={16} className="mr-1" />
                <span>{listing.location}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description || 'No description provided.'}</p>
              
              {/* Owner Info Profile Snippet */}
              {listing.owner && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl">
                      {listing.owner.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-1">
                        Hosted by {listing.owner.name}
                        {listing.owner?.kycStatus === 'APPROVED' && (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium ml-2"><BadgeCheck size={18} className="text-green-500 fill-green-100" /> Verified</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">Joined {new Date(listing.owner.createdAt || Date.now()).getFullYear()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {listing.videoLink && getEmbedUrl(listing.videoLink) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Virtual Tour</h2>
                <div className="rounded-xl overflow-hidden bg-gray-100">
                  <iframe 
                    src={getEmbedUrl(listing.videoLink)} 
                    title="Property Video Tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full min-h-[400px] border-0"
                  ></iframe>
                </div>
              </div>
            )}

            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">What's included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {listing.amenities.map((amenity, idx) => {
                    const Icon = amenityIcons[amenity] || CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
              {listing.latitude && listing.longitude ? (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <iframe
                    title="Property Location"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.01},${listing.latitude - 0.01},${listing.longitude + 0.01},${listing.latitude + 0.01}&layer=mapnik&marker=${listing.latitude},${listing.longitude}`}
                  ></iframe>
                  <a
                    href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors bg-gray-50 border-t border-gray-200"
                  >
                    <MapPin size={16} />
                    View on Google Maps — {listing.location}
                  </a>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <MapPin size={32} className="mx-auto mb-2 text-primary-600" />
                    <p className="font-semibold text-gray-800">{listing.location}</p>
                    <p className="text-sm text-gray-500 mt-1">Exact map location not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Reviews Section ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
                <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-gray-50 rounded-xl">
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
                <div className="mb-8 p-5 bg-gray-50 rounded-xl text-center">
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
                    <div key={review.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{review.user?.name || 'Anonymous'}</h4>
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sticky top-24">
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-600">₹{listing.price?.toLocaleString('en-IN')}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Monthly Rent</span>
                  <span className="font-semibold text-gray-900">₹{listing.price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Security Deposit</span>
                  <span className="font-semibold text-gray-900">₹{(listing.price * 2)?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Total Due Now</span>
                  <span className="font-bold text-primary-700">₹{(listing.price * 3)?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 leading-snug">
                    <strong>I agree to the Booking & Payment Policy:</strong> We are not responsible for any problems after booking and payment are done.
                  </span>
                </label>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleBook(true)}
                  disabled={!agreed}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-primary-600/20 flex flex-col items-center justify-center leading-tight"
                >
                  <span>Book & Pay Now</span>
                  <span className="text-xs font-medium text-primary-200 mt-0.5">Confirm instantly</span>
                </button>
                <button
                  onClick={() => handleBook(false)}
                  disabled={!agreed}
                  className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 border-2 border-primary-600 text-primary-600 py-3 rounded-xl font-bold text-base transition-all active:scale-95 shadow-sm"
                >
                  Pay Directly to Owner (Cash/Online)
                </button>
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mt-3">
                  <p className="text-xs text-orange-800 font-medium text-center">
                    Note: Payment Gateway is currently under development for testing. You can successfully use the "Pay Directly to Owner" option above.
                  </p>
                </div>
              </div>
              <button
                onClick={handleWishlistToggle}
                className={`w-full mt-3 border py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  wishlisted
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
                {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
              
              <button
                onClick={handleContactOwner}
                className="w-full mt-3 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} />
                Contact Owner
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4">
                You won't be charged yet. Review details before confirming.
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
