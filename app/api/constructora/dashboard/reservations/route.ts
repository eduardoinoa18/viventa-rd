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

function toIso(value: any): string | null {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.toISOString() : null
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

function belongsToConstructora(project: Record<string, any>, context: {
  uid: string
  constructoraCode: string
  professionalCode: string
}) {
  const ownerCandidates = [
    safeText(project.developerId),
    safeText(project.ownerId),
    safeText(project.constructoraId),
    safeText(project.companyId),
  ].filter(Boolean)

  const scopedCodes = [safeText(context.uid), safeText(context.constructoraCode), safeText(context.professionalCode)].filter(Boolean)
  return ownerCandidates.some((owner) => scopedCodes.includes(owner))
}

function isReservedStatus(value: unknown) {
  const status = safeLower(value)
  return status === 'reserved' || status === 'reservado' || status === 'separado'
}

type ProjectRecord = Record<string, any> & {
  id: string
  name?: unknown
  currency?: unknown
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = safeLower(searchParams.get('q') || '')

    const projectsSnap = await db.collection('projects').limit(600).get()
    const scopedProjects: ProjectRecord[] = projectsSnap.docs
      .map((doc): ProjectRecord => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((project) => belongsToConstructora(project, context))

    const reservations: Array<Record<string, any>> = []

    for (const project of scopedProjects.slice(0, 80)) {
      const unitsSnap = await db.collection('projects').doc(project.id).collection('units').limit(2500).get()
      for (const unitDoc of unitsSnap.docs) {
        const unit = unitDoc.data() as Record<string, any>
        if (!isReservedStatus(unit.status)) continue

        reservations.push({
          id: safeText(unit.reservationId || `${project.id}-${unitDoc.id}`),
          projectId: project.id,
          projectName: safeText(project.name || 'Proyecto'),
          unitId: unitDoc.id,
          unitCode: safeText(unit.unitCode || unit.unitNumber || unitDoc.id),
          status: 'reserved',
          clientName: safeText(unit.clientName || unit.reservedClientName || unit.buyerName || 'Por confirmar'),
          reservationAmount: Number(unit.reservationAmount || unit.depositAmount || 0),
          currency: safeText(unit.currency || project.currency || 'USD') || 'USD',
          updatedAt: toIso(unit.updatedAt || unit.lastStatusChangedAt || unit.createdAt),
        })
      }
    }

    const filtered = reservations.filter((reservation) => {
      if (!query) return true
      return (
        safeLower(reservation.projectName).includes(query) ||
        safeLower(reservation.unitCode).includes(query) ||
        safeLower(reservation.clientName).includes(query)
      )
    })

    return NextResponse.json({
      ok: true,
      total: filtered.length,
      summary: {
        reservedUnits: filtered.length,
        totalReservationAmount: filtered.reduce((sum, item) => sum + Number(item.reservationAmount || 0), 0),
      },
      reservations: filtered.slice(0, 300),
    })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/reservations] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load constructora reservations' }, { status: 500 })
  }
}
