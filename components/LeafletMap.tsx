"use client";

import { useEffect, useState } from 'react';

interface Property {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
}

export default function LeafletMap({ properties, user }: { properties: Property[]; user: any }) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // Import everything client-side only
    if (typeof window === 'undefined') return;
    
    let cancelled = false;

    (async () => {
      try {
        // Import CSS
        await import('leaflet/dist/leaflet.css');
        
        // Import Leaflet
        const leaflet = await import('leaflet');
        const leafletModule = leaflet.default || leaflet;
        
        // Import react-leaflet components
        const reactLeaflet = await import('react-leaflet');
        
        // Fix default marker icon
        delete (leafletModule.Icon.Default.prototype as any)._getIconUrl;
        leafletModule.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!cancelled) {
          setL(leafletModule);
          setMapComponents(reactLeaflet);
        }
      } catch (e) {
        console.error('Failed to load map:', e);
      }
    })();

    return () => { cancelled = true };
  }, []);

  if (!MapComponents || !L) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-600">Cargando mapa...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  return (
    <MapContainer center={[18.7357, -70.1627]} zoom={8} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
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
