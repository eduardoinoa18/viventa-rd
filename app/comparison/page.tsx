'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiX, FiDownload, FiShare2 } from 'react-icons/fi'

type ComparisonProperty = {
  id: string
  title: string
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  area: number
  city: string
  sector: string
  listingType: string
  propertyType: string
  maintenanceFee: number
  yearBuilt: number
  features: string[]
  image: string
}

export default function PropertyComparison() {
  const [properties, setProperties] = useState<ComparisonProperty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load comparison properties from localStorage
    const saved = localStorage.getItem('comparison_properties')
    if (saved) {
      try {
        const ids = JSON.parse(saved) as string[]
        loadProperties(ids.slice(0, 4)) // Max 4 properties
      } catch (e) {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadProperties = async (ids: string[]) => {
    try {
      const loaded: ComparisonProperty[] = []
      for (const id of ids) {
        const res = await fetch(`/api/properties/${id}`)
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.data) {
          const d = json.data
          loaded.push({
            id: d.id,
            title: d.title,
            price: d.price,
            currency: d.currency || 'USD',
            bedrooms: d.bedrooms || 0,
            bathrooms: d.bathrooms || 0,
            area: d.area || 0,
            city: d.city,
            sector: d.sector || d.neighborhood || '',
            listingType: d.listingType || 'sale',
            propertyType: d.propertyType,
            maintenanceFee: d.maintenanceFee || 0,
            yearBuilt: d.yearBuilt || 0,
            features: Array.isArray(d.features) ? d.features : [],
            image: d.coverImage || d.images?.[0] || '/placeholder.png',
          })
        }
      }
      setProperties(loaded)
    } catch (e) {
      console.error('Error loading properties:', e)
    } finally {
      setLoading(false)
    }
  }

  const removeProperty = (id: string) => {
    const updated = properties.filter((p) => p.id !== id)
    setProperties(updated)
    const saved = updated.map((p) => p.id)
    if (saved.length > 0) {
      localStorage.setItem('comparison_properties', JSON.stringify(saved))
    } else {
      localStorage.removeItem('comparison_properties')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando comparación...</p>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparación de Propiedades</h1>
          <p className="text-gray-600 mb-6">Selecciona propiedades para compararlas lado a lado</p>
          <Link
            href="/search"
            className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008f64]"
          >
            Explorar Propiedades
          </Link>
        </div>
      </div>
    )
  }

  const pricePerM2 = properties.map((p) => (p.area > 0 ? p.price / p.area : 0))
  const maxPrice = Math.max(...properties.map((p) => p.price))
  const minPrice = Math.min(...properties.map((p) => p.price))

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Comparación de Propiedades</h1>
            <p className="text-gray-600 mt-1">{properties.length} propiedades</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">
              <FiDownload /> Descargar
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">
              <FiShare2 /> Compartir
            </button>
          </div>
        </div>

        {/* Mobile Comparison Cards */}
        <div className="space-y-4 md:hidden">
          {properties.map((p) => (
            <article key={p.id} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
              <div className="relative h-44 bg-gray-100">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeProperty(p.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/95 text-gray-600 shadow hover:text-red-600"
                  aria-label="Remover"
                >
                  <FiX />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <Link href={`/listing/${p.id}`} className="block font-bold text-[#0B2545] leading-tight hover:underline">
                  {p.title}
                </Link>
                <p className="text-xs text-gray-500">{p.city}, {p.sector}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-[11px] text-gray-500">Precio</p>
                    <p className="font-bold text-[#FF6B35]">{p.currency === 'USD' ? '$' : 'RD$'} {p.price.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-[11px] text-gray-500">Precio/m²</p>
                    <p className="font-semibold text-[#0B2545]">{p.currency === 'USD' ? '$' : 'RD$'} {Math.round(pricePerM2[properties.indexOf(p)]).toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-[11px] text-gray-500">Hab / Baños</p>
                    <p className="font-semibold text-[#0B2545]">{p.bedrooms || '—'} / {p.bathrooms || '—'}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-[11px] text-gray-500">Metraje</p>
                    <p className="font-semibold text-[#0B2545]">{p.area.toLocaleString()} m²</p>
                  </div>
                </div>

                <Link
                  href={`/listing/${p.id}`}
                  className="block w-full px-4 py-2 bg-[#00A676] text-white rounded-lg text-center font-semibold hover:bg-[#008f64] transition"
                >
                  Ver Detalles
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Comparison Table - Scrollable on Mobile */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50">
                  Propiedad
                </th>
                {properties.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[250px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/listing/${p.id}`} className="block font-semibold text-[#0B2545] hover:underline truncate">
                          {p.title}
                        </Link>
                        <p className="text-xs text-gray-500">{p.city}, {p.sector}</p>
                      </div>
                      <button
                        onClick={() => removeProperty(p.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600"
                        aria-label="Remover"
                      >
                        <FiX />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Images */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">Imagen</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    <img src={p.image} alt={p.title} className="w-full h-40 object-cover rounded-lg" />
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="bg-blue-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-blue-50">Precio</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-[#FF6B35]">
                        {p.currency === 'USD' ? '$' : 'RD$'} {p.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {p.currency === 'USD' ? '$' : 'RD$'} {Math.round(pricePerM2[properties.indexOf(p)]).toLocaleString()}/m²
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.listingType === 'rent' ? 'Alquiler' : 'Venta'}
                      </p>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Bedrooms */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">Habitaciones</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-lg font-semibold text-[#0B2545]">
                    {p.bedrooms || '—'}
                  </td>
                ))}
              </tr>

              {/* Bathrooms */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Baños</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-lg font-semibold text-[#0B2545]">
                    {p.bathrooms || '—'}
                  </td>
                ))}
              </tr>

              {/* Area */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">Metraje</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-lg font-semibold text-[#0B2545]">
                    {p.area.toLocaleString()} m²
                  </td>
                ))}
              </tr>

              {/* Property Type */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Tipo</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-sm text-gray-700 capitalize">
                    {p.propertyType}
                  </td>
                ))}
              </tr>

              {/* Year Built */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">Año Construcción</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-sm text-gray-700">
                    {p.yearBuilt || '—'}
                  </td>
                ))}
              </tr>

              {/* Maintenance Fee */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50">Mantenimiento</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-sm text-gray-700">
                    {p.maintenanceFee > 0 ? `RD$ ${p.maintenanceFee.toLocaleString()}` : '—'}
                  </td>
                ))}
              </tr>

              {/* CTA Row */}
              <tr>
                <td className="px-4 py-3 sticky left-0 bg-white"></td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    <Link
                      href={`/listing/${p.id}`}
                      className="block w-full px-4 py-2 bg-[#00A676] text-white rounded-lg text-center font-semibold hover:bg-[#008f64] transition"
                    >
                      Ver Detalles
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add More Properties */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Agregar más propiedades?</h3>
          <p className="text-gray-600 mb-4">Puedes comparar hasta 4 propiedades</p>
          <Link
            href="/search"
            className="inline-block px-6 py-2 bg-[#0B2545] text-white rounded-lg font-semibold hover:bg-[#0B2545]/90"
          >
            Buscar Propiedades
          </Link>
        </div>
      </div>
    </div>
  )
}
