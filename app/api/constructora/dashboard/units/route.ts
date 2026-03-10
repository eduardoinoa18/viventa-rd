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

function normalizeUnitStatus(value: unknown) {
  const status = safeLower(value)
  if (status === 'disponible') return 'available'
  if (status === 'reservado' || status === 'separado') return 'reserved'
  if (status === 'vendido') return 'sold'
  if (status === 'en-proceso' || status === 'in_process' || status === 'in-process') return 'in_process'
  if (status === 'bloqueado') return 'blocked'
  return status || 'available'
}

type ProjectRecord = Record<string, any> & {
  id: string
  name?: unknown
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
    const statusFilter = safeLower(searchParams.get('status') || 'all')
    const search = safeLower(searchParams.get('q') || '')
    const projectFilter = safeText(searchParams.get('projectId') || '')

    const projectsSnap = await db.collection('projects').limit(600).get()
    const scopedProjects: ProjectRecord[] = projectsSnap.docs
      .map((doc): ProjectRecord => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((project) => belongsToConstructora(project, context))

    const scopedProjectIds = new Set(scopedProjects.map((project) => project.id))
    const projectMap = new Map(scopedProjects.map((project) => [project.id, safeText(project.name || 'Proyecto')]))

    const allUnits: Array<Record<string, any>> = []

    for (const project of scopedProjects.slice(0, 80)) {
      const unitsSnap = await db.collection('projects').doc(project.id).collection('units').limit(2500).get()
      for (const unitDoc of unitsSnap.docs) {
        const unit = unitDoc.data() as Record<string, any>
        allUnits.push({
          id: unitDoc.id,
          projectId: project.id,
          projectName: projectMap.get(project.id) || 'Proyecto',
          unitCode: safeText(unit.unitCode || unit.unitNumber || unitDoc.id),
          phase: safeText(unit.phase || ''),
          propertyType: safeText(unit.propertyType || ''),
          beds: Number(unit.beds || unit.bedrooms || 0),
          baths: Number(unit.baths || unit.bathrooms || 0),
          price: Number(unit.price || unit.priceUSD || 0),
          reservationId: safeText(unit.reservationId || ''),
          status: normalizeUnitStatus(unit.status),
          updatedAt: unit.updatedAt || null,
        })
      }
    }

    const summary = {
      total: allUnits.length,
      available: allUnits.filter((unit) => unit.status === 'available').length,
      reserved: allUnits.filter((unit) => unit.status === 'reserved').length,
      sold: allUnits.filter((unit) => unit.status === 'sold').length,
      inProcess: allUnits.filter((unit) => unit.status === 'in_process').length,
      blocked: allUnits.filter((unit) => unit.status === 'blocked').length,
    }

    const filtered = allUnits.filter((unit) => {
      if (!scopedProjectIds.has(unit.projectId)) return false
      if (statusFilter !== 'all' && unit.status !== statusFilter) return false
      if (projectFilter && unit.projectId !== projectFilter) return false
      if (!search) return true

      return (
        safeLower(unit.unitCode).includes(search) ||
        safeLower(unit.projectName).includes(search) ||
        safeLower(unit.phase).includes(search)
      )
    })

    const units = filtered.slice(0, 300)
    const projects = scopedProjects.map((project) => ({ id: project.id, name: safeText(project.name || 'Proyecto') }))

    return NextResponse.json({ ok: true, units, summary, projects, total: filtered.length })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/units] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load constructora units' }, { status: 500 })
  }
}
