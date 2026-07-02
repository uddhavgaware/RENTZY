import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Navigation, Clock, Activity } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4 relative z-0">
      {/* Header Info */}
      <div className="p-4 bg-gray-900 text-white flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-indigo-400" />
          <span className="font-bold">Live Navigation Route</span>
        </div>
        
        {loading ? (
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Calculating optimal route...
          </div>
        ) : routeData ? (
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock size={16} className="text-amber-400" />
              {routeData.duration} mins
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Activity size={16} className="text-green-400" />
              {routeData.distance} km
            </div>
            {usingMapbox && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Traffic Aware
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>

      {/* Map Container */}
      <div className="h-[250px] w-full relative z-0 bg-gray-100">
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
    </div>
  );
};

export default MoverRouteMap;
