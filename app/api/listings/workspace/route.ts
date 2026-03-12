import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import {
  canMutateListing,
  getListingAccessUserContext,
  resolveOfficeIdFromListing,
} from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

type WorkspaceMode = 'my' | 'mls' | 'all'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const d = value.toDate()
    return d instanceof Date ? d.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function parseMode(value: string | null): WorkspaceMode {
  if (value === 'mls' || value === 'all' || value === 'my') return value
  return 'my'
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    const isAdmin = context.role === 'master_admin' || context.role === 'admin'
    const isProfessional = ['agent', 'broker', 'constructora'].includes(context.role)

    if (!isAdmin && !isProfessional) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const requestedMode = parseMode(searchParams.get('mode'))
    const mode: WorkspaceMode = isAdmin ? requestedMode : requestedMode === 'all' ? 'my' : requestedMode
    const statusFilter = safeLower(searchParams.get('status'))
    const queryText = safeLower(searchParams.get('q'))
    const cityFilter = safeLower(searchParams.get('city'))
    const minPrice = Number(searchParams.get('minPrice') || '')
    const maxPrice = Number(searchParams.get('maxPrice') || '')
    const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || searchParams.get('limit') || '40'), 1), 200)
    const page = Math.max(Number(searchParams.get('page') || '1'), 1)

    const snapshot = await db.collection('properties').limit(2500).get()

    const rows = snapshot.docs
      .map((doc) => {
        const raw = doc.data() as Record<string, unknown>
        const listing = { id: doc.id, ...raw }

        const creatorId = safeText(raw.createdByUserId) || safeText(raw.agentId)
        const listingOfficeId = resolveOfficeIdFromListing(raw)
        const listingConstructoraCode = safeText(raw.constructoraCode)
        const listingProfessionalCode = safeText(raw.professionalCode)

        const canManage = canMutateListing({
          isAdmin,
          userContext: context,
          listing: raw,
        })

        const isMine =
          canManage ||
          creatorId === context.uid ||
          (context.role === 'constructora' && !!context.constructoraCode && context.constructoraCode === listingConstructoraCode) ||
          (!!context.professionalCode && context.professionalCode === listingProfessionalCode) ||
          (context.role === 'broker' && !!context.officeId && context.officeId === listingOfficeId)

        const isMlsCandidate =
          safeLower(raw.status) === 'active' &&
          (!isMine || isAdmin)

        if (mode === 'my' && !isMine) return null
        if (mode === 'mls' && !isMlsCandidate) return null

        const title = safeText(raw.title || raw.name || 'Propiedad')
        const city = safeText(raw.city || raw.location)
        const sector = safeText(raw.sector || raw.neighborhood)
        const status = safeText(raw.status || 'pending').toLowerCase()
        const price = toNumber(raw.price)

        if (statusFilter && status !== statusFilter) return null
        if (queryText) {
          const haystack = `${safeLower(title)} ${safeLower(city)} ${safeLower(sector)} ${safeLower(raw.projectName)}`
          if (!haystack.includes(queryText)) return null
        }
        if (cityFilter && safeLower(city) !== cityFilter) return null
        if (Number.isFinite(minPrice) && minPrice > 0 && price < minPrice) return null
        if (Number.isFinite(maxPrice) && maxPrice > 0 && price > maxPrice) return null

        return {
          id: doc.id,
          listingId: safeText(raw.listingId),
          title,
          description: safeText(raw.description || raw.publicRemarks),
          city,
          sector,
          neighborhood: safeText(raw.neighborhood),
          province: safeText(raw.province || raw.provincia),
          status,
          propertyType: safeText(raw.propertyType),
          listingType: safeText(raw.listingType),
          price,
          currency: safeText(raw.currency || 'USD'),
          bedrooms: toNumber(raw.bedrooms),
          bathrooms: toNumber(raw.bathrooms),
          area: toNumber(raw.area || raw.meters || raw.squareMeters),
          images: Array.isArray(raw.images) ? raw.images : [],
          createdAt: raw.createdAt || null,
          updatedAt: raw.updatedAt || null,
          isMine,
          canManage,
          mlsOnly: Boolean(raw.mlsOnly),
          commissionOffered: toNumber(raw.commissionOffered || raw.commission || raw.cobrokeCommissionPercent),
          showingInstructions: safeText(raw.showingInstructions || raw.showingInstruction),
          internalNotes: safeText(raw.internalNotes || raw.brokerNotes || raw.professionalRemarks),
          privateContactName: safeText(raw.privateContactName || raw.agentName),
          privateContactPhone: safeText(raw.privateContactPhone),
          privateContactEmail: safeText(raw.privateContactEmail || raw.agentEmail),
          responsibleAgent: safeText(raw.agentName),
          responsibleBroker: safeText(raw.brokerName || raw.companyName),
          constructora: safeText(raw.constructora || raw.builderName),
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))

    const total = rows.length
    const start = (page - 1) * pageSize
    const pagedRows = rows.slice(start, start + pageSize)
    const hasMore = start + pageSize < total

    return NextResponse.json({
      ok: true,
      mode,
      count: pagedRows.length,
      total,
      page,
      pageSize,
      hasMore,
      permissions: {
        canCreate: isAdmin || isProfessional,
        canUseMls: true,
        canModerate: context.role === 'master_admin',
        canEditAny: context.role === 'master_admin',
      },
      listings: pagedRows,
    })
  } catch (error: any) {
    console.error('[api/listings/workspace] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load listing workspace' }, { status: 500 })
  }
}
