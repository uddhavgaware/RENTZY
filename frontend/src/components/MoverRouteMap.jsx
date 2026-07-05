import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Navigation, Clock, Activity, MapPin, Flag, ExternalLink } from 'lucide-react';

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const createPin = (color) => divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-${color}-500 rounded-full opacity-35 animate-ping"></div>
        <div class="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-${color}-600">
          <div class="w-2.5 h-2.5 bg-${color}-600 rounded-full"></div>
        </div>
      </div>
    </div>
  `,
  className: 'custom-map-marker-container',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const pickupPin = createPin('indigo');
const dropoffPin = createPin('green');

const MoverRouteMap = ({ job }) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMapbox, setUsingMapbox] = useState(false);

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
        let isMapbox = false;

        if (mapboxToken) {
          // Use Mapbox with live traffic profile
          url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start};${end}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
          isMapbox = true;
          setUsingMapbox(true);
        } else {
          // Fallback to free OSRM
          url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?geometries=geojson&overview=full`;
          setUsingMapbox(false);
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Routing failed");
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON coordinates are [lon, lat], Leaflet expects [lat, lon]
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          setRouteData({
            coordinates,
            distance: (route.distance / 1000).toFixed(1), // in km
            duration: Math.ceil(route.duration / 60) // in minutes
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
        Live routing unavailable: Customer did not pin exact locations on the map.
      </div>
    );
  }

  const navToPickup = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.fromLatitude},${job.fromLongitude}`, '_blank');
  const navToDropoff = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.toLatitude},${job.toLongitude}`, '_blank');

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden mt-6 relative z-0 flex flex-col">
      {/* Header Info */}
      <div className="p-4 bg-gradient-to-r from-gray-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
            <Navigation size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight text-white">Interactive Map</h3>
            <p className="text-xs text-gray-400">Turn-by-turn navigation available below</p>
          </div>
        </div>
        
        {loading ? (
          <div className="text-sm font-medium text-indigo-300 flex items-center gap-2 bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-500/20">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Routing...
          </div>
        ) : routeData ? (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700">
              <Clock size={16} className="text-amber-400" />
              <span className="text-sm font-bold text-white">{routeData.duration} mins</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700">
              <Activity size={16} className="text-green-400" />
              <span className="text-sm font-bold text-white">{routeData.distance} km</span>
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium text-red-400 bg-red-900/30 px-3 py-1 rounded-lg">{error}</span>
        )}
      </div>

      {/* Map Container */}
      <div className="h-[300px] w-full relative z-0 bg-gray-100">
        {routeData && (
          <MapContainer 
            bounds={[ [job.fromLatitude, job.fromLongitude], [job.toLatitude, job.toLongitude] ]} 
            scrollWheelZoom={false} 
            className="h-full w-full relative z-0"
          >
            <MapUpdater bounds={routeData.coordinates} />
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {/* Draw the beautiful route line */}
            <Polyline 
              positions={routeData.coordinates} 
              color="#4f46e5" 
              weight={5} 
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
            />
            <Marker position={[job.fromLatitude, job.fromLongitude]} icon={pickupPin} />
            <Marker position={[job.toLatitude, job.toLongitude]} icon={dropoffPin} />
          </MapContainer>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        <button 
          onClick={navToPickup}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all font-bold py-3 px-4 rounded-xl shadow-sm"
        >
          <MapPin size={18} />
          Navigate to Pickup
          <ExternalLink size={14} className="ml-auto opacity-50" />
        </button>
        <button 
          onClick={navToDropoff}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-600 transition-all font-bold py-3 px-4 rounded-xl shadow-sm"
        >
          <Flag size={18} />
          Navigate to Drop-off
          <ExternalLink size={14} className="ml-auto opacity-70" />
        </button>
      </div>
    </div>
  );
};

export default MoverRouteMap;
