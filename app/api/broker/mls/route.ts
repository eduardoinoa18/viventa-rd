import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function parseNumberFilter(value: string | null): number | null {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (!['broker', 'agent', 'master_admin', 'admin'].includes(context.role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = safeLower(searchParams.get('q'))
    const city = safeLower(searchParams.get('city'))
    const provincia = safeLower(searchParams.get('provincia'))
    const project = safeLower(searchParams.get('project'))
    const constructora = safeLower(searchParams.get('constructora'))
    const propertyType = safeLower(searchParams.get('propertyType'))
    const status = safeLower(searchParams.get('status') || 'active')
    const minPrice = parseNumberFilter(searchParams.get('minPrice'))
    const maxPrice = parseNumberFilter(searchParams.get('maxPrice'))
    const minBeds = parseNumberFilter(searchParams.get('minBeds'))
    const minCommission = parseNumberFilter(searchParams.get('minCommission'))
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 60), 1), 200)

    const snap = await db.collection('properties').where('status', '==', status).limit(2500).get()
    const data = snap.docs
      .map((doc): Record<string, any> => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((row) => {
        const title = safeLower(row.title || row.name)
        const rowCity = safeLower(row.city)
        const rowProvince = safeLower(row.province || row.provincia)
        const rowSector = safeLower(row.sector)
        const rowProject = safeLower(row.projectName || row.project)
        const rowConstructora = safeLower(row.constructora || row.builderName || row.developerName)
        const rowPropertyType = safeLower(row.propertyType || row.listingType)
        const rowPrice = toNumber(row.price)
        const rowBeds = toNumber(row.bedrooms)
        const rowCommission = toNumber(row.commissionOffered || row.commission || row.commissionPct)

        if (q && !title.includes(q) && !rowCity.includes(q) && !rowSector.includes(q) && !rowProject.includes(q)) return false
        if (city && rowCity !== city) return false
        if (provincia && rowProvince !== provincia) return false
        if (project && !rowProject.includes(project)) return false
        if (constructora && !rowConstructora.includes(constructora)) return false
        if (propertyType && rowPropertyType !== propertyType) return false
        if (minPrice !== null && rowPrice < minPrice) return false
        if (maxPrice !== null && rowPrice > maxPrice) return false
        if (minBeds !== null && rowBeds < minBeds) return false
        if (minCommission !== null && rowCommission < minCommission) return false
        return true
      })
      .sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        title: safeText(row.title || row.name || 'Propiedad'),
        city: safeText(row.city || 'RD'),
        sector: safeText(row.sector),
        province: safeText(row.province || row.provincia),
        propertyType: safeText(row.propertyType || row.listingType),
        listingType: safeText(row.listingType || row.operationType),
        price: toNumber(row.price),
        bedrooms: toNumber(row.bedrooms),
        bathrooms: toNumber(row.bathrooms),
        parking: toNumber(row.parking || row.parqueos),
        meters: toNumber(row.area || row.meters || row.squareMeters),
        status: safeText(row.status || 'active'),
        project: safeText(row.projectName || row.project),
        constructora: safeText(row.constructora || row.builderName || row.developerName),
        showingInstructions: safeText(row.showingInstructions || row.showingInstruction || row.visitNotes),
        commissionOffered: toNumber(row.commissionOffered || row.commission),
        responsibleAgent: safeText(row.agentName || row.createdByName),
        responsibleBroker: safeText(row.brokerName || row.brokerage),
        priceHistory: Array.isArray(row.priceHistory) ? row.priceHistory : [],
        internalNotes: safeText(row.internalNotes),
        documentsCount: Array.isArray(row.documents) ? row.documents.length : 0,
        updatedAt: row.updatedAt || row.createdAt || null,
      }))

    return NextResponse.json({
      ok: true,
      count: data.length,
      listings: data,
    })
  } catch (error: any) {
    console.error('[api/broker/mls] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load MLS listings' }, { status: 500 })
  }
}
