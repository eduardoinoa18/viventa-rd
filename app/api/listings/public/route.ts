import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeTimestamp(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date : null
  }
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function serializeListing(id: string, data: Record<string, any>) {
  return {
    id,
    listingId: safeText(data.listingId),
    title: safeText(data.title || data.name || 'Propiedad'),
    description: safeText(data.description || data.publicRemarks),
    price: Number(data.price || 0),
    currency: safeText(data.currency || 'USD') || 'USD',
    propertyType: safeText(data.propertyType),
    listingType: safeText(data.listingType),
    city: safeText(data.city),
    sector: safeText(data.sector || data.neighborhood),
    bedrooms: Number(data.bedrooms || 0),
    bathrooms: Number(data.bathrooms || 0),
    area: Number(data.area || 0),
    images: Array.isArray(data.images) ? data.images : [],
    photos: Array.isArray(data.images) ? data.images : [],
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  }
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const agentId = safeText(searchParams.get('agentId'))
    const brokerId = safeText(searchParams.get('brokerId'))
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '24'), 1), 100)
    const statusParam = safeText(searchParams.get('status')).toLowerCase()
    const status = ['active', 'sold', 'rented', 'all'].includes(statusParam) ? statusParam : 'active'

    const rows = new Map<string, Record<string, any>>()
    const addSnapshot = (docs: Array<{ id: string; data: () => any }>) => {
      docs.forEach((doc) => rows.set(doc.id, doc.data() || {}))
    }

    const fetchByField = async (field: string, value: string) => {
      if (status === 'all') {
        return db.collection('properties').where(field, '==', value).limit(limit).get()
      }
      return db.collection('properties').where('status', '==', status).where(field, '==', value).limit(limit).get()
    }

    if (agentId) {
      const snap = await fetchByField('agentId', agentId)
      addSnapshot(snap.docs)
    } else if (brokerId) {
      const [byBrokerId, byCreatedByBrokerId, byBrokerageId] = await Promise.all([
        fetchByField('brokerId', brokerId),
        fetchByField('createdByBrokerId', brokerId),
        fetchByField('brokerageId', brokerId),
      ])

      addSnapshot(byBrokerId.docs)
      addSnapshot(byCreatedByBrokerId.docs)
      addSnapshot(byBrokerageId.docs)
    } else {
      const baseRef = db.collection('properties')
      const snap = status === 'all'
        ? await baseRef.limit(limit).get()
        : await baseRef.where('status', '==', status).limit(limit).get()
      addSnapshot(snap.docs)
    }

    const listings = Array.from(rows.entries())
      .map(([id, data]) => serializeListing(id, data))
      .sort((a, b) => {
        const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bTime - aTime
      })
      .slice(0, limit)

    return NextResponse.json({ ok: true, listings, total: listings.length })
  } catch (error: any) {
    console.error('[api/listings/public] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch public listings', listings: [], total: 0 }, { status: 500 })
  }
}
