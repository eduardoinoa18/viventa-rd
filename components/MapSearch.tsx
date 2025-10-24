'use client'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { useInstantSearch, useHits } from 'react-instantsearch'
import { formatCurrency, convertCurrency, getUserCurrency, type Currency } from '@/lib/currency'

export default function MapSearch() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const { uiState, setUiState, indexUiState } = useInstantSearch()
  const indexId = Object.keys(uiState)[0]
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const [currency, setCurrency] = useState<Currency>('USD')

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
      el.className = 'relative'
      // price chip
      const priceUSD = Number((h as any).price_usd || 0)
      const amount = currency === 'USD' ? priceUSD : convertCurrency(priceUSD, 'USD', 'DOP')
      const label = formatCurrency(amount, { currency, compact: true })
      el.innerHTML = `
        <div class="px-2 py-1 bg-white text-[#0B2545] border border-gray-200 rounded-full text-xs font-semibold shadow">${label}</div>
        <div class="mx-auto mt-1 w-2 h-2 bg-[#FF6B35] rounded-full ring-2 ring-white shadow"></div>
      `
      const mk = new mapboxgl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).addTo(m)
      markers.push(mk)
    })
    ;(m as any)._viventaMarkers = markers
  }, [hits, currency])

  // Listen for currency changes
  useEffect(() => {
    setCurrency(getUserCurrency())
    const onCurrency = (e: Event) => {
      const detail = (e as CustomEvent).detail as { currency: Currency }
      if (detail?.currency) setCurrency(detail.currency)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('currencyChanged', onCurrency as EventListener)
      return () => window.removeEventListener('currencyChanged', onCurrency as EventListener)
    }
  }, [])

  if (!token) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <div className="text-center p-4">
          <p className="font-semibold">Mapa no disponible</p>
          <p className="text-sm mt-1">Configure NEXT_PUBLIC_MAPBOX_TOKEN</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200" ref={containerRef} />
      {!mapRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <div className="flex items-center gap-3 text-gray-600">
            <span className="animate-spin inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent" />
            <span>Cargando mapa…</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md text-xs text-gray-600">
        💡 Mueve el mapa para buscar en esa área
      </div>
    </div>
  )
}

function estimateRadiusKm(b: mapboxgl.LngLatBounds) {
  const dx = b.getEast() - b.getWest()
  const dy = b.getNorth() - b.getSouth()
  const approx = Math.max(dx, dy)
  return approx * 111
}
