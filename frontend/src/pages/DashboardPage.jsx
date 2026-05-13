import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Home, Heart, Settings, Bell, MessageSquare, LogOut, BookOpen, Edit3, Trash2, X, Save, Plus, BadgeCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import api from '../services/api';
import Modal from '../components/Modal';

const DashboardPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [savedListings, setSavedListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', role: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [kycFile, setKycFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [movingRequests, setMovingRequests] = useState([]);
  const [loadingMoving, setLoadingMoving] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (activeTab === 'saved') {
      setLoadingSaved(true);
      api.get('/wishlist/my').then(r => setSavedListings(r.data)).catch(() => {}).finally(() => setLoadingSaved(false));
    }
    if (activeTab === 'bookings') {
      setLoadingBookings(true);
      const endpoint = user?.role === 'OWNER' ? '/bookings/owner' : '/bookings/my';
      api.get(endpoint).then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoadingBookings(false));
    }
    if (activeTab === 'properties') {
      setLoadingListings(true);
      api.get('/listings/my').then(r => setMyListings(r.data)).catch(() => {}).finally(() => setLoadingListings(false));
    }
    if (activeTab === 'profile') {
      api.get('/users/me').then(r => { setProfile(r.data); setProfileForm({ name: r.data.name, phone: r.data.phone || '', role: r.data.role }); }).catch(() => {});
    }
    if (activeTab === 'notifications') {
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
    }
    if (activeTab === 'moving') {
      setLoadingMoving(true);
      api.get('/moving/my').then(r => setMovingRequests(r.data)).catch(() => {}).finally(() => setLoadingMoving(false));
    }
  }, [activeTab]);

  const handleCancelBooking = (bookingId, currentStatus) => {
    let confirmMsg = 'Cancel this booking?';
    if (currentStatus === 'CONFIRMED') {
      confirmMsg = 'WARNING: You have already paid for this booking. According to our policy, we are not responsible for any problems after booking and payment are done. Do you still want to cancel?';
    }
    showModal({
      type: 'confirm',
      title: 'Cancel Booking',
      message: confirmMsg,
      onConfirm: async () => {
        closeModal();
        try {
          await api.post(`/bookings/${bookingId}/cancel`);
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
        } catch (err) { showModal({ type: 'alert', title: 'Error', message: 'Failed to cancel', onConfirm: closeModal }); }
      },
      onCancel: closeModal
    });
  };

  const handleCancelMoving = (id) => {
    showModal({
      type: 'confirm',
      title: 'Cancel Request',
      message: 'Cancel this moving request?',
      onConfirm: async () => {
        closeModal();
        try {
          await api.post(`/moving/request/${id}/cancel`);
          setMovingRequests(prev => prev.map(m => m.id === id ? { ...m, status: 'CANCELLED' } : m));
        } catch (err) { showModal({ type: 'alert', title: 'Error', message: 'Failed to cancel request', onConfirm: closeModal }); }
      },
      onCancel: closeModal
    });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put('/users/me', profileForm);
      setProfile(res.data);
      setEditingProfile(false);
      await refreshUser(); // Sync Navbar without full page reload
    } catch (err) { 
      const errorMsg = err.response?.data?.message || 'Failed to save profile';
      showModal({ type: 'alert', title: 'Error', message: errorMsg, onConfirm: closeModal }); 
    }
    finally { setSavingProfile(false); }
  };

  const handleDeleteListing = (id) => {
    showModal({
      type: 'confirm',
      title: 'Delete Listing',
      message: 'Delete this listing permanently?',
      onConfirm: async () => {
        closeModal();
        try {
          await api.delete(`/listings/${id}`);
          setMyListings(prev => prev.filter(l => l.id !== id));
        } catch { showModal({ type: 'alert', title: 'Error', message: 'Failed to delete listing', onConfirm: closeModal }); }
      },
      onCancel: closeModal
    });
  };

  const handleUpdateListing = async (id) => {
    try {
      const res = await api.put(`/listings/${id}`, editForm);
      setMyListings(prev => prev.map(l => l.id === id ? res.data : l));
      setEditingListing(null);
    } catch { showModal({ type: 'alert', title: 'Error', message: 'Failed to update listing', onConfirm: closeModal }); }
  };

  const [kycDocType, setKycDocType] = useState('AADHAAR');
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [kycCameraActive, setKycCameraActive] = useState(false);
  const [kycPhotoDataUrl, setKycPhotoDataUrl] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Holds the MediaStream so we can attach it after video mounts

  // Attach stream to <video> element AFTER it mounts (when kycCameraActive becomes true)
  useEffect(() => {
    if (kycCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [kycCameraActive]);

  const startCamera = async () => {
    try {
      // Try back camera first (mobile), fall back to any camera (desktop)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      // Store stream in ref BEFORE setting state.
      // The <video> element only mounts after kycCameraActive=true,
      // so we cannot access videoRef.current yet — the useEffect above handles attachment.
      streamRef.current = stream;
      setKycCameraActive(true);
    } catch (err) {
      showModal({ type: 'alert', title: 'Camera Error', message: 'Camera access denied. Please allow camera permission in your browser settings and try again.', onConfirm: closeModal });
    }
  };

  const stopCamera = () => {
    // Stop all tracks via streamRef (videoRef may be null after unmount)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setKycCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setKycPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setKycPhotoDataUrl(null);
    startCamera();
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleKycSubmit = async () => {
    if (!kycPhotoDataUrl || !kycDocNumber || !kycDocType) {
       showModal({ type: 'alert', title: 'Incomplete', message: "Please complete all details and take a live photo.", onConfirm: closeModal });
       return;
    }
    setUploadingKyc(true);
    try {
      const file = dataURLtoFile(kycPhotoDataUrl, 'kyc-document.jpg');
      const formData = new FormData();
      formData.append('files', file);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const documentUrl = uploadRes.data[0];
      const kycRes = await api.post('/users/kyc', { 
        documentUrl, 
        documentType: kycDocType, 
        documentNumber: kycDocNumber 
      });
      setProfile(prev => ({ 
        ...prev, 
        kycStatus: kycRes.data.kycStatus, 
        kycDocumentUrl: documentUrl,
        kycDocumentType: kycDocType,
        kycDocumentNumber: kycDocNumber
      }));
      showModal({ type: 'alert', title: 'Success', message: 'KYC Document submitted successfully for review.', onConfirm: closeModal });
      setKycPhotoDataUrl(null);
      setKycDocNumber('');
    } catch (err) {
      showModal({ type: 'alert', title: 'Upload Failed', message: 'Failed to upload KYC document.', onConfirm: closeModal });
    } finally {
      setUploadingKyc(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'bookings', name: 'My Bookings', icon: BookOpen },
    { id: 'properties', name: 'My Properties', icon: Home },
    { id: 'moving', name: 'Moving Requests', icon: Truck },
    { id: 'saved', name: 'Saved', icon: Heart },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const statusColors = { CONFIRMED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700' };

  const confirmLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
    <div className="bg-gray-50 min-h-screen pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 mt-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your account and properties</p>
          </div>
          <button onClick={() => showModal({ type: 'confirm', title: 'Sign Out', message: 'Are you sure you want to sign out of your account?', onConfirm: confirmLogout, onCancel: closeModal })} className="flex items-center text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={18} className="mr-2" />Sign Out
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <div className="flex items-center space-x-4 mb-6 p-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{user?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500">{user?.role || 'Account'}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <Icon size={18} className={`mr-3 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`} />{tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  {!editingProfile && <button onClick={() => setEditingProfile(true)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"><Edit3 size={16} />Edit</button>}
                </div>
                {profile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      {editingProfile ? (
                        <input type="text" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{profile.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      {editingProfile ? (
                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{profile.phone || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      {editingProfile ? (
                        <select value={profileForm.role} onChange={e => setProfileForm(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                          <option value="TENANT">Tenant</option>
                          <option value="OWNER">Owner</option>
                          <option value="MOVER">Mover (Vendor)</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 capitalize">{profile.role?.toLowerCase()}</p>
                      )}
                    </div>
                    {profile.createdAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                        <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                )}
                {editingProfile && (
                  <div className="mt-6 flex gap-3">
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
                      <Save size={16} />{savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditingProfile(false)} className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                  </div>
                )}

                {/* Identity Verification (KYC) */}
                {profile && (profile.role === 'OWNER' || profile.role === 'MOVER') && (
                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Identity Verification (KYC)</h2>
                    
                    {profile.kycStatus === 'APPROVED' && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <BadgeCheck className="text-green-600" />
                        <div>
                          <p className="font-bold">Account Verified</p>
                          <p className="text-sm">Your identity has been verified. The verified badge is displayed on your listings.</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.kycStatus === 'PENDING' && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center">
                          <svg className="w-3 h-3 text-yellow-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z"/></svg>
                        </div>
                        <div>
                          <p className="font-bold">Verification Pending</p>
                          <p className="text-sm">Your KYC will be approved in 2 to 3 working days.</p>
                        </div>
                      </div>
                    )}

                    {(profile.kycStatus === 'NONE' || profile.kycStatus === 'REJECTED' || !profile.kycStatus) && (
                      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                        {profile.kycStatus === 'REJECTED' && (
                          <div className="mb-4 text-red-600 text-sm font-medium">Your previous KYC submission was rejected. Please resubmit valid details.</div>
                        )}
                        <p className="text-gray-600 text-sm mb-4">Complete your identity verification to get the "Verified" badge.</p>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                              <select 
                                value={kycDocType} 
                                onChange={(e) => setKycDocType(e.target.value)} 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                              >
                                <option value="AADHAAR">Aadhaar Card</option>
                                <option value="PAN">PAN Card</option>
                                <option value="VOTER_ID">Voter ID</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{kycDocType === 'AADHAAR' ? 'Aadhaar Number (12 digits)' : kycDocType === 'PAN' ? 'PAN Number (10 chars)' : 'Voter ID Number'}</label>
                              <input 
                                type="text" 
                                value={kycDocNumber} 
                                onChange={(e) => setKycDocNumber(e.target.value)} 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none uppercase" 
                                placeholder="Enter document number"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Live Photo of Document</label>
                            
                            {!kycPhotoDataUrl && !kycCameraActive && (
                              <button 
                                onClick={startCamera} 
                                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 hover:border-primary-500 transition-colors"
                              >
                                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-2">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <span className="text-gray-600 font-medium">Click to Start Camera</span>
                                <span className="text-xs text-gray-400 mt-1">Please ensure good lighting and clear text</span>
                              </button>
                            )}

                            {kycCameraActive && (
                              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                  <button onClick={stopCamera} className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">Cancel</button>
                                  <button onClick={capturePhoto} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg transition-colors">Capture Photo</button>
                                </div>
                              </div>
                            )}

                            {kycPhotoDataUrl && (
                              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                <img src={kycPhotoDataUrl} alt="Captured Document" className="w-full h-full object-contain" />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                  <button onClick={retakePhoto} className="bg-white/80 hover:bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors">Retake Photo</button>
                                </div>
                              </div>
                            )}
                            
                            <canvas ref={canvasRef} className="hidden"></canvas>
                          </div>

                          <div className="pt-4 flex justify-end">
                            <button 
                              onClick={handleKycSubmit} 
                              disabled={!kycPhotoDataUrl || !kycDocNumber || uploadingKyc} 
                              className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50 transition-colors"
                            >
                              {uploadingKyc ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
                {user?.role === 'OWNER' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 text-sm">
                    <strong>Important Note:</strong> Accepting a booking does <strong>not</strong> automatically hide your property. If your property is fully rented out, please go to the <strong>My Properties</strong> tab and change its status to <strong>Rented</strong> so tenants stop seeing it in search results.
                  </div>
                )}
                {loadingBookings ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-500 mb-6">Your booking history will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className="border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                        <Link to={`/listings/${booking.listing?.id}`} className="flex items-center gap-4 group cursor-pointer">
                          <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors"><Home size={24} className="text-primary-600" /></div>
                          <div>
                            <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{booking.listing?.title || 'Property'}</span>
                            <p className="text-sm text-gray-500">{booking.listing?.location}</p>
                            <p className="text-xs text-gray-400 mt-1">Booked {new Date(booking.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>
                        </Link>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="font-bold text-primary-600">₹{booking.amount?.toLocaleString('en-IN')}</p>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                            {booking.status === 'PENDING' ? (user?.role === 'OWNER' ? 'PENDING CONFIRMATION' : 'PAY DIRECT TO OWNER') : booking.status}
                          </span>
                          <div className="flex gap-2 mt-1">
                            {booking.status === 'PENDING' && user?.role === 'OWNER' && (
                              <button onClick={() => {
                                showModal({
                                  type: 'confirm', title: 'Confirm Booking', message: 'Confirm that you have received payment and want to accept this booking?',
                                  onConfirm: async () => { closeModal(); try { await api.post(`/bookings/${booking.id}/confirm`); setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b)); } catch {} },
                                  onCancel: closeModal
                                });
                              }} className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 bg-green-50 rounded">Accept Booking</button>
                            )}
                            {booking.status !== 'CANCELLED' && (
                              <button onClick={() => handleCancelBooking(booking.id, booking.status)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded">Cancel Booking</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
                  <a href="/post-property" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"><Plus size={16} />Add Property</a>
                </div>
                {loadingListings ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                ) : myListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Home className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No properties listed</h3>
                    <p className="text-gray-500 mb-6">List your property and start earning.</p>
                    <a href="/post-property" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700">Post Property</a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myListings.map(listing => (
                      <div key={listing.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        {editingListing === listing.id ? (
                          <div className="space-y-3">
                            <input value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Title" />
                            <div className="flex gap-3">
                              <input type="number" value={editForm.price || ''} onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} className="flex-1 border rounded-xl px-4 py-2 text-sm" placeholder="Price" />
                              <input value={editForm.location || ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className="flex-1 border rounded-xl px-4 py-2 text-sm" placeholder="Location" />
                            </div>
                            <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Description" />
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateListing(listing.id)} className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700">Save</button>
                              <button onClick={() => setEditingListing(null)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <Link to={`/listings/${listing.id}`} className="flex items-center gap-4 group cursor-pointer flex-1 min-w-0">
                              <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200'} alt="" className="w-20 h-20 rounded-xl object-cover group-hover:opacity-90 transition-opacity flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{listing.title}</span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${listing.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : listing.status === 'RENTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {listing.status || 'ACTIVE'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">{listing.location}</p>
                                <p className="text-primary-600 font-bold mt-1">₹{listing.price?.toLocaleString('en-IN')}/mo</p>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={listing.status || 'ACTIVE'}
                                onChange={async (e) => {
                                  try {
                                    const res = await api.patch(`/listings/${listing.id}/status`, { status: e.target.value });
                                    setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: res.data.status } : l));
                                  } catch { showModal({ type: 'alert', title: 'Error', message: 'Failed to update status', onConfirm: closeModal }); }
                                }}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="RENTED">Rented</option>
                              </select>
                              <button onClick={() => { setEditingListing(listing.id); setEditForm({ title: listing.title, price: listing.price, location: listing.location, description: listing.description }); }} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                              <button onClick={() => handleDeleteListing(listing.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAVED TAB */}
            {activeTab === 'saved' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved & Shortlisted</h2>
                {loadingSaved ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                ) : savedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Heart className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No saved properties</h3>
                    <p className="text-gray-500 mb-6">Properties you heart will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} wishlisted={true} onWishlistChange={(id, added) => { if (!added) setSavedListings(prev => prev.filter(l => l.id !== id)); }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                  {notifications.some(n => !n.isRead) && (
                    <button onClick={async () => { await api.put('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }} className="text-sm text-primary-600 font-medium hover:underline">Mark all as read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Bell className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-colors ${n.isRead ? 'border-gray-100 bg-white' : 'border-primary-200 bg-primary-50/50'}`}>
                        <p className="text-gray-800 text-sm">{n.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.type === 'BOOKING' ? 'bg-blue-100 text-blue-700' : n.type === 'PAYMENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{n.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MOVING REQUESTS TAB */}
            {activeTab === 'moving' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Moving Requests</h2>
                  <a href="/movers" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"><Plus size={16} />New Request</a>
                </div>
                {loadingMoving ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                ) : movingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Truck className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No moving requests</h3>
                    <p className="text-gray-500 mb-6">You haven't requested any packing and moving services yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {movingRequests.map(req => (
                      <div key={req.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {req.status}
                            </span>
                            {req.status === 'PENDING' && (
                              <button onClick={() => handleCancelMoving(req.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel Request</button>
                            )}
                            {req.status === 'ASSIGNED' && (
                              <button onClick={() => {
                                showModal({
                                  type: 'confirm', title: 'Complete Request', message: 'Confirm that the movers have completed this job?',
                                  onConfirm: async () => { closeModal(); try { await api.put(`/moving/vendor/${req.id}/complete`); setMovingRequests(prev => prev.map(m => m.id === req.id ? { ...m, status: 'COMPLETED' } : m)); } catch {} },
                                  onCancel: closeModal
                                });
                              }} className="text-xs text-green-600 hover:text-green-800 font-medium">Mark Completed</button>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">Requested on {new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 font-medium">From</p>
                            <p className="text-sm font-bold text-gray-900">{req.fromLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">To</p>
                            <p className="text-sm font-bold text-gray-900">{req.toLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Date</p>
                            <p className="text-sm font-bold text-gray-900">{req.movingDate}</p>
                            {req.movingTime && <p className="text-xs text-primary-600 font-medium mt-0.5">{req.movingTime}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Size</p>
                            <p className="text-sm font-bold text-gray-900">{req.propertySize}</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-50 pt-3 flex justify-between items-center">
                          <span className="text-sm text-gray-500">Estimated Price:</span>
                          <span className="font-bold text-primary-600">₹{req.estimatedPrice?.toLocaleString('en-IN')}</span>
                        </div>
                        {req.mover && (
                          <div className="mt-4 bg-primary-50 rounded-xl p-3 flex items-center justify-between border border-primary-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-200 text-primary-800 rounded-lg flex items-center justify-center font-bold">
                                {req.mover.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{req.mover.name}</p>
                                <p className="text-xs text-primary-700 font-medium">{req.mover.phone}</p>
                              </div>
                            </div>
                            <span className="text-xs bg-white text-primary-600 px-2 py-1 rounded font-bold border border-primary-200">
                              Assigned Vendor
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fadeIn text-center py-12">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-500">This feature is coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <Modal {...modalConfig} onCancel={closeModal} />
    </>
  );
};

export default DashboardPage;
