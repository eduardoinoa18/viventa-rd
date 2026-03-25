'use client'

/**
 * Saved Search Preferences Card
 * Renders inside the notifications/alerts page so buyers can manage
 * per-search email frequency and marketing opt-in without leaving the page.
 */

import { useEffect, useRef, useState } from 'react'
import { FiRotateCcw, FiBell, FiBellOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { buildSavedSearchUrl, useSavedSearches } from '@/hooks/useSavedSearches'
import type { RecommendationFrequency, SavedSearchFirestore } from '@/types/platform'
import Link from 'next/link'

const FREQUENCY_LABELS: Record<RecommendationFrequency, string> = {
  instant: 'Inmediato',
  daily_digest: 'Resumen diario',
  weekly_digest: 'Resumen semanal',
  off: 'Pausado',
}

const FREQUENCY_OPTIONS: RecommendationFrequency[] = ['instant', 'daily_digest', 'weekly_digest', 'off']

interface SavedSearchCardProps {
  item: SavedSearchFirestore
  onUpdate: (searchId: string, patch: { frequency?: RecommendationFrequency; marketingOptIn?: boolean; status?: 'active' | 'paused' }) => Promise<void>
  onRemove: (searchId: string) => Promise<void>
}

function SavedSearchCardItem({ item, onUpdate, onRemove }: SavedSearchCardProps) {
  const [loading, setLoading] = useState(false)

  async function handle<T>(fn: () => Promise<T>) {
    if (loading) return
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#0B2545] truncate">{item.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {new Date(typeof item.createdAt === 'number' ? item.createdAt : 0).toLocaleDateString('es-DO')}
          </div>
        </div>
        <Link
          href={buildSavedSearchUrl(item)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-white text-[#0B2545]"
        >
          Abrir
        </Link>
      </div>

      {/* Frequency selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FREQUENCY_OPTIONS.map((freq) => (
          <button
            key={freq}
            type="button"
            disabled={loading}
            onClick={() => handle(() => onUpdate(item.id, { frequency: freq }))}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              item.frequency === freq
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {FREQUENCY_LABELS[freq]}
          </button>
        ))}
      </div>

      {/* Marketing opt-in toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {item.marketingOptIn ? (
            <FiBell className="text-[#00A676] w-4 h-4" />
          ) : (
            <FiBellOff className="text-gray-400 w-4 h-4" />
          )}
          <span className="text-xs text-gray-700">
            {item.marketingOptIn ? 'Alertas de email activas' : 'Alertas de email inactivas'}
          </span>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => handle(() => onUpdate(item.id, { marketingOptIn: !item.marketingOptIn }))}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            item.marketingOptIn ? 'bg-[#00A676]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
              item.marketingOptIn ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Pause / Resume */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handle(() =>
              onUpdate(item.id, { status: item.status === 'active' ? 'paused' : 'active' })
            )
          }
          className="text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
        >
          {item.status === 'active' ? 'Pausar' : 'Reactivar'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handle(() => onRemove(item.id))}
          className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default function SavedSearchPreferences({ sessionUid }: { sessionUid: string }) {
  const { searches, loading, error, loadSearches, updateSearch, removeSearch } = useSavedSearches()
  const loaded = useRef(false)

  useEffect(() => {
    if (!sessionUid || loaded.current) return
    loaded.current = true
    loadSearches()
  }, [sessionUid, loadSearches])

  async function handleUpdate(searchId: string, patch: Record<string, any>) {
    const ok = await updateSearch({ searchId, ...patch })
    if (!ok) {
      toast.error('No se pudo actualizar la búsqueda')
    }
  }

  async function handleRemove(searchId: string) {
    const ok = await removeSearch(searchId)
    if (ok) {
      toast.success('Búsqueda eliminada')
    } else {
      toast.error('No se pudo eliminar la búsqueda')
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
        <FiRotateCcw className="animate-spin w-4 h-4 text-gray-400" />
        Cargando búsquedas guardadas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">{error}</div>
    )
  }

  if (searches.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Aún no tienes búsquedas guardadas.{' '}
        <Link href="/search" className="text-[#00A676] font-medium">
          Guarda tu primera búsqueda
        </Link>
        .
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {searches.map((item) => (
        <SavedSearchCardItem
          key={item.id}
          item={item}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
