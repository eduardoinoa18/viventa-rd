'use client'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatCurrency, type Currency } from '@/lib/currency'
import type { Listing } from '@/lib/customSearchService'

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface CustomMapSearchProps {
  listings: Listing[]
  onMarkerClick?: (id: string) => void
  currency?: Currency
}

export default function CustomMapSearch({ 
  listings = [], 
  onMarkerClick,
  currency = 'USD' 
}: CustomMapSearchProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Create map centered on Dominican Republic
    const map = L.map(mapContainerRef.current).setView([18.7357, -70.1627], 8)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when listings change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers
    const validListings = listings.filter(
      (listing) =>
        listing.location?.coordinates?.latitude &&
        listing.location?.coordinates?.longitude
    )

    if (validListings.length === 0) {
      // No markers to show, zoom out to show all DR
      mapRef.current.setView([18.7357, -70.1627], 8)
      return
    }

    validListings.forEach((listing) => {
      const { latitude, longitude } = listing.location!.coordinates!

      // Create custom icon for property type
      const iconHtml = `
        <div class="custom-marker" style="
          background: white;
          border: 2px solid #0B2545;
          border-radius: 8px;
          padding: 4px 8px;
          font-weight: 600;
          font-size: 12px;
          color: #0B2545;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          ${formatCurrency(listing.price, { currency, compact: true })}
        </div>
      `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker-container',
        iconSize: [80, 30],
        iconAnchor: [40, 30],
      })

      const marker = L.marker([latitude, longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(
          `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0B2545;">
              ${listing.title}
            </h3>
            ${
              listing.images?.[0]
                ? `<img src="${listing.images[0]}" alt="${listing.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />`
                : ''
            }
            <p style="margin: 4px 0; font-size: 13px; color: #666;">
              <strong>${formatCurrency(listing.price, { currency })}</strong>
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${listing.bedrooms || 0} hab • ${listing.bathrooms || 0} baños • ${listing.area || 0} m²
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              📍 ${listing.location?.city || ''}, ${listing.location?.neighborhood || ''}
            </p>
            ${
              onMarkerClick
                ? `<button onclick="window.location.href='/listing/${listing.id}'" style="
                  margin-top: 8px;
                  width: 100%;
                  padding: 6px;
                  background: #0B2545;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: pointer;
                  font-weight: 600;
                ">Ver detalles</button>`
                : ''
            }
          </div>
        `
        )

      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(listing.id)
        })
      }

      markersRef.current.push(marker)
    })

    // Fit map bounds to show all markers
    if (validListings.length > 0) {
      const bounds = L.latLngBounds(
        validListings.map((listing) => [
          listing.location!.coordinates!.latitude,
          listing.location!.coordinates!.longitude,
        ])
      )
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [listings, onMarkerClick, currency])

  return (
    <div className="relative h-full min-h-[400px] lg:min-h-[600px]">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-sm"
      />
      
      {listings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">No hay propiedades para mostrar en el mapa</p>
            <p className="text-sm text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium text-gray-700 z-[1000]">
          {listings.length} {listings.length === 1 ? 'propiedad' : 'propiedades'}
        </div>
      )}
    </div>
  )
}
