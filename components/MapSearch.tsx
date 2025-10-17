"use client"
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useInstantSearch } from 'react-instantsearch'

export default function MapSearch() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const { uiState, setUiState, indexUiState } = useInstantSearch()
  const indexId = Object.keys(uiState)[0]
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!token) return
    mapboxgl.accessToken = token
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-69.9312, 18.4861],
      zoom: 8,
    })

    mapRef.current.on('moveend', () => {
      const m = mapRef.current!
      const center = m.getCenter()
      const bounds = m.getBounds() as mapboxgl.LngLatBounds
      const radiusKm = estimateRadiusKm(bounds)
      setUiState((prev: any) => ({
        ...prev,
        [indexId]: {
          ...prev[indexId],
          configure: {
            ...prev[indexId]?.configure,
            aroundLatLng: `${center.lat}, ${center.lng}`,
            aroundRadius: Math.round(radiusKm * 1000),
          },
        },
      }))
    })
  }, [containerRef, token, setUiState, uiState, indexId, indexUiState])

  return <div className="w-full h-80 rounded-lg overflow-hidden" ref={containerRef} />
}

function estimateRadiusKm(b: mapboxgl.LngLatBounds) {
  const dx = b.getEast() - b.getWest()
  const dy = b.getNorth() - b.getSouth()
  const approx = Math.max(dx, dy)
  // crude conversion degrees to km near equator
  return approx * 111
}
