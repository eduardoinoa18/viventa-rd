export interface SavedSearchCriteria {
  id: string
  name: string
  query: string
  filters?: {
    propertyType?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bathrooms?: number
  }
  createdAt: string
}

const SAVED_PROPERTIES_KEY = 'viventa:saved-properties'
const SAVED_SEARCHES_KEY = 'viventa:saved-searches'

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function getSavedPropertyIds(): string[] {
  if (typeof window === 'undefined') return []
  return safeParse<string[]>(window.localStorage.getItem(SAVED_PROPERTIES_KEY), [])
}

export function isPropertySaved(propertyId: string): boolean {
  return getSavedPropertyIds().includes(propertyId)
}

export function toggleSavedProperty(propertyId: string): { saved: boolean; ids: string[] } {
  if (typeof window === 'undefined') return { saved: false, ids: [] }
  const current = getSavedPropertyIds()
  const exists = current.includes(propertyId)
  const next = exists ? current.filter((id) => id !== propertyId) : [propertyId, ...current]
  window.localStorage.setItem(SAVED_PROPERTIES_KEY, JSON.stringify(next))
  return { saved: !exists, ids: next }
}

export function getSavedSearches(): SavedSearchCriteria[] {
  if (typeof window === 'undefined') return []
  return safeParse<SavedSearchCriteria[]>(window.localStorage.getItem(SAVED_SEARCHES_KEY), [])
}

export function saveSearchCriteria(input: Omit<SavedSearchCriteria, 'id' | 'createdAt'>): SavedSearchCriteria {
  const nextItem: SavedSearchCriteria = {
    id: `search_${Date.now()}`,
    name: input.name?.trim() || input.query?.trim() || 'Búsqueda guardada',
    query: input.query || '',
    filters: input.filters || {},
    createdAt: new Date().toISOString(),
  }

  if (typeof window === 'undefined') return nextItem

  const current = getSavedSearches()
  const next = [nextItem, ...current].slice(0, 25)
  window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next))
  return nextItem
}

export function removeSavedSearch(searchId: string): SavedSearchCriteria[] {
  if (typeof window === 'undefined') return []
  const next = getSavedSearches().filter((item) => item.id !== searchId)
  window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next))
  return next
}

export function buildSearchUrl(search: SavedSearchCriteria): string {
  const params = new URLSearchParams()

  if (search.query) params.set('q', search.query)
  if (search.filters?.propertyType) params.set('type', search.filters.propertyType)
  if (search.filters?.minPrice) params.set('minPrice', String(search.filters.minPrice))
  if (search.filters?.maxPrice) params.set('maxPrice', String(search.filters.maxPrice))
  if (search.filters?.bedrooms) params.set('bedrooms', String(search.filters.bedrooms))
  if (search.filters?.bathrooms) params.set('bathrooms', String(search.filters.bathrooms))

  const query = params.toString()
  return query ? `/search?${query}` : '/search'
}
