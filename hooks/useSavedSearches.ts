'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RecommendationFrequency, SavedSearchFirestore } from '@/types/platform'

type SavedSearchApiResponse = {
  ok?: boolean
  searches?: SavedSearchFirestore[]
  search?: SavedSearchFirestore
  error?: string
}

type CreateSavedSearchInput = {
  label: string
  criteria: SavedSearchFirestore['criteria']
  frequency?: RecommendationFrequency
  marketingOptIn?: boolean
  locale?: string
}

type UpdateSavedSearchInput = {
  searchId: string
  label?: string
  criteria?: SavedSearchFirestore['criteria']
  frequency?: RecommendationFrequency
  marketingOptIn?: boolean
  status?: 'active' | 'paused'
}

export function buildSavedSearchUrl(search: Pick<SavedSearchFirestore, 'criteria'>): string {
  const params = new URLSearchParams()
  const criteria = search.criteria || {}

  if (criteria.query) params.set('q', criteria.query)
  if (criteria.city) params.set('city', criteria.city)
  if (criteria.sector) params.set('sector', criteria.sector)
  if (criteria.propertyType) params.set('type', criteria.propertyType)
  if (criteria.listingType) params.set('listingType', criteria.listingType)
  if (criteria.priceMin) params.set('minPrice', String(criteria.priceMin))
  if (criteria.priceMax) params.set('maxPrice', String(criteria.priceMax))
  if (criteria.bedroomsMin) params.set('bedrooms', String(criteria.bedroomsMin))
  if (criteria.bathroomsMin) params.set('bathrooms', String(criteria.bathroomsMin))

  const query = params.toString()
  return query ? `/search?${query}` : '/search'
}

export function useSavedSearches(options?: { autoLoad?: boolean }) {
  const [searches, setSearches] = useState<SavedSearchFirestore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSearches = useCallback(async (): Promise<SavedSearchFirestore[]> => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/saved-searches', { cache: 'no-store' })
      const json = (await res.json().catch(() => ({}))) as SavedSearchApiResponse

      if (!res.ok || !json.ok) {
        const message = json.error || (res.status === 401 ? 'Debes iniciar sesion para guardar busquedas' : 'No se pudo cargar tus busquedas')
        setError(message)
        setSearches([])
        return []
      }

      const next = json.searches || []
      setSearches(next)
      return next
    } catch {
      const message = 'No se pudo cargar tus busquedas'
      setError(message)
      setSearches([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createSearch = useCallback(async (input: CreateSavedSearchInput): Promise<SavedSearchFirestore | null> => {
    setError('')
    const res = await fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const json = (await res.json().catch(() => ({}))) as SavedSearchApiResponse
    if (!res.ok || !json.ok || !json.search) {
      setError(json.error || (res.status === 401 ? 'Debes iniciar sesion para guardar busquedas' : 'No se pudo guardar la busqueda'))
      return null
    }

    setSearches((current) => [json.search as SavedSearchFirestore, ...current.filter((s) => s.id !== json.search?.id)])
    return json.search as SavedSearchFirestore
  }, [])

  const updateSearch = useCallback(async (input: UpdateSavedSearchInput): Promise<boolean> => {
    setError('')
    const res = await fetch('/api/saved-searches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const json = (await res.json().catch(() => ({}))) as SavedSearchApiResponse
    if (!res.ok || !json.ok) {
      setError(json.error || 'No se pudo actualizar la busqueda')
      return false
    }

    setSearches((current) =>
      current.map((item) =>
        item.id === input.searchId
          ? {
              ...item,
              ...(input.label !== undefined ? { label: input.label } : {}),
              ...(input.criteria !== undefined ? { criteria: input.criteria } : {}),
              ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
              ...(input.marketingOptIn !== undefined ? { marketingOptIn: input.marketingOptIn } : {}),
              ...(input.status !== undefined ? { status: input.status } : {}),
            }
          : item
      )
    )

    return true
  }, [])

  const removeSearch = useCallback(async (searchId: string): Promise<boolean> => {
    setError('')
    const res = await fetch(`/api/saved-searches?searchId=${encodeURIComponent(searchId)}`, {
      method: 'DELETE',
    })

    const json = (await res.json().catch(() => ({}))) as SavedSearchApiResponse
    if (!res.ok || !json.ok) {
      setError(json.error || 'No se pudo eliminar la busqueda')
      return false
    }

    setSearches((current) => current.filter((item) => item.id !== searchId))
    return true
  }, [])

  useEffect(() => {
    if (!options?.autoLoad) return
    loadSearches()
  }, [loadSearches, options?.autoLoad])

  return useMemo(
    () => ({
      searches,
      loading,
      error,
      loadSearches,
      createSearch,
      updateSearch,
      removeSearch,
    }),
    [searches, loading, error, loadSearches, createSearch, updateSearch, removeSearch]
  )
}
