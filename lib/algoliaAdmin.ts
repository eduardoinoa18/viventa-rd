import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch'

const APP_ID = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || ''
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || ''
export const ALGOLIA_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_INDEX || process.env.ALGOLIA_INDEX || 'viventa_listings'

let _client: SearchClient | null = null
let _index: SearchIndex | null = null

export function getAlgoliaAdminIndex(): SearchIndex | null {
  if (!APP_ID || !ADMIN_KEY || !ALGOLIA_INDEX) return null
  if (_index) return _index
  _client = algoliasearch(APP_ID, ADMIN_KEY)
  _index = _client.initIndex(ALGOLIA_INDEX)
  return _index
}

type ListingRecord = {
  objectID: string
  title: string
  description?: string
  price?: number
  currency?: string
  location?: string
  city?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  propertyType?: string
  listingType?: string
  images?: string[]
  agentId?: string
  agentName?: string
  status?: string
  _geoloc?: { lat: number; lng: number } | undefined
  createdAt?: number
  updatedAt?: number
}

export async function upsertListingToAlgolia(id: string, data: any) {
  const index = getAlgoliaAdminIndex()
  if (!index) return
  const record: ListingRecord = {
    objectID: id,
    title: data.title,
    description: data.description || '',
    price: Number(data.price || 0),
    currency: data.currency || 'USD',
    location: data.location,
    city: data.location?.city || data.city,
    neighborhood: data.location?.neighborhood || data.neighborhood,
    bedrooms: Number(data.bedrooms || 0),
    bathrooms: Number(data.bathrooms || 0),
    area: Number(data.area || 0),
    propertyType: data.propertyType,
    listingType: data.listingType,
    images: Array.isArray(data.images) ? data.images.slice(0, 6) : [],
    agentId: data.agentId,
    agentName: data.agentName,
    status: data.status,
    _geoloc: data.lat && data.lng ? { lat: Number(data.lat), lng: Number(data.lng) } : undefined,
    createdAt: dateToMillis(data.createdAt),
    updatedAt: dateToMillis(data.updatedAt),
  }
  await index.saveObject(record)
}

export async function removeListingFromAlgolia(id: string) {
  const index = getAlgoliaAdminIndex()
  if (!index) return
  await index.deleteObject(id)
}

function dateToMillis(d: any): number | undefined {
  try {
    if (!d) return undefined
    if (typeof d === 'number') return d
    if (typeof d.toMillis === 'function') return d.toMillis()
    const dt = new Date(d)
    const ms = dt.getTime()
    return isNaN(ms) ? undefined : ms
  } catch {
    return undefined
  }
}
