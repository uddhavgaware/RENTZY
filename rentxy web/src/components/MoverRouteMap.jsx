import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Navigation, Clock, Activity, MapPin, Flag, ExternalLink, Layers } from 'lucide-react';

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const createPin = (emoji, bgColor, borderColor) => divIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center">
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;inset:0;background:${bgColor};border-radius:50%;opacity:0.25;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="position:relative;width:34px;height:34px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:3px solid ${borderColor};font-size:16px">
          ${emoji}
        </div>
      </div>
    </div>
  `,
  className: 'custom-map-marker-container',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const pickupPin = createPin('📍', '#6366f1', '#4f46e5');
const dropoffPin = createPin('🏁', '#22c55e', '#16a34a');

// Map style options
const MAP_STYLES = {
  streets: {
    name: 'Streets',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
};

const MoverRouteMap = ({ job }) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapStyle, setMapStyle] = useState('streets');

  useEffect(() => {
    const fetchRoute = async () => {
      if (!job.fromLatitude || !job.fromLongitude || !job.toLatitude || !job.toLongitude) {
        setError("Location coordinates missing for this job.");
        setLoading(false);
        return;
      }

      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      const start = `${job.fromLongitude},${job.fromLatitude}`;
      const end = `${job.toLongitude},${job.toLatitude}`;
      
      try {
        setLoading(true);
        setError(null);
        let url;

        if (mapboxToken) {
          url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start};${end}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
        } else {
          url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?geometries=geojson&overview=full`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Routing failed");
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          setRouteData({
            coordinates,
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.ceil(route.duration / 60)
          });
        } else {
          throw new Error("No route found");
        }
      } catch (err) {
        console.error("Routing error:", err);
        setError("Failed to calculate route.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [job]);

  if (!job.fromLatitude || !job.toLatitude) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500 text-sm border border-gray-200 mt-4">
        📍 Live routing unavailable: Customer did not pin exact locations on the map.
      </div>
    );
  }

  const navToPickup = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.fromLatitude},${job.fromLongitude}`, '_blank');
  const navToDropoff = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.toLatitude},${job.toLongitude}`, '_blank');

  const currentTile = MAP_STYLES[mapStyle];
  const routeColor = mapStyle === 'dark' ? '#818cf8' : mapStyle === 'satellite' ? '#facc15' : '#4f46e5';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mt-5 relative z-0 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
            <Navigation size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight text-white">Route Map</h3>
            <p className="text-xs text-gray-400">Tap markers for navigation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Map style switcher */}
          <div className="flex bg-gray-800/80 rounded-lg p-0.5 border border-gray-700">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setMapStyle(key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  mapStyle === key 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-sm font-medium text-indigo-300 flex items-center gap-2 bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Routing...
            </div>
          ) : routeData ? (
            <div className="flex gap-1.5">
              <div className="flex items-center gap-1.5 bg-gray-800/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-gray-700">
                <Clock size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-white">{routeData.duration} min</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-800/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-gray-700">
                <Activity size={14} className="text-green-400" />
                <span className="text-xs font-bold text-white">{routeData.distance} km</span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-medium text-red-400 bg-red-900/30 px-3 py-1 rounded-lg">{error}</span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="h-[350px] w-full relative z-0 bg-gray-100">
        {routeData && (
          <MapContainer 
            bounds={[ [job.fromLatitude, job.fromLongitude], [job.toLatitude, job.toLongitude] ]} 
            scrollWheelZoom={false} 
            className="h-full w-full relative z-0"
          >
            <MapUpdater bounds={routeData.coordinates} />
            <TileLayer
              attribution={currentTile.attribution}
              url={currentTile.url}
            />
            {/* Route glow effect (wider, transparent line behind) */}
            <Polyline 
              positions={routeData.coordinates} 
              color={routeColor}
              weight={10} 
              opacity={0.2}
              lineCap="round"
              lineJoin="round"
            />
            {/* Main route line */}
            <Polyline 
              positions={routeData.coordinates} 
              color={routeColor}
              weight={5} 
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
            <Marker position={[job.fromLatitude, job.fromLongitude]} icon={pickupPin} />
            <Marker position={[job.toLatitude, job.toLongitude]} icon={dropoffPin} />
          </MapContainer>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 relative z-10">
        <button 
          onClick={navToPickup}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all font-bold py-3 px-4 rounded-xl shadow-sm text-sm"
        >
          <MapPin size={16} />
          Navigate to Pickup
          <ExternalLink size={12} className="ml-auto opacity-50" />
        </button>
        <button 
          onClick={navToDropoff}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-600 transition-all font-bold py-3 px-4 rounded-xl shadow-sm text-sm"
        >
          <Flag size={16} />
          Navigate to Drop-off
          <ExternalLink size={12} className="ml-auto opacity-70" />
        </button>
      </div>
    </div>
  );
};

export default MoverRouteMap;
