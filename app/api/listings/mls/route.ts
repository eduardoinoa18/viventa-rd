// app/api/listings/mls/route.ts
// Internal MLS search — returns non-public fields to verified agents/brokers/constructoras
// Public buyers never hit this endpoint.
import { NextResponse } from 'next/server'
import type { Query } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function safe(v: unknown): string { return String(v ?? '').trim() }
function num(v: unknown): number  { const n = Number(v); return Number.isFinite(n) ? n : 0 }

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Auth required' }, { status: 401 })

    const role = (session.role as string) || 'buyer'
    const allowed = ['agent', 'broker', 'constructora', 'master_admin', 'admin']
    if (!allowed.includes(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)

    // ─── Parse query params ─────────────────────────────────────────────────
    const q            = safe(searchParams.get('q')).toLowerCase()
    const city         = safe(searchParams.get('city'))
    const sector       = safe(searchParams.get('sector'))
    const propertyType = safe(searchParams.get('propertyType'))
    const listingType  = safe(searchParams.get('listingType'))
    const minPrice     = num(searchParams.get('minPrice'))
    const maxPrice     = num(searchParams.get('maxPrice'))
    const minBeds      = num(searchParams.get('minBeds'))
    const minBaths     = num(searchParams.get('minBaths'))
    const minArea      = num(searchParams.get('minArea'))
    const cobroke      = searchParams.get('cobroke') === 'true'   // filter MLS-shared only
    const minCommission = num(searchParams.get('minCommission'))
    const pageSize     = Math.min(Math.max(num(searchParams.get('pageSize') || '60'), 1), 200)
    const page         = Math.max(num(searchParams.get('page') || '1'), 1)

    // ─── Base query: only active listings ──────────────────────────────────
    let baseQuery: Query = db.collection('properties').where('status', '==', 'active')

    // Apply Firestore-level filters where simple equality allows it
    if (city)         baseQuery = baseQuery.where('city', '==', city)
    if (propertyType) baseQuery = baseQuery.where('propertyType', '==', propertyType)
    if (listingType)  baseQuery = baseQuery.where('listingType', '==', listingType)

    baseQuery = baseQuery.orderBy('updatedAt', 'desc').limit(1200)

    const snap = await baseQuery.get()

    // ─── In-memory refinement (non-Firestore-indexable fields) ─────────────
    const items = snap.docs
      .map((doc) => {
        const d = doc.data() as Record<string, any>

        // Text search
        if (q) {
          const hay = [d.title, d.city, d.sector, d.province, d.description, d.publicRemarks, d.brokerName, d.constructora]
            .map((s) => safe(s).toLowerCase())
            .join(' ')
          if (!hay.includes(q)) return null
        }

        if (sector && safe(d.sector).toLowerCase() !== sector.toLowerCase()) return null
        if (minPrice > 0 && num(d.price) < minPrice) return null
        if (maxPrice > 0 && num(d.price) > maxPrice) return null
        if (minBeds  > 0 && num(d.bedrooms)  < minBeds)  return null
        if (minBaths > 0 && num(d.bathrooms) < minBaths) return null
        if (minArea  > 0 && num(d.area) < minArea)       return null
        if (cobroke  && !d.mlsOnly && num(d.cobrokeCommissionPercent) === 0) return null
        if (minCommission > 0 && num(d.cobrokeCommissionPercent) < minCommission) return null

        // ─── Full non-public payload for authenticated professionals ────────
        return {
          id: doc.id,
          listingId:             safe(d.listingId || doc.id),
          title:                 safe(d.title),
          description:           safe(d.description),
          publicRemarks:         safe(d.publicRemarks),
          price:                 num(d.price),
          currency:              safe(d.currency || 'USD'),
          propertyType:          safe(d.propertyType),
          listingType:           safe(d.listingType),
          bedrooms:              num(d.bedrooms),
          bathrooms:             num(d.bathrooms),
          area:                  num(d.area),
          parking:               num(d.parking),
          city:                  safe(d.city),
          sector:                safe(d.sector),
          province:              safe(d.province),
          address:               safe(d.address),
          lat:                   num(d.lat),
          lng:                   num(d.lng),
          deslindadoStatus:      safe(d.deslindadoStatus),
          furnishedStatus:       safe(d.furnishedStatus),
          features:              Array.isArray(d.features) ? d.features : [],
          images:                Array.isArray(d.images) ? d.images : [],
          coverImage:            safe(d.coverImage),
          maintenanceFee:        num(d.maintenanceFee),
          hoaIncludedItems:      Array.isArray(d.hoaIncludedItems) ? d.hoaIncludedItems : [],
          mlsOnly:               Boolean(d.mlsOnly),
          // ── NON-PUBLIC MLS fields ──────────────────────────────────────────
          cobrokeCommissionPercent: num(d.cobrokeCommissionPercent),
          commissionType:           safe(d.commissionType),
          showingInstructions:      safe(d.showingInstructions),
          internalNotes:            safe(d.internalNotes),
          privateContactName:       safe(d.privateContactName),
          privateContactPhone:      safe(d.privateContactPhone),
          privateContactEmail:      safe(d.privateContactEmail),
          // ── Ownership ─────────────────────────────────────────────────────
          agentId:        safe(d.agentId),
          brokerId:       safe(d.brokerId),
          brokerName:     safe(d.brokerName),
          constructora:   safe(d.constructora),
          // ── Quality signals ────────────────────────────────────────────────
          qualityScore:   num(d.qualityScore),
          isVerified:     Boolean(d.isVerified),
          updatedAt:      d.updatedAt || null,
          createdAt:      d.createdAt || null,
        }
      })
      .filter(Boolean) as Record<string, any>[]

    const total = items.length
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return NextResponse.json({
      ok: true,
      count: paged.length,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
      listings: paged,
    })
  } catch (err: any) {
    console.error('[listings/mls] GET error', err)
    return NextResponse.json({ ok: false, error: 'Failed to load MLS listings' }, { status: 500 })
  }
}
