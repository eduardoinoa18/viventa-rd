'use client'

import Link from 'next/link'
import { FiCheck, FiX, FiMapPin, FiDollarSign, FiEye, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi'
import { normalizeListingStatus, getStatusMeta } from '@/lib/listingStatus'
import { computeQualityScore } from '@/lib/searchUtils'
import type { Listing } from '@/types/listing'

interface ListingTableProps {
  listings: Listing[]
  loading: boolean
  viewMode: 'list' | 'grid'
  selected: Record<string, boolean>
  searchQuery: string
  onToggleOne: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
}

export default function ListingTable({
  listings,
  loading,
  viewMode,
  selected,
  searchQuery,
  onToggleOne,
  onApprove,
  onReject,
  onDelete,
}: ListingTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-gray-500">Cargando propiedades...</div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FiSearch className="text-4xl mx-auto mb-3 text-gray-400" />
        <div className="text-gray-900 font-semibold mb-1">No se encontraron propiedades</div>
        <div className="text-gray-500 text-sm">
          {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay propiedades con este estado'}
        </div>
      </div>
    )
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
      {listings.map((listing) => {
        const uiStatus = normalizeListingStatus(listing)
        const statusMeta = getStatusMeta(uiStatus)
        const isPending = listing.status === 'pending'

        if (viewMode === 'grid') {
          return (
            <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden">
              {/* Grid Card View */}
              <div className="flex flex-col">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {listing.images && listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin Imagen
                    </div>
                  )}
                  
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={!!selected[listing.id]}
                      onChange={() => onToggleOne(listing.id)}
                      className="h-5 w-5 bg-white rounded shadow-lg"
                      aria-label={`Seleccionar propiedad ${listing.title || listing.id}`}
                    />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${statusMeta.statusBgColor} ${statusMeta.statusColor}`}>
                      {statusMeta.statusIcon} {statusMeta.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <div className="flex items-center gap-1">
                      <FiMapPin className="text-gray-400" />
                      {listing.city || 'N/A'}{listing.sector ? `, ${listing.sector}` : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="text-gray-400" />
                      <span className="font-bold text-[#00A676]">${listing.price.toLocaleString()}</span>
                    </div>
                    {(listing.bedrooms || listing.bathrooms || listing.area) && (
                      <div className="flex gap-3 text-xs">
                        {listing.bedrooms && <span>🛏️ {listing.bedrooms}</span>}
                        {listing.bathrooms && <span>🛁 {listing.bathrooms}</span>}
                        {listing.area && <span>📐 {listing.area}m²</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => onApprove(listing.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] text-sm font-medium transition-colors"
                        >
                          <FiCheck /> Aprobar
                        </button>
                        <button
                          onClick={() => onReject(listing.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                        >
                          <FiX /> Rechazar
                        </button>
                      </>
                    )}
                    <Link
                      href={`/master/listings/${listing.id}/edit`}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                    >
                      <FiEdit /> Editar
                    </Link>
                    <a
                      href={`/listing/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors ${isPending ? '' : 'flex-1'}`}
                    >
                      <FiEye /> Ver
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // List View
        return (
          <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Checkbox + Image */}
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected[listing.id]}
                    onChange={() => onToggleOne(listing.id)}
                    className="h-5 w-5"
                    aria-label={`Seleccionar propiedad ${listing.title || listing.id}`}
                  />
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      Sin Imagen
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta.statusBgColor} ${statusMeta.statusColor}`}>
                      {statusMeta.statusIcon} {statusMeta.statusLabel}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700" title="Puntuación de calidad">
                      QS: {computeQualityScore(listing as any).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-gray-600 space-y-1 mb-3">
                    <div className="flex items-center gap-2">
                      <FiMapPin /> {listing.city || 'N/A'}{listing.sector ? `, ${listing.sector}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiDollarSign />
                      <span className="font-bold text-[#00A676] text-lg">USD {listing.price.toLocaleString()}</span>
                    </div>
                    {(listing.bedrooms || listing.bathrooms || listing.area) && (
                      <div className="flex gap-4 text-sm">
                        {listing.bedrooms && <span>🛏️ {listing.bedrooms} hab.</span>}
                        {listing.bathrooms && <span>🛁 {listing.bathrooms} baños</span>}
                        {listing.area && <span>📐 {listing.area} m²</span>}
                        {listing.propertyType && <span className="text-gray-500">• {listing.propertyType}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => onApprove(listing.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors whitespace-nowrap"
                      >
                        <FiCheck /> Aprobar
                      </button>
                      <button
                        onClick={() => onReject(listing.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        <FiX /> Rechazar
                      </button>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/master/listings/${listing.id}/edit`}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                    >
                      <FiEdit /> Editar
                    </Link>
                    <a
                      href={`/listing/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                    >
                      <FiEye /> Ver
                    </a>
                    <button
                      onClick={() => onDelete(listing.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
