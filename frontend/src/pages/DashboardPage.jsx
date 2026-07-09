import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { User, Users, Home, Heart, Settings, Bell, MessageSquare, LogOut, BookOpen, Edit3, Trash2, X, Save, Plus, BadgeCheck, Truck, ShieldCheck, Phone, Mail, Split, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import api from '../services/api';
import Modal from '../components/Modal';
import ImageCropperModal from '../components/ImageCropperModal';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

const truckIcon = divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-10 h-10 flex items-center justify-center">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-35 animate-ping"></div>
        <div class="relative w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500">
          🚚
        </div>
      </div>
    </div>
  `,
  className: 'custom-truck-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

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

const DashboardPage = () => {
  const navigate = useNavigate();
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
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', role: '', profilePhoto: '', city: '', upiId: '', upiQrUrl: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [kycFile, setKycFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [movingRequests, setMovingRequests] = useState([]);
  const [loadingMoving, setLoadingMoving] = useState(false);
  const [roommateRequests, setRoommateRequests] = useState({ sent: [], received: [] });
  const [loadingRoommates, setLoadingRoommates] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: '', comments: '' });
  const [userSettings, setUserSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    darkMode: localStorage.getItem('theme') === 'dark'
  });

  // Crop state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (userSettings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [userSettings.darkMode]);

  const handleDeleteAccount = async () => {
    try {
      await api.post('/users/request-delete');
      showModal({
        type: 'alert',
        title: 'Request Submitted',
        message: 'Your account deletion request has been submitted to the admin team and will be processed shortly. You will be logged out now.',
        onConfirm: () => {
          closeModal();
          logout();
        }
      });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to submit deletion request.', onConfirm: closeModal });
    }
  };

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (activeTab === 'saved') {
      setLoadingSaved(true);
      api.get('/wishlist/my').then(r => setSavedListings(r.data)).catch(() => { }).finally(() => setLoadingSaved(false));
    }
    if (activeTab === 'bookings') {
      setLoadingBookings(true);
      const endpoint = user?.role === 'OWNER' ? '/bookings/owner' : '/bookings/my';
      api.get(endpoint).then(r => setBookings(r.data)).catch(() => { }).finally(() => setLoadingBookings(false));
    }
    if (activeTab === 'properties') {
      setLoadingListings(true);
      api.get('/listings/my').then(r => setMyListings(r.data)).catch(() => { }).finally(() => setLoadingListings(false));
    }
    if (activeTab === 'profile') {
      api.get('/users/me').then(r => { setProfile(r.data); setProfileForm({ name: r.data.name, phone: r.data.phone || '', role: r.data.role, profilePhoto: r.data.profilePhoto || '', city: r.data.city || '', upiId: r.data.upiId || '', upiQrUrl: r.data.upiQrUrl || '', contactShared: r.data.contactShared || false }); }).catch(() => { });
    }
    if (activeTab === 'notifications') {
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => { });
    }
    if (activeTab === 'moving') {
      setLoadingMoving(true);
      const fetchMoving = () => api.get('/moving/my').then(r => setMovingRequests(r.data)).catch(() => { });
      fetchMoving().finally(() => setLoadingMoving(false));
      
      const interval = setInterval(() => {
        api.get('/moving/my').then(r => setMovingRequests(r.data)).catch(() => { });
      }, 5000); // Poll every 5 seconds for live tracking updates
      
      return () => clearInterval(interval);
    }
    if (activeTab === 'roommates') {
      setLoadingRoommates(true);
      Promise.all([
        api.get('/roommates/requests/my').catch(() => ({ data: [] })),
        api.get('/roommates/requests/received').catch(() => ({ data: [] }))
      ]).then(([sentRes, receivedRes]) => {
        setRoommateRequests({ sent: sentRes.data, received: receivedRes.data });
      }).finally(() => setLoadingRoommates(false));
    }
  }, [activeTab]);

  const enableNotifications = async () => {
    try {
      if (!('Notification' in window)) {
        showModal({ type: 'alert', title: 'Not Supported', message: 'Push notifications are not supported in your browser.', onConfirm: closeModal });
        return;
      }
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const { setupPushNotifications } = await import('../utils/pushNotification');
        await setupPushNotifications();
        showModal({ type: 'success', title: 'Enabled', message: 'You will now receive instant push notifications.', onConfirm: closeModal });
      } else {
        showModal({ type: 'alert', title: 'Denied', message: 'You must allow notifications in your browser settings.', onConfirm: closeModal });
      }
    } catch (e) {
      console.error(e);
    }
  };


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
      const payload = { ...profileForm, contactShared: String(profileForm.contactShared) };
      const res = await api.put('/users/me', payload);
      setProfile(res.data);
      setEditingProfile(false);
      await refreshUser(); // Sync Navbar without full page reload
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save profile';
      showModal({ type: 'alert', title: 'Error', message: errorMsg, onConfirm: closeModal });
    }
    finally { setSavingProfile(false); }
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showModal({ type: 'alert', title: 'Error', message: 'Profile photo must be less than 2MB', onConfirm: closeModal });
      return;
    }

    // Open cropper with object URL
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropper(true);
    e.target.value = null; // reset input
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    setImageToCrop(null);
    setSavingProfile(true);

    try {
      const uploadData = new FormData();
      uploadData.append('files', croppedBlob, 'profile_cropped.jpg');
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.length > 0) {
        setProfileForm(prev => ({ ...prev, profilePhoto: res.data[0] }));
      }
    } catch (err) {
      showModal({ type: 'alert', title: 'Upload Failed', message: 'Failed to upload cropped profile photo.', onConfirm: closeModal });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpiQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showModal({ type: 'alert', title: 'Error', message: 'QR Code image must be less than 2MB', onConfirm: closeModal });
      return;
    }

    setSavingProfile(true);
    try {
      const uploadData = new FormData();
      uploadData.append('files', file);
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.length > 0) {
        setProfileForm(prev => ({ ...prev, upiQrUrl: res.data[0] }));
      }
    } catch (err) {
      showModal({ type: 'alert', title: 'Upload Failed', message: 'Failed to upload QR code.', onConfirm: closeModal });
    } finally {
      setSavingProfile(false);
    }
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
  const [kycPhotos, setKycPhotos] = useState({ front: null, back: null, face: null, licence: null });
  const [kycCurrentCapture, setKycCurrentCapture] = useState(null);
  const [kycFacingMode, setKycFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Holds the MediaStream so we can attach it after video mounts
  const [faceDetected, setFaceDetected] = useState(false);
  const [docDetected, setDocDetected] = useState(false);
  const animationFrameRef = useRef(null);

  // Attach stream to <video> element AFTER it mounts (when kycCameraActive becomes true)
  useEffect(() => {
    let timerId;
    if (kycCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { });

      if (kycCurrentCapture === 'face') {
        setFaceDetected(false);
        const scanFace = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(scanFace);
            return;
          }
          if ('FaceDetector' in window) {
            try {
              const detector = new window.FaceDetector({ maxDetectedFaces: 1 });
              const faces = await detector.detect(videoRef.current);
              setFaceDetected(faces.length > 0);
            } catch (e) {
              if (!faceDetected) timerId = setTimeout(() => setFaceDetected(true), 2500);
            }
          } else {
            if (!faceDetected) timerId = setTimeout(() => setFaceDetected(true), 2500);
          }
          animationFrameRef.current = requestAnimationFrame(scanFace);
        };
        scanFace();
      } else if (kycCurrentCapture) {
        setDocDetected(false);
        timerId = setTimeout(() => setDocDetected(true), 2000);
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerId) clearTimeout(timerId);
    };
  }, [kycCameraActive, kycCurrentCapture]);

  const startCamera = async (step) => {
    try {
      let stream;
      const facing = step === 'face' ? 'user' : kycFacingMode;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setKycCurrentCapture(step);
      setKycCameraActive(true);
    } catch (err) {
      console.error('Camera Error:', err);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showModal({ type: 'alert', title: 'Not Supported', message: 'Camera access requires a secure connection (HTTPS or localhost). If you are testing on a local network IP, it will not work.', onConfirm: closeModal });
      } else {
        showModal({ type: 'alert', title: 'Camera Error', message: 'Camera access denied or no camera found. Please allow camera permission and try again.', onConfirm: closeModal });
      }
    }
  };

  const toggleCamera = () => {
    const newFacing = kycFacingMode === 'environment' ? 'user' : 'environment';
    setKycFacingMode(newFacing);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: newFacing } } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => { });
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
    if (videoRef.current && canvasRef.current && kycCurrentCapture) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setKycPhotos(prev => ({ ...prev, [kycCurrentCapture]: dataUrl }));
      stopCamera();
      setKycCurrentCapture(null);
    }
  };

  const retakePhoto = (step) => {
    setKycPhotos(prev => ({ ...prev, [step]: null }));
    startCamera(step);
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  const handleKycSubmit = async () => {
    if (!profile?.name || !profile?.phone || !profile?.city) {
      showModal({ type: 'alert', title: 'Incomplete Profile', message: 'Please complete your Profile Details (Name, Phone, City) before submitting KYC.', onConfirm: closeModal });
      return;
    }
    if (!kycPhotos.front || !kycPhotos.back || !kycPhotos.face || !kycDocNumber || !kycDocType || (profile?.role === 'MOVER' && !kycPhotos.licence)) {
      showModal({ type: 'alert', title: 'Incomplete', message: profile?.role === 'MOVER' ? "Please capture all documents including Driving Licence and provide document details." : "Please capture front, back, and face photos, and provide document details.", onConfirm: closeModal });
      return;
    }
    setUploadingKyc(true);
    try {
      const formData = new FormData();
      formData.append('files', dataURLtoFile(kycPhotos.front, 'front.jpg'));
      formData.append('files', dataURLtoFile(kycPhotos.back, 'back.jpg'));
      formData.append('files', dataURLtoFile(kycPhotos.face, 'face.jpg'));
      if (profile?.role === 'MOVER' && kycPhotos.licence) {
        formData.append('files', dataURLtoFile(kycPhotos.licence, 'licence.jpg'));
      }

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const documentUrl = uploadRes.data.join(',');

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
      setKycPhotos({ front: null, back: null, face: null });
      setKycDocNumber('');
    } catch (err) {
      showModal({ type: 'alert', title: 'Upload Failed', message: 'Failed to upload KYC document.', onConfirm: closeModal });
    } finally {
      setUploadingKyc(false);
    }
  };

  const getRoleTabs = () => {
    const role = user?.role || 'TENANT';
    let baseTabs = [
      { id: 'profile', name: 'My Profile', icon: User },
    ];

    if (role === 'OWNER') {
      baseTabs.push(
        { id: 'properties', name: 'My Properties', icon: Home },
        { id: 'bookings', name: 'Received Bookings', icon: BookOpen }
      );
    } else if (role === 'MOVER') {
      baseTabs.push(
        { id: 'mover-portal', name: 'Vendor Portal', icon: Truck },
        { id: 'moving', name: 'Moving Requests', icon: Truck }
      );
    } else {
      // TENANT default
      baseTabs.push(
        { id: 'bookings', name: 'My Bookings', icon: BookOpen },
        { id: 'saved', name: 'Saved', icon: Heart },
        { id: 'split', name: 'Split Expenses', icon: Split },
        { id: 'roommates', name: 'Roommate Requests', icon: Users },
        { id: 'moving', name: 'Moving Requests', icon: Truck }
      );
    }

    baseTabs.push(
      { id: 'notifications', name: 'Notifications', icon: Bell },
      { id: 'settings', name: 'Settings', icon: Settings }
    );

    if (role === 'ADMIN') {
      baseTabs.push({ id: 'admin', name: 'Admin Dashboard', icon: ShieldCheck });
    }

    baseTabs.push({ id: 'logout', name: 'Sign Out', icon: LogOut });

    return baseTabs;
  };

  const tabs = getRoleTabs();

  const statusColors = { CONFIRMED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700' };

  const confirmLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="bg-mesh-gradient min-h-screen pb-12 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200/15 rounded-full -translate-x-1/3 translate-y-1/3 blur-[80px] pointer-events-none" />

        {/* Premium gradient header */}
        <div className={`bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600 relative overflow-hidden ${activeTab === 'properties' ? 'hidden' : ''}`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDBMMzAgNjBNMCA' + 'zMEw2MCAzMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjYSkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-200 text-sm font-medium mb-1">Welcome back,</p>
                <h1 className="text-3xl font-black text-white tracking-tight">{user?.name || 'User'}</h1>
                <p className="text-primary-200 mt-1 text-sm">Manage your account, properties and bookings</p>
              </div>
              <button onClick={() => showModal({ type: 'confirm', title: 'Sign Out', message: 'Are you sure you want to sign out of your account?', onConfirm: confirmLogout, onCancel: closeModal })} className="flex items-center text-white/80 hover:text-white font-medium px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 transition-all">
                <LogOut size={18} className="mr-2" />Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className={`w-full lg:w-64 flex-shrink-0 ${activeTab === 'properties' ? 'hidden' : ''}`}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 border border-gray-100/80 dark:border-white/5 p-4 sticky top-24">
                <div className="flex items-center space-x-4 mb-6 p-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl border border-primary-100/50">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-md shadow-primary-500/25 border-2 border-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/25 border-2 border-white">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{user?.name || 'User'}</h3>
                    <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">{user?.role || 'Account'}</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'split') navigate('/split-expenses');
                          else if (tab.id === 'admin') navigate('/admin');
                          else if (tab.id === 'mover-portal') navigate('/mover-dashboard');
                          else if (tab.id === 'logout') showModal({ type: 'confirm', title: 'Sign Out', message: 'Are you sure you want to sign out?', onConfirm: confirmLogout, onCancel: closeModal });
                          else setActiveTab(tab.id);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-100/50 dark:border-primary-800/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'} ${tab.id === 'logout' ? 'hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4' : ''}`}
                      >
                        <Icon size={18} className={`mr-3 ${activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : tab.id === 'logout' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />{tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 border border-gray-100/80 dark:border-white/5 p-6 md:p-8">

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setUserSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))} 
                        className="flex items-center justify-center p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        title={userSettings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      >
                        {userSettings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                      {!editingProfile && <button onClick={() => setEditingProfile(true)} className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"><Edit3 size={16} />Edit</button>}
                    </div>
                  </div>
                  {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                        <div className="flex items-center gap-4">
                          {profileForm.profilePhoto ? (
                            <img src={profileForm.profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                              <User size={24} />
                            </div>
                          )}
                          {editingProfile && (
                            <div>
                              <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
                                {savingProfile ? 'Uploading...' : 'Upload Photo'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} disabled={savingProfile} />
                              </label>
                              <p className="text-xs text-gray-500 mt-1">Recommended size: 200x200px, Max 2MB.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* RentXY User ID Card */}
                      {profile.userCode && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your RentXY ID</label>
                          <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-xl px-4 py-3">
                            <div className="flex-1">
                              <p className="font-mono text-xl font-bold text-primary-700 tracking-widest">{profile.userCode}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Share this ID so others can find and message you directly</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(profile.userCode);
                                showModal({ type: 'alert', title: 'Copied!', message: `Your RentXY ID "${profile.userCode}" has been copied to clipboard.`, onConfirm: closeModal });
                              }}
                              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors active:scale-95"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                              Copy ID
                            </button>
                          </div>
                        </div>
                      )}
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
                      {/* Privacy Toggle */}
                      <div className="md:col-span-2 mt-2">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Share Contact Details</h4>
                            <p className="text-xs text-gray-500 mt-1">Allow others to see your email and phone number on your public profile</p>
                          </div>
                          <button
                            type="button"
                            disabled={!editingProfile}
                            onClick={() => setProfileForm(p => ({ ...p, contactShared: !p.contactShared }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!editingProfile ? 'opacity-50 cursor-not-allowed' : ''} ${profileForm.contactShared ? 'bg-primary-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileForm.contactShared ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        {editingProfile ? (
                          <input type="text" value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="e.g. Pune" />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{profile.city || 'Not set'}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 mt-4 border-t border-gray-100 pt-4">
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">Payment Details (For Split Expenses)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (VPA)</label>
                            {editingProfile ? (
                              <input type="text" value={profileForm.upiId} onChange={e => setProfileForm(p => ({ ...p, upiId: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="e.g. yourname@okaxis" />
                            ) : (
                              <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{profile.upiId || 'Not set'}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">UPI QR Code</label>
                            <div className="flex items-center gap-4">
                              {profileForm.upiQrUrl ? (
                                <img src={profileForm.upiQrUrl} alt="UPI QR" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><rect width="3" height="3" x="7" y="7" /><rect width="3" height="3" x="14" y="7" /><rect width="3" height="3" x="7" y="14" /><rect width="3" height="3" x="14" y="14" /></svg>
                                </div>
                              )}
                              {editingProfile && (
                                <div>
                                  <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
                                    {savingProfile ? 'Uploading...' : 'Upload QR Image'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpiQrUpload} disabled={savingProfile} />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 capitalize">{profile.role?.toLowerCase()}</p>
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

                      {profile.kycStatus === 'PENDING' && profile.kycDocumentUrl && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center">
                            <svg className="w-3 h-3 text-yellow-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z" /></svg>
                          </div>
                          <div>
                            <p className="font-bold">Verification Pending</p>
                            <p className="text-sm">Your KYC will be approved in 2 to 3 working days.</p>
                          </div>
                        </div>
                      )}

                      {(profile.kycStatus === 'NONE' || profile.kycStatus === 'REJECTED' || !profile.kycStatus || (profile.kycStatus === 'PENDING' && !profile.kycDocumentUrl)) && (
                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 p-5 rounded-xl">
                          {profile.kycStatus === 'REJECTED' && (
                            <div className="mb-4 text-red-600 text-sm font-medium">Your previous KYC submission was rejected. Please resubmit valid details.</div>
                          )}
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Complete your identity verification to get the "Verified" badge.</p>

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

                            <div className="mt-6 space-y-6">
                              <label className="block text-sm font-medium text-gray-700">Capture Documents & Selfie</label>

                              {/* CAMERA VIEW (Shared) */}
                              {kycCameraActive && (
                                <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
                                  <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-[4/3] flex items-center justify-center border-4 border-primary-500 shadow-2xl">
                                    <video ref={videoRef} className={`w-full h-full object-cover ${kycCurrentCapture === 'face' ? '-scale-x-100' : ''}`} autoPlay playsInline muted></video>

                                    {/* Overlay for Face */}
                                    {kycCurrentCapture === 'face' && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                        <div className={`w-[45%] h-[65%] border-4 ${faceDetected ? 'border-green-500' : 'border-red-500'} rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors duration-300`}></div>
                                        <p className={`font-bold mt-4 drop-shadow-md px-4 py-1.5 rounded-full backdrop-blur-md text-xs sm:text-sm transition-colors duration-300 ${faceDetected ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                          {faceDetected ? '✓ Face Detected! Ready to Capture' : 'Align your face inside the oval'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Overlay for Document */}
                                    {kycCurrentCapture && kycCurrentCapture !== 'face' && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                        <div className={`w-[80%] h-[60%] border-4 ${docDetected ? 'border-green-500' : 'border-red-500'} rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors duration-300 border-dashed`}></div>
                                        <p className={`font-bold mt-4 drop-shadow-md px-4 py-1.5 rounded-full backdrop-blur-md text-xs sm:text-sm transition-colors duration-300 ${docDetected ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                          {docDetected ? '✓ Document Aligned! Ready to Capture' : 'Align document inside the frame'}
                                        </p>
                                      </div>
                                    )}

                                    <div className="absolute top-4 right-4 z-20">
                                      <button onClick={toggleCamera} className="w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-lg">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-center gap-4 mt-2">
                                    <button onClick={stopCamera} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto">Cancel</button>
                                    <button onClick={capturePhoto} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-colors w-full sm:w-auto text-lg">Capture Photo</button>
                                  </div>
                                </div>
                              )}

                              <div className={`grid grid-cols-1 md:grid-cols-${profile?.role === 'MOVER' ? '4' : '3'} gap-4`}>
                                {/* FRONT */}
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase">1. Front Side</span>
                                  {!kycPhotos.front ? (
                                    <button disabled={kycCameraActive} onClick={() => startCamera('front')} className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary-500 transition-colors disabled:opacity-50">
                                      <span className="text-gray-500 text-sm font-medium">📷 Capture Front</span>
                                    </button>
                                  ) : (
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-black group">
                                      <img src={kycPhotos.front} alt="Front" className="w-full h-full object-cover opacity-80" />
                                      <button onClick={() => retakePhoto('front')} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">Retake</button>
                                    </div>
                                  )}
                                </div>

                                {/* BACK */}
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase">2. Back Side</span>
                                  {!kycPhotos.back ? (
                                    <button disabled={kycCameraActive} onClick={() => startCamera('back')} className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary-500 transition-colors disabled:opacity-50">
                                      <span className="text-gray-500 text-sm font-medium">📷 Capture Back</span>
                                    </button>
                                  ) : (
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-black group">
                                      <img src={kycPhotos.back} alt="Back" className="w-full h-full object-cover opacity-80" />
                                      <button onClick={() => retakePhoto('back')} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">Retake</button>
                                    </div>
                                  )}
                                </div>

                                {/* FACE */}
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase">3. Your Face</span>
                                  {!kycPhotos.face ? (
                                    <button disabled={kycCameraActive} onClick={() => startCamera('face')} className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary-500 transition-colors disabled:opacity-50">
                                      <span className="text-gray-500 text-sm font-medium">🤳 Capture Selfie</span>
                                    </button>
                                  ) : (
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-black group">
                                      <img src={kycPhotos.face} alt="Face" className="w-full h-full object-cover opacity-80 -scale-x-100" />
                                      <button onClick={() => retakePhoto('face')} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">Retake</button>
                                    </div>
                                  )}
                                </div>

                                {/* MOVER LICENCE */}
                                {profile?.role === 'MOVER' && (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">4. Driving Licence</span>
                                    {!kycPhotos.licence ? (
                                      <button disabled={kycCameraActive} onClick={() => startCamera('licence')} className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary-500 transition-colors disabled:opacity-50">
                                        <span className="text-gray-500 text-sm font-medium">🚗 Capture Licence</span>
                                      </button>
                                    ) : (
                                      <div className="relative h-32 rounded-xl overflow-hidden bg-black group">
                                        <img src={kycPhotos.licence} alt="Licence" className="w-full h-full object-cover opacity-80" />
                                        <button onClick={() => retakePhoto('licence')} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">Retake</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <canvas ref={canvasRef} className="hidden"></canvas>
                            </div>

                            <div className="pt-6 flex justify-end">
                              <button
                                onClick={handleKycSubmit}
                                disabled={uploadingKyc}
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Bookings</h2>
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
                        <div key={booking.id} className="border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-lg transition-all duration-300 bg-white group/card gap-4">
                          <Link to={`/listings/${booking.listing?.id}/${slugify(booking.listing?.title)}`} className="flex items-center gap-4 group cursor-pointer flex-1">
                            <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors"><Home size={24} className="text-primary-600" /></div>
                            <div>
                              <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{booking.listing?.title || 'Property'}</span>
                              <p className="text-sm text-gray-500">{booking.listing?.location}</p>
                              <p className="text-xs text-gray-400 mt-1">Booked {new Date(booking.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                          </Link>

                          {/* Tenant Details for Owner */}
                          {user?.role === 'OWNER' && booking.tenant && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1 w-full md:w-auto shadow-sm">
                              <p className="text-[10px] font-extrabold text-primary-600 mb-2 uppercase tracking-widest border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                                <User size={12} /> Tenant Details
                              </p>
                              <div className="mb-3">
                                <p className="font-bold text-gray-900 text-sm">{booking.tenant.name}</p>
                                <p className="text-sm text-gray-700 font-medium mt-0.5">{booking.tenant.phone || 'No phone provided'}</p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{booking.tenant.email}</p>
                                {booking.tenant.userCode && <p className="text-xs text-primary-600 font-bold mt-1 bg-primary-50 inline-block px-2 py-0.5 rounded-md">ID: {booking.tenant.userCode}</p>}
                              </div>

                              {/* Contact Action Buttons */}
                              <div className="flex gap-2 pt-3 border-t border-gray-200">
                                {booking.tenant.phone && (
                                  <>
                                    <a href={`tel:${booking.tenant.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
                                      <Phone size={14} /> Call
                                    </a>
                                    <a href={`https://wa.me/${booking.tenant.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-[#1ebd5a] transition-all active:scale-95 shadow-sm">
                                      WhatsApp
                                    </a>
                                  </>
                                )}
                                <a href={`mailto:${booking.tenant.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-bold px-2 py-2 rounded-lg transition-all active:scale-95 shadow-sm">
                                  <Mail size={14} /> Email
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                            <p className="font-bold text-primary-600">₹{booking.amount?.toLocaleString('en-IN')}</p>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                              {booking.status === 'PENDING' ? (user?.role === 'OWNER' ? 'PENDING CONFIRMATION' : 'PAY DIRECT TO OWNER') : booking.status}
                            </span>
                            <div className="flex gap-2 mt-1">
                              {booking.status === 'PENDING' && user?.role === 'OWNER' && (
                                <button onClick={() => {
                                  showModal({
                                    type: 'confirm', title: 'Confirm Booking', message: 'Confirm that you have received payment and want to accept this booking?',
                                    onConfirm: async () => { closeModal(); try { await api.post(`/bookings/${booking.id}/confirm`); setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b)); } catch { } },
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Properties</h2>
                    <Link to="/post-property" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"><Plus size={16} />Add Property</Link>
                  </div>
                  {loadingListings ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                  ) : myListings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Home className="text-gray-400" size={32} /></div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No properties listed</h3>
                      <p className="text-gray-500 mb-6">List your property and start earning.</p>
                      <Link to="/post-property" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700">Post Property</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myListings.map(listing => (
                        <div key={listing.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white">
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
                              <Link to={`/listings/${listing.id}/${slugify(listing.title)}`} className="flex items-center gap-4 group cursor-pointer flex-1 min-w-0">
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Saved & Shortlisted</h2>
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                    <div className="flex items-center gap-4">
                      {notificationPermission === 'default' && (
                        <button onClick={enableNotifications} className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors hidden sm:block">
                          Enable Push Notifications
                        </button>
                      )}
                      {notifications.some(n => !n.isRead) && (
                        <button onClick={async () => { await api.put('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }} className="text-sm text-primary-600 font-medium hover:underline">Mark all as read</button>
                      )}
                    </div>
                  </div>
                  {notificationPermission === 'default' && (
                    <div className="mb-6 sm:hidden bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                      <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">Want instant alerts?</span>
                      <button onClick={enableNotifications} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Enable
                      </button>
                    </div>
                  )}
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Moving Requests</h2>
                    <Link to="/movers" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"><Plus size={16} />New Request</Link>
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
                        <div key={req.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {req.status}
                              </span>
                              {(req.status === 'PENDING' || req.status === 'ASSIGNED') && (
                                <button onClick={() => handleCancelMoving(req.id)} className="text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 px-2 py-1 rounded">Cancel Request</button>
                              )}
                              {req.status === 'ASSIGNED' && (
                                <button onClick={() => {
                                  showModal({
                                    type: 'confirm', title: 'Complete Request', message: 'Confirm that the movers have completed this job?',
                                    onConfirm: async () => { closeModal(); try { await api.put(`/moving/vendor/${req.id}/complete`); setMovingRequests(prev => prev.map(m => m.id === req.id ? { ...m, status: 'COMPLETED' } : m)); } catch { } },
                                    onCancel: closeModal
                                  });
                                }} className="text-xs text-green-600 hover:text-green-800 font-medium">Mark Completed</button>
                              )}
                              {req.status === 'COMPLETED' && !req.reviewRating && (
                                <button onClick={() => setShowReviewModal(req)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">Rate Vendor</button>
                              )}
                              {req.status === 'COMPLETED' && req.reviewRating && (
                                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                                  Review: {req.reviewRating === 'HAPPY' ? '😄 Happy' : '😞 Not Happy'}
                                </span>
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
                            <div className="text-right">
                              <span className="block font-bold text-primary-600">{req.estimatedPrice ? `₹${req.estimatedPrice.toLocaleString('en-IN')}` : 'To be decided'}</span>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase mt-1">Payment Method: Cash to Vendor</span>
                              <span className="block text-[10px] text-orange-600 font-bold mt-1 leading-tight max-w-[200px]">* Pricing is currently negotiation-based. Please negotiate directly with the vendor! (Automated pricing features coming soon)</span>
                            </div>
                          </div>
                          {req.mover && (
                            <div className="mt-4 bg-primary-50 rounded-xl p-4 border border-primary-100 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary-200 text-primary-800 rounded-lg flex items-center justify-center font-bold">
                                    {req.mover.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{req.mover.name}</p>
                                    <p className="text-xs text-primary-700 font-medium">{req.mover.phone}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] uppercase bg-white text-primary-600 px-2 py-1 rounded font-bold border border-primary-200">
                                  Assigned Vendor
                                </span>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-primary-100/50">
                                {req.mover.phone && (
                                  <>
                                    <a href={`tel:${req.mover.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-sm">
                                      <Phone size={14} /> Call
                                    </a>
                                    <a href={`https://wa.me/${req.mover.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-2 py-2 rounded-lg hover:bg-[#1ebd5a] transition-all shadow-sm">
                                      WhatsApp
                                    </a>
                                  </>
                                )}
                                {req.mover.email && (
                                  <a href={`mailto:${req.mover.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-white text-primary-800 border border-primary-200 hover:bg-primary-100 text-xs font-bold px-2 py-2 rounded-lg transition-all shadow-sm">
                                    <Mail size={14} /> Email
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* PREMIUM SECURITY OTPs */}
                          {(req.status === 'ASSIGNED' || req.status === 'IN_TRANSIT') && (
                            <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-1 shadow-xl">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={100} className="text-white" />
                              </div>
                              <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <ShieldCheck className="text-green-400" size={20} />
                                      <h4 className="text-white font-bold tracking-wide uppercase text-sm">Secure Move PINs</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                      Share the <strong className="text-white">Start PIN</strong> only after paying the advance. Share the <strong className="text-white">End PIN</strong> only when your goods are safely delivered.
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 w-full md:w-auto">
                                    {/* START OTP */}
                                    <div className={`flex-1 md:w-28 relative rounded-xl border ${req.status === 'IN_TRANSIT' ? 'bg-gray-800/50 border-gray-600 opacity-50' : 'bg-gradient-to-b from-blue-500 to-blue-600 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'} p-3 text-center transition-all duration-500`}>
                                      <p className="text-[9px] uppercase font-bold text-white/80 tracking-widest mb-1">Start PIN</p>
                                      <p className={`text-2xl font-black tracking-widest ${req.status === 'IN_TRANSIT' ? 'text-gray-400 line-through' : 'text-white drop-shadow-md'}`}>
                                        {req.startOtp}
                                      </p>
                                      {req.status === 'IN_TRANSIT' && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">USED</div>
                                      )}
                                    </div>
                                    
                                    {/* END OTP */}
                                    <div className={`flex-1 md:w-28 relative rounded-xl border ${req.status === 'ASSIGNED' ? 'bg-gray-800/80 border-gray-600 opacity-80' : 'bg-gradient-to-b from-green-500 to-green-600 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'} p-3 text-center transition-all duration-500`}>
                                      <p className="text-[9px] uppercase font-bold text-white/80 tracking-widest mb-1">End PIN</p>
                                      <p className="text-2xl font-black tracking-widest text-white drop-shadow-md">
                                        {req.endOtp}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* LIVE TRACKING MAP */}
                          {req.status === 'IN_TRANSIT' && req.currentLatitude && req.currentLongitude && (
                            <div className="mt-4 border border-blue-200 rounded-xl overflow-hidden relative shadow-inner">
                              <div className="absolute top-2 left-2 z-[500] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-100 shadow flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-blue-900">Live Tracking</span>
                              </div>
                              <div className="h-48 w-full">
                                <MapContainer center={[req.currentLatitude, req.currentLongitude]} zoom={15} scrollWheelZoom={false} zoomControl={false} className="h-full w-full">
                                  <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
                                  <Marker position={[req.currentLatitude, req.currentLongitude]} icon={truckIcon} />
                                </MapContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ROOMMATE REQUESTS TAB */}
              {activeTab === 'roommates' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Roommate Requests</h2>
                  {loadingRoommates ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
                  ) : (
                    <div className="space-y-8">
                      {/* Received Requests */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Received Requests</h3>
                        {roommateRequests.received.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-white/5">
                            <Users size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No received requests.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {roommateRequests.received.map(req => (
                              <div key={req.id} className="border border-gray-100 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                      {req.sender?.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 dark:text-white">{req.sender?.name}</p>
                                      <p className="text-xs text-gray-500">{req.sender?.email}</p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    req.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {req.status}
                                  </span>
                                </div>
                                <div className="mb-4">
                                  <p className="text-xs text-gray-500 mb-1">Post Details:</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{req.postLocation} ({req.postPropertyType})</p>
                                  <p className="text-xs text-gray-500">₹{req.postBudget?.toLocaleString('en-IN')} - ID: {req.postId}</p>
                                </div>
                                {req.status === 'PENDING' && (
                                  <div className="flex gap-3">
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await api.put(`/roommates/requests/${req.id}/status?status=ACCEPTED`);
                                          setRoommateRequests(prev => ({ ...prev, received: prev.received.map(r => r.id === req.id ? { ...r, status: 'ACCEPTED' } : r) }));
                                        } catch {
                                          showModal({ type: 'alert', title: 'Error', message: 'Failed to accept request.', onConfirm: closeModal });
                                        }
                                      }}
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await api.put(`/roommates/requests/${req.id}/status?status=REJECTED`);
                                          setRoommateRequests(prev => ({ ...prev, received: prev.received.map(r => r.id === req.id ? { ...r, status: 'REJECTED' } : r) }));
                                        } catch {
                                          showModal({ type: 'alert', title: 'Error', message: 'Failed to reject request.', onConfirm: closeModal });
                                        }
                                      }}
                                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-bold transition-colors border border-red-200"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sent Requests */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Sent Requests</h3>
                        {roommateRequests.sent.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-white/5">
                            <Users size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No sent requests.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {roommateRequests.sent.map(req => (
                              <div key={req.id} className="border border-gray-100 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                      {req.receiver?.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 dark:text-white">{req.receiver?.name}</p>
                                      <p className="text-xs text-gray-500">{req.receiver?.email}</p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    req.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {req.status}
                                  </span>
                                </div>
                                <div className="mb-4">
                                  <p className="text-xs text-gray-500 mb-1">Post Details:</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{req.postLocation} ({req.postPropertyType})</p>
                                  <p className="text-xs text-gray-500">₹{req.postBudget?.toLocaleString('en-IN')} - ID: {req.postId}</p>
                                </div>
                                {req.status === 'PENDING' && (
                                  <button 
                                    onClick={async () => {
                                      showModal({
                                        type: 'confirm', title: 'Cancel Request', message: 'Are you sure you want to cancel this request?',
                                        onConfirm: async () => {
                                          closeModal();
                                          try {
                                            await api.put(`/roommates/requests/${req.id}/status?status=CANCELLED`);
                                            setRoommateRequests(prev => ({ ...prev, sent: prev.sent.map(r => r.id === req.id ? { ...r, status: 'CANCELLED' } : r) }));
                                          } catch {
                                            showModal({ type: 'alert', title: 'Error', message: 'Failed to cancel request.', onConfirm: closeModal });
                                          }
                                        },
                                        onCancel: closeModal
                                      });
                                    }}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-bold transition-colors border border-gray-200"
                                  >
                                    Cancel Request
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>

                  <div className="space-y-6">
                    {/* Preferences */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="text-primary-500" size={20} /> App Preferences
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive booking and property updates via email.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                              checked={userSettings.emailNotifications}
                              onChange={(e) => setUserSettings({ ...userSettings, emailNotifications: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">SMS Alerts</p>
                            <p className="text-sm text-gray-500">Get important updates delivered to your phone.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                              checked={userSettings.smsAlerts}
                              onChange={(e) => setUserSettings({ ...userSettings, smsAlerts: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">Dark Mode</p>
                            <p className="text-sm text-gray-500">Toggle dark mode for a better nighttime experience.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                              checked={userSettings.darkMode}
                              onChange={(e) => setUserSettings({ ...userSettings, darkMode: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-green-500" size={20} /> Security & Privacy
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">Change Password</p>
                            <p className="text-sm text-gray-500">Update your account password regularly.</p>
                          </div>
                          <button className="text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg transition-colors active:scale-95">Update</button>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                          </div>
                          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition-colors active:scale-95">Enable</button>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                        <Trash2 className="text-red-500" size={20} /> Danger Zone
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800">Delete Account</p>
                          <p className="text-sm text-red-600">Permanently remove your account and all data.</p>
                        </div>
                        <button onClick={() => showModal({ type: 'confirm', title: 'Delete Account', message: 'Are you sure you want to request account deletion? Your data will be permanently removed.', onConfirm: () => { closeModal(); handleDeleteAccount(); }, onCancel: closeModal })} className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg shadow-sm transition-colors active:scale-95">Delete Account</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scaleIn border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Rate Your Vendor</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">How was your moving experience with {showReviewModal.mover?.name}?</p>
            
            <div className="flex gap-4 justify-center mb-6">
              <button 
                onClick={() => setReviewForm({ ...reviewForm, rating: 'HAPPY' })}
                className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${reviewForm.rating === 'HAPPY' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200 text-gray-600'}`}
              >
                <span className="text-4xl">😄</span>
                <span className="font-bold">Happy</span>
              </button>
              <button 
                onClick={() => setReviewForm({ ...reviewForm, rating: 'UNHAPPY' })}
                className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${reviewForm.rating === 'UNHAPPY' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-600'}`}
              >
                <span className="text-4xl">😞</span>
                <span className="font-bold">Not Happy</span>
              </button>
            </div>

            <textarea 
              placeholder="Add optional comments about your experience..."
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none h-24 p-3 text-sm mb-6 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowReviewModal(null); setReviewForm({ rating: '', comments: '' }); }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!reviewForm.rating) return;
                  try {
                    await api.post(`/moving/${showReviewModal.id}/review`, reviewForm);
                    setMovingRequests(prev => prev.map(m => m.id === showReviewModal.id ? { ...m, reviewRating: reviewForm.rating, reviewComments: reviewForm.comments } : m));
                    setShowReviewModal(null);
                    setReviewForm({ rating: '', comments: '' });
                  } catch (e) {
                    console.error("Failed to submit review");
                  }
                }}
                disabled={!reviewForm.rating}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal {...modalConfig} onCancel={closeModal} />
    </>
  );
};

export default DashboardPage;
