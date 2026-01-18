import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon not showing
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to handle flying to new locations (e.g. after search)
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapPicker({ position, onLocationSelect, mapCenter }) {
  // Default to Hither Green if no specific center provided
  const defaultCenter = { lat: 51.4517, lng: -0.0003 };
  const centerToUse = mapCenter || defaultCenter;

  return (
    <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300 mt-2 z-0 relative">
      <MapContainer center={centerToUse} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        {/* CartoDB Positron (Light/Clean Streets) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={mapCenter} zoom={16} />
        
        <MapEvents onMapClick={(latlng) => {
            onLocationSelect(latlng);
        }} />

        {position && <Marker position={position}></Marker>}
      </MapContainer>
      <div className="absolute bottom-1 right-1 bg-white/80 px-2 py-1 text-xs text-gray-500 z-[1000] rounded">
        Tap map to adjust pin
      </div>
    </div>
  );
}