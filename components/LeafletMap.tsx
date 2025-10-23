"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Property {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
}

export default function LeafletMap({ properties, user }: { properties: Property[]; user: any }) {
  const [ready, setReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => {
    // Defer to client mount
    setReady(true);

    let cancelled = false;
    // Dynamically import Leaflet and assets on client to avoid SSR eval issues
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const L = (await import('leaflet')).default;
        const iconUrl = (await import('leaflet/dist/images/marker-icon.png')).default as unknown as string;
        const iconRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default as unknown as string;
        const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default as unknown as string;

        const DefaultIcon = L.icon({
          iconUrl,
          iconRetinaUrl,
          shadowUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        (L.Marker as any).prototype.options.icon = DefaultIcon;
        if (!cancelled) setIconsReady(true);
      } catch (e) {
        console.error('Leaflet icon init failed:', e);
        if (!cancelled) setIconsReady(true); // proceed without custom icons
      }
    })();

    return () => { cancelled = true };
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
