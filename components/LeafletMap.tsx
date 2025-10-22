"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Some Leaflet builds need icon fix when bundling with Next.js
import L from 'leaflet';
// @ts-ignore - webpack file-loader paths might differ, handle gracefully
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Ensure default icon paths are set to bundled assets (prevents missing marker icons)
const DefaultIcon = L.icon({
  iconUrl: (iconUrl as unknown as string) ?? '',
  iconRetinaUrl: (iconRetinaUrl as unknown as string) ?? '',
  shadowUrl: (shadowUrl as unknown as string) ?? '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon as any;

interface Property {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
}

export default function LeafletMap({ properties, user }: { properties: Property[]; user: any }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer to client
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-600">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <MapContainer center={[18.7357, -70.1627]} zoom={8} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng] as any}>
          <Popup>
            <strong>{p.title}</strong>
            <br />${p.price.toLocaleString()}
            <br />
            {user ? (
              <a href={`/properties/${p.id}`} className="text-blue-700 underline text-sm">
                Ver
              </a>
            ) : (
              <a href="/login" className="text-blue-700 underline text-sm">
                Inicia sesión para ver
              </a>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
