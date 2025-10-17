'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useInstantSearch, useHits } from 'react-instantsearch'

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

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [containerRef, token, setUiState, uiState, indexId, indexUiState])

  const { hits } = useHits<any>()
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    const old = (m as any)._viventaMarkers as mapboxgl.Marker[] | undefined
    old?.forEach((mk) => mk.remove())
    const markers: mapboxgl.Marker[] = []
    hits.forEach((h) => {
      const loc = (h as any)._geoloc
      if (!loc || loc.lat == null || loc.lng == null) return
      const el = document.createElement('div')
      el.className = 'bg-[#FF6B35] rounded-full w-3 h-3 ring-2 ring-white shadow'
      const mk = new mapboxgl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).addTo(m)
      markers.push(mk)
    })
    ;(m as any)._viventaMarkers = markers
  }, [hits])

  return <div className="w-full h-80 rounded-lg overflow-hidden" ref={containerRef} />
}

function estimateRadiusKm(b: mapboxgl.LngLatBounds) {
  const dx = b.getEast() - b.getWest()
  const dy = b.getNorth() - b.getSouth()
  const approx = Math.max(dx, dy)
  return approx * 111
}
