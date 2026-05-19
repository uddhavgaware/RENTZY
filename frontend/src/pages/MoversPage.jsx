import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Package, ArrowRight, ShieldCheck, Clock, CreditCard, Map as MapIcon, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import PremiumHero from '../components/PremiumHero';

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute top-2 left-2 z-[1000] flex flex-col bg-white/90 backdrop-blur-md border border-white/50 shadow-sm rounded-lg overflow-hidden">
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }} className="p-1.5 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-200"><Plus size={14} /></button>
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }} className="p-1.5 hover:bg-gray-100 text-gray-700 transition-colors"><Minus size={14} /></button>
    </div>
  );
}

const pickupIcon = divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-emerald-500 rounded-full opacity-35 animate-ping"></div>
        <div class="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-emerald-500">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-pickup-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const dropIcon = divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-35 animate-ping"></div>
        <div class="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-red-500">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-drop-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const MoversPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const [formData, setFormData] = useState({
    fromLocation: '',
    toLocation: '',
    movingDate: '',
    movingTime: 'Morning (8 AM - 12 PM)',
    propertySize: '1BHK',
    additionalNotes: ''
  });

  const [activeMapField, setActiveMapField] = useState(null);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [mapPosition, setMapPosition] = useState([18.5204, 73.8567]);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setMapPosition(coords);
        if (activeMapField === 'from') {
          setFromCoords(coords);
          setFormData(prev => ({ ...prev, fromLocation: data[0].display_name }));
        } else if (activeMapField === 'to') {
          setToCoords(coords);
          setFormData(prev => ({ ...prev, toLocation: data[0].display_name }));
        }
      }
    } catch (err) {}
  };

  function LocationMarker() {
    useMapEvents({
      async click(e) {
        if (!activeMapField) {
          showModal({ type: 'alert', title: 'Select Field', message: 'Please click "Pick on Map" for either Moving From or Moving To first.', onConfirm: closeModal });
          return;
        }
        const coords = [e.latlng.lat, e.latlng.lng];
        if (activeMapField === 'from') {
           setFromCoords(coords);
        } else {
           setToCoords(coords);
        }
        setMapPosition(coords);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=14&addressdetails=1`);
          const data = await res.json();
          let neighborhood = data.address.neighbourhood || data.address.suburb || data.address.city_district || data.address.city || data.display_name;
          if (neighborhood) {
             if (activeMapField === 'from') {
                setFormData(prev => ({...prev, fromLocation: neighborhood}));
             } else {
                setFormData(prev => ({...prev, toLocation: neighborhood}));
             }
             setActiveMapField(null);
          }
        } catch(err) {}
      },
    });
    return (
      <>
        {fromCoords && <Marker position={fromCoords} icon={pickupIcon} />}
        {toCoords && <Marker position={toCoords} icon={dropIcon} />}
        {fromCoords && toCoords && <Polyline positions={[fromCoords, toCoords]} color="#6366f1" weight={4} dashArray="5, 10" />}
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth?redirect=/movers');
      return;
    }
    if (!fromCoords || !toCoords) {
      showModal({ type: 'alert', title: 'Location Required', message: 'You must select both Pickup and Drop locations on the map.', onConfirm: closeModal });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/moving/request', formData);
      showModal({ 
        type: 'alert', 
        title: 'Request Submitted', 
        message: 'Moving request submitted successfully! Verified Agents will contact you shortly to confirm the details.', 
        onConfirm: () => {
          closeModal();
          navigate('/dashboard?tab=moving');
        } 
      });
    } catch (err) {
      showModal({ 
        type: 'alert', 
        title: 'Error', 
        message: `Failed to submit request: ${err.response?.data?.message || err.message || 'Unknown error'}. Please try again.`, 
        onConfirm: closeModal 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PremiumHero
        title="Stress-Free"
        highlightText="Moving"
        highlightColorClass="text-primary-400"
        subtitle="Get instant quotes, top-rated professional movers, and 100% damage protection."
        videoSrc="https://cdn.pixabay.com/video/2021/08/25/86266-592659341_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
      >
        <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-lg mx-auto text-white/90 text-sm font-semibold">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm">
            <ShieldCheck className="text-primary-400" size={18} /> Verified Partners
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm">
            <Clock className="text-primary-400" size={18} /> On-Time Guarantee
          </div>
        </div>
      </PremiumHero>

    <div className="min-h-screen bg-gray-50 pb-20 pt-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32">
          
          <div className="w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 text-gray-900">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">Get a Free Quote</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Moving From {fromCoords && <CheckCircle2 size={14} className="text-green-500" />}
                  </label>
                  <button type="button" onClick={() => setActiveMapField(activeMapField === 'from' ? null : 'from')} className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors ${activeMapField === 'from' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><MapIcon size={12}/> Pick on Map</button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" required value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} placeholder="e.g. Andheri East, Mumbai" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                {activeMapField === 'from' && <p className="text-xs text-primary-600 font-bold ml-1 animate-pulse">Click on the map below to select location</p>}
                {!activeMapField && <p className="text-xs text-gray-500 ml-1">Please provide accurate details.</p>}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Moving To {toCoords && <CheckCircle2 size={14} className="text-green-500" />}
                  </label>
                  <button type="button" onClick={() => setActiveMapField(activeMapField === 'to' ? null : 'to')} className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors ${activeMapField === 'to' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><MapIcon size={12}/> Pick on Map</button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-primary-400" size={18} />
                  <input type="text" required value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})} placeholder="e.g. Indiranagar, Bangalore" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                {activeMapField === 'to' && <p className="text-xs text-primary-600 font-bold ml-1 animate-pulse">Click on the map below to select location</p>}
              </div>

              {activeMapField && (
                 <div className="h-[250px] rounded-xl overflow-hidden border-2 border-primary-300 shadow-inner z-0 relative animate-fadeIn mb-4">
                    {/* Map Search Overlay */}
                    <div className="absolute top-3 left-3 right-3 z-[1000] glass-premium rounded-xl p-1.5 flex items-center shadow-lg border border-white/50 bg-white/95 backdrop-blur-sm">
                      <div className="pl-3 pr-2 text-gray-400">
                        <MapPin size={16} className="text-primary-500" />
                      </div>
                      <input 
                        type="text" 
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        placeholder={`Search ${activeMapField === 'from' ? 'pickup' : 'drop'} location...`} 
                        className="w-full outline-none text-xs bg-transparent font-medium text-gray-800 placeholder-gray-400 py-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleMapSearch(e);
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleMapSearch}
                        className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center shadow-sm transition-colors active:scale-95 ml-1 flex-shrink-0"
                      >
                        Search
                      </button>
                    </div>
                    <MapContainer center={mapPosition} zoom={11} scrollWheelZoom={true} zoomControl={false} className="h-full w-full">
                      <CustomZoomControl />
                      <MapUpdater center={mapPosition} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker />
                    </MapContainer>
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.movingDate} onChange={e => setFormData({...formData, movingDate: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select value={formData.movingTime} onChange={e => setFormData({...formData, movingTime: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="Morning (8 AM - 12 PM)">Morning</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon</option>
                      <option value="Evening (4 PM - 8 PM)">Evening</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Property Size</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select value={formData.propertySize} onChange={e => setFormData({...formData, propertySize: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none">
                      <option value="1RK">1 RK</option>
                      <option value="1BHK">1 BHK</option>
                      <option value="2BHK">2 BHK</option>
                      <option value="3BHK">3 BHK</option>
                      <option value="4BHK+">4 BHK+</option>
                      <option value="FewItems">Just a few items</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-primary-600/30">
                {loading ? 'Submitting...' : <>Get Instant Quote <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose RentXY Movers?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">We've partnered with the best in the business to ensure your belongings reach safely.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Damage Protection</h3>
            <p className="text-gray-500">Up to ₹50,000 transit insurance included in every premium move.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Pricing</h3>
            <p className="text-gray-500">No hidden charges. The quote you get is the final amount you pay.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Partners</h3>
            <p className="text-gray-500">We only work with background-verified and highly rated vendors.</p>
          </div>
        </div>
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
    </>
  );
};

export default MoversPage;
